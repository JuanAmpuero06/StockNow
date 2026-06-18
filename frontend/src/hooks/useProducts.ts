import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { Product } from '../types/product';

// Función pura que habla con el backend
const fetchProducts = async (skip = 0, limit = 10, search = '', lowStock = false): Promise<Product[]> => {
  const params = new URLSearchParams();
  params.append('skip', skip.toString());
  params.append('limit', limit.toString());
  if (search) params.append('search', search);
  if (lowStock) params.append('low_stock', 'true');

  const { data } = await apiClient.get<Product[]>(`/products/?${params.toString()}`);
  return data;
};

// El hook que usará el componente
export const useProducts = (skip = 0, limit = 10, search = '', lowStock = false) => {
  return useQuery({
    queryKey: ['products', { skip, limit, search, lowStock }],
    queryFn: () => fetchProducts(skip, limit, search, lowStock),
    staleTime: 1000 * 60 * 2, // Considerar los datos "limpios" por 2 minutos antes de re-verificar
  });
};