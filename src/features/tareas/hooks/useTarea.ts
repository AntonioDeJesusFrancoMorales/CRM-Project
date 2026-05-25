import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import type { Tarea } from '@/api/types';
import { tareasKeys } from './useTareas';

export function useTarea(id: string | undefined): UseQueryResult<Tarea> {
  return useQuery<Tarea>({
    queryKey: tareasKeys.detail(id ?? ''),
    queryFn: () => apiClient.get<Tarea>(`/tareas/${id}`),
    enabled: !!id,
  });
}
