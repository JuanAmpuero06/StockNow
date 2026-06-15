import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Product } from '../types/product';
import type { Order } from './useOrders';

export const useWebSocketSync = (token: string | null) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token) return;

    // Conexión dinámica al host donde corre la API (puerto 8000 en docker-compose)
    const wsUrl = `ws://localhost:8000/api/v1/ws`;
    let ws = new WebSocket(wsUrl);
    let reconnectTimeout: number | undefined;

    const connect = () => {
      ws.onopen = () => {
        console.log('🚀 WebSocket: Conectado al canal de sincronización en tiempo real.');
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('🚀 WebSocket: Evento recibido:', message.type, message);

          // Buscar todas las queries activas en el caché de TanStack Query que empiecen con ['products']
          const productQueries = queryClient.getQueryCache().findAll({ queryKey: ['products'] });

          switch (message.type) {
            case 'STOCK_UPDATE': {
              const updatedProducts: Product[] = message.products;
              productQueries.forEach((query) => {
                queryClient.setQueryData<Product[]>(query.queryKey, (oldProducts) => {
                  if (!oldProducts) return oldProducts;
                  return oldProducts.map((p) => {
                    const match = updatedProducts.find((up) => up.id === p.id);
                    return match ? { ...p, inventory: match.inventory } : p;
                  });
                });
              });
              break;
            }
            case 'PRODUCT_CREATED': {
              const newProduct: Product = message.product;
              productQueries.forEach((query) => {
                queryClient.setQueryData<Product[]>(query.queryKey, (oldProducts) => {
                  if (!oldProducts) return [newProduct];
                  if (oldProducts.some((p) => p.id === newProduct.id)) return oldProducts;
                  return [...oldProducts, newProduct];
                });
              });
              break;
            }
            case 'PRODUCT_UPDATED': {
              const updatedProduct: Product = message.product;
              productQueries.forEach((query) => {
                queryClient.setQueryData<Product[]>(query.queryKey, (oldProducts) => {
                  if (!oldProducts) return oldProducts;
                  return oldProducts.map((p) => (p.id === updatedProduct.id ? updatedProduct : p));
                });
              });
              break;
            }
            case 'PRODUCT_DELETED': {
              const deletedProductId: number = message.product_id;
              productQueries.forEach((query) => {
                queryClient.setQueryData<Product[]>(query.queryKey, (oldProducts) => {
                  if (!oldProducts) return oldProducts;
                  return oldProducts.filter((p) => p.id !== deletedProductId);
                });
              });
              break;
            }
            case 'ORDER_CREATED': {
              const newOrder: Order = message.order;
              queryClient.setQueryData<Order[]>(['orders'], (oldOrders) => {
                if (!oldOrders) return [newOrder];
                if (oldOrders.some((o) => o.id === newOrder.id)) return oldOrders;
                return [newOrder, ...oldOrders];
              });
              break;
            }
            case 'ORDER_UPDATED': {
              const updatedOrder: Order = message.order;
              queryClient.setQueryData<Order[]>(['orders'], (oldOrders) => {
                if (!oldOrders) return oldOrders;
                return oldOrders.map((o) => (o.id === updatedOrder.id ? updatedOrder : o));
              });
              break;
            }
            default:
              break;
          }
        } catch (err) {
          console.error('🚀 WebSocket: Error al procesar mensaje recibido:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('🚀 WebSocket: Error en la conexión:', error);
      };

      ws.onclose = () => {
        console.log('🚀 WebSocket: Conexión cerrada. Intentando reconexión en 5 segundos...');
        reconnectTimeout = window.setTimeout(() => {
          ws = new WebSocket(wsUrl);
          connect();
        }, 5000);
      };
    };

    connect();

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      ws.onclose = null; // Previene bucle de reconexión al desmontar
      ws.close();
    };
  }, [token, queryClient]);
};
