import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { Product } from '../types/product';

export const useAdjustStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, quantity }: { productId: number; quantity: number }) => {
      const { data } = await apiClient.post<Product>(`/products/${productId}/adjust-stock`, { quantity });
      return data;
    },
    onSuccess: () => {
      // Invalida el catálogo de productos para forzar la recarga del stock disponible
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};
