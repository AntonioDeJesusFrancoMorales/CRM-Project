import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import type { Prospecto } from '@/api/types';
import { prospectosKeys } from './useProspectos';

export function useProspecto(id: string | undefined): UseQueryResult<Prospecto> {
  return useQuery<Prospecto>({
    queryKey: prospectosKeys.detail(id ?? ''),
    queryFn: () => apiClient.get<Prospecto>(`/prospectos/${id}`),
    enabled: !!id,
  });
}
