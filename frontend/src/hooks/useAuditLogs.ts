import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export interface AuditLog {
  id: number;
  product_id: number;
  user_id: number;
  quantity_changed: number;
  reason: string;
  created_at: string;
  product: {
    id: number;
    sku: string;
    name: string;
  };
  user: {
    id: number;
    email: string;
    role: string;
  };
}

const fetchAuditLogs = async (): Promise<AuditLog[]> => {
  const { data } = await apiClient.get<AuditLog[]>('/products/audit-logs');
  return data;
};

export const useAuditLogs = (enabled = true) => {
  return useQuery({
    queryKey: ['audit-logs'],
    queryFn: fetchAuditLogs,
    enabled,
  });
};
