// ADR-048 — Hook paramétrico para listar tareas con filtros server-side.
// Filtros embebidos en queryKey para que TanStack refetchee al cambiar.
// byTrato(tratoId) es alias de list({ trato_id: tratoId }) para mayor legibilidad.

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import type { EstadoTarea, TipoTarea, Tarea } from '@/api/types';

export interface UseTareasFilters {
  trato_id?: string;
  responsable_id?: string;
  estado?: EstadoTarea;
  prioridad?: 1 | 2 | 3;
  vencimiento?: 'vencidas' | 'proximas' | 'todas';
  tipo?: TipoTarea;
}

export const tareasKeys = {
  all: ['tareas'] as const,
  list: (filters?: UseTareasFilters) => ['tareas', filters ?? {}] as const,
  detail: (id: string) => ['tareas', id] as const,
  byTrato: (tratoId: string) => ['tareas', { trato_id: tratoId }] as const,
};

export function useTareas(filters?: UseTareasFilters): UseQueryResult<Tarea[]> {
  return useQuery<Tarea[]>({
    queryKey: tareasKeys.list(filters),
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters?.trato_id) params.set('trato_id', filters.trato_id);
      if (filters?.responsable_id) params.set('responsable_id', filters.responsable_id);
      if (filters?.estado) params.set('estado', filters.estado);
      if (filters?.prioridad) params.set('prioridad', String(filters.prioridad));
      if (filters?.vencimiento) params.set('vencimiento', filters.vencimiento);
      if (filters?.tipo) params.set('tipo', filters.tipo);
      const qs = params.toString();
      return apiClient.get<Tarea[]>(qs ? `/tareas?${qs}` : '/tareas');
    },
  });
}
