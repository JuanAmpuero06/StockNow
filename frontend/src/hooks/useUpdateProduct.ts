import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { Product } from '../types/product';

interface UpdateProductPayload {
  name: string;
  description?: string;
  price: number;
}

const updateProduct = async ({ id, payload }: { id: number; payload: UpdateProductPayload }): Promise<Product> => {
  const { data } = await apiClient.put<Product>(`/products/${id}`, payload);
  return data;
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};