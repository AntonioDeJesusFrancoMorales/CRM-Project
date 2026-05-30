import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import type { Rol } from '@/api/types';

export function useRoles(): UseQueryResult<Rol[]> {
  return useQuery<Rol[]>({
    queryKey: ['roles'],
    queryFn: () => apiClient.get<Rol[]>(endpoints.roles.getAll()),
  });
}
