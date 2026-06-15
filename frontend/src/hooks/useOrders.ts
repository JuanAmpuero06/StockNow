import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
}

export interface Order {
  id: number;
  user_id: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  total_amount: number;
  created_at: string;
  items: OrderItem[];
}

const fetchOrders = async (): Promise<Order[]> => {
  const { data } = await apiClient.get<Order[]>('/orders/');
  return data;
};

export const useOrders = () => {
  return useQuery({
    queryKey: ['orders'],
    queryFn: fetchOrders,
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = queryClientHook();
  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: 'completed' | 'cancelled' | 'processing' }) => {
      const { data } = await apiClient.put<Order>(`/orders/${orderId}/status`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

// Helper temporal para corregir la invocación de useQueryClient
function queryClientHook() {
  return useQueryClient();
}
