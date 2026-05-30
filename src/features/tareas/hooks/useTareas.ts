// ADR-048 — Hook para listar tareas (filtros client-side).
// queryKey: ['tareas'] plano — NO embebe filtros (B1 fix, W-01).
// Filtros se aplican en los componentes consumidores (useMemo sobre el array completo).

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import type { EstadoTareaLocal, PrioridadTarea, TipoTarea, Tarea } from '@/api/types';

export interface UseTareasFilters {
  trato_id?: string;
  responsable_id?: string;
  estado?: EstadoTareaLocal;
  prioridad?: PrioridadTarea;
  vencimiento?: 'vencidas' | 'proximas' | 'todas';
  tipo?: TipoTarea;
}

export const tareasKeys = {
  all: ['tareas'] as const,
  list: () => ['tareas'] as const,
  detail: (id: string) => ['tareas', id] as const,
  byTrato: (_tratoId: string) => ['tareas'] as const,
};

export function useTareas(): UseQueryResult<Tarea[]> {
  return useQuery<Tarea[]>({
    queryKey: tareasKeys.all,
    queryFn: () => apiClient.get<Tarea[]>(endpoints.tareas.getAll()),
  });
}
