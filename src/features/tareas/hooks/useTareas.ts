// Hook para listar tareas. Los filtros persistidos en back se envían como query params.
// `estado`/workflow de tarea se deriva de Kanban y NO se serializa al backend.

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { listItems, toPageResponse, type ListResponse } from '@/api/pagination';
import type { ListQueryOptions, PageResponse, PrioridadTarea, TipoTarea, Tarea } from '@/api/types';
import { sortNullableLast } from '@/components/shared/listPaging';

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

type TareaListQuery = Partial<UseTareasFilters> & { search?: string; responsableId?: string; tratoId?: string } & ListQueryOptions;

function sortTareas(items: Tarea[], sortBy?: string, direction?: 'asc' | 'desc'): Tarea[] {
  if (!sortBy || !direction) return items;

  const getters: Record<string, (tarea: Tarea) => string | number | null | undefined> = {
    titulo: (tarea) => tarea.titulo,
    tipo: (tarea) => tarea.tipo,
    prioridad: (tarea) => tarea.prioridad,
    fechaLimite: (tarea) => tarea.fechaLimite,
    creadoEn: (tarea) => tarea.creadoEn,
    actualizadoEn: (tarea) => tarea.actualizadoEn,
  };
  const getValue = getters[sortBy];
  return getValue ? sortNullableLast(items, getValue, direction) : items;
}

function toApiFilters(filters?: TareaListQuery) {
  return {
    search: filters?.search,
    prioridad: filters?.prioridad,
    responsableId: filters?.responsableId ?? filters?.responsable_id,
    tratoId: filters?.tratoId ?? filters?.trato_id,
    tipo: filters?.tipo,
    vencimiento: filters?.vencimiento,
    page: filters?.page,
    pageSize: filters?.pageSize,
    sortBy: filters?.sortBy,
    sortDirection: filters?.sortDirection,
  };
}

export function useTareas(filters?: TareaListQuery): UseQueryResult<Tarea[]> {
  return useQuery<Tarea[]>({
    queryKey: tareasKeys.list(filters),
    queryFn: async () => listItems(await apiClient.get<ListResponse<Tarea>>(endpoints.tareas.getAll(toApiFilters(filters)))),
  });
}

export function useTareasPage(filters: TareaListQuery): UseQueryResult<PageResponse<Tarea>> {
  return useQuery<PageResponse<Tarea>>({
    queryKey: tareasKeys.list(filters),
    queryFn: async () => toPageResponse(
      await apiClient.get<ListResponse<Tarea>>(endpoints.tareas.getAll(toApiFilters(filters))),
      filters.page ?? 0,
      filters.pageSize ?? 25,
      { sortItems: (items) => sortTareas(items, filters.sortBy, filters.sortDirection) },
    ),
  });
}
