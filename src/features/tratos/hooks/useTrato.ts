import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import type { Trato } from '@/api/types';
import { tratosKeys } from './useTratos';

export function useTrato(id: string | undefined): UseQueryResult<Trato> {
  return useQuery<Trato>({
    queryKey: tratosKeys.detail(id ?? ''),
    queryFn: () => apiClient.get<Trato>(endpoints.tratos.getById(id!)),
    enabled: !!id,
  });
}
