// Hook para listar tratos. Los filtros se envían al back como query params opcionales.

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import type { Trato } from '@/api/types';
import type { TratoFilters } from '../lib/tratoFilters';

export const tratosKeys = {
  all: ['tratos'] as const,
  list: (filters?: Partial<TratoFilters>) =>
    filters ? (['tratos', filters] as const) : (['tratos'] as const),
  detail: (id: string) => ['tratos', id] as const,
};

export function useTratos(filters?: Partial<TratoFilters>): UseQueryResult<Trato[]> {
  return useQuery<Trato[]>({
    queryKey: tratosKeys.list(filters),
    queryFn: () => apiClient.get<Trato[]>(endpoints.tratos.getAll(filters)),
  });
}
