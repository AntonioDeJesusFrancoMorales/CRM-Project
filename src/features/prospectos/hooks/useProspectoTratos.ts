import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import type { Trato } from '@/api/types';
import { prospectosKeys } from './useProspectos';

// ADR-027: carga lazy — solo habilitado cuando el usuario activa el tab de Tratos.
export function useProspectoTratos(
  id: string | undefined,
  enabled = true,
): UseQueryResult<Trato[]> {
  return useQuery<Trato[]>({
    queryKey: prospectosKeys.tratos(id ?? ''),
    queryFn: () => apiClient.get<Trato[]>(`/prospectos/${id}/tratos`),
    enabled: !!id && enabled,
  });
}
