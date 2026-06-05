import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { Product } from '../types/product';

// Definimos lo que requiere el backend para crear un producto
interface CreateProductPayload {
  sku: string;
  name: string;
  description?: string;
  price: number;
  initial_stock: number;
}

const createProduct = async (payload: CreateProductPayload): Promise<Product> => {
  const { data } = await apiClient.post<Product>('/products/', payload);
  return data;
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      // ⚡ INVALIDACIÓN DE CACHÉ EN EL FRONTEND:
      // Esto le dice a React Query que borre la caché de 'products'
      // provocando que el Dashboard se refresque solo.
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};