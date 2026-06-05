import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { Product } from '../types/product';

// Función pura que habla con el backend
const fetchProducts = async (skip = 0, limit = 10): Promise<Product[]> => {
  const { data } = await apiClient.get<Product[]>(`/products/?skip=${skip}&limit=${limit}`);
  return data;
};

// El hook que usará el componente
export const useProducts = (skip = 0, limit = 10) => {
  return useQuery({
    queryKey: ['products', { skip, limit }],
    queryFn: () => fetchProducts(skip, limit),
    staleTime: 1000 * 60 * 2, // Considerar los datos "limpios" por 2 minutos antes de re-verificar
  });
};