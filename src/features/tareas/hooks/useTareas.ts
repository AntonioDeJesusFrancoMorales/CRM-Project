// Hook para listar tareas. Los filtros persistidos en back se envían como query params.
// `estado`/workflow de tarea se deriva de Kanban y NO se serializa al backend.

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import type { PrioridadTarea, TipoTarea, Tarea } from '@/api/types';

export interface UseTareasFilters {
  trato_id?: string;
  responsable_id?: string;
  estado?: string;
  prioridad?: PrioridadTarea;
  vencimiento?: 'vencidas' | 'proximas' | 'todas';
  tipo?: TipoTarea;
}

export const tareasKeys = {
  all: ['tareas'] as const,
  list: (filters?: Partial<UseTareasFilters> & { search?: string }) =>
    filters ? (['tareas', filters] as const) : (['tareas'] as const),
  detail: (id: string) => ['tareas', id] as const,
  byTrato: (_tratoId: string) => ['tareas'] as const,
};

export function useTareas(filters?: Partial<UseTareasFilters> & { search?: string; responsableId?: string; tratoId?: string }): UseQueryResult<Tarea[]> {
  return useQuery<Tarea[]>({
    queryKey: tareasKeys.list(filters),
    queryFn: () => apiClient.get<Tarea[]>(endpoints.tareas.getAll({
      search: filters?.search,
      prioridad: filters?.prioridad,
      responsableId: filters?.responsableId ?? filters?.responsable_id,
      tratoId: filters?.tratoId ?? filters?.trato_id,
      tipo: filters?.tipo,
      vencimiento: filters?.vencimiento,
    })),
  });
}
