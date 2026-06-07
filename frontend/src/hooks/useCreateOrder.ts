import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';

interface OrderItemPayload {
  product_id: number;
  quantity: number;
}

interface CreateOrderPayload {
  items: OrderItemPayload[];
}

export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateOrderPayload) => {
      const { data } = await apiClient.post('/orders/', payload);
      return data;
    },
    onSuccess: () => {
      // ⚡ Invalida la caché para forzar al Dashboard a traer los nuevos stocks (reservado y disponible)
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};