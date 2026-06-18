import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export interface DashboardStats {
  total_products: number;
  low_stock_count: number;
  pending_orders: number;
  total_sales: number;
}

const fetchDashboardStats = async (): Promise<DashboardStats> => {
  const { data } = await apiClient.get<DashboardStats>('/dashboard/stats');
  return data;
};

export const useDashboardStats = (enabled = true) => {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: fetchDashboardStats,
    enabled,
    refetchInterval: 10000, // Refrescar automáticamente cada 10 segundos
  });
};
