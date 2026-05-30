// Hook para listar todos los tratos. queryKey plana ['tratos']; filtros client-side.
// El endpoint no acepta query params — el back no filtra server-side.

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import type { Trato } from '@/api/types';

export const tratosKeys = {
  all: ['tratos'] as const,
  detail: (id: string) => ['tratos', id] as const,
};

export function useTratos(): UseQueryResult<Trato[]> {
  return useQuery<Trato[]>({
    queryKey: tratosKeys.all,
    queryFn: () => apiClient.get<Trato[]>(endpoints.tratos.getAll()),
  });
}
