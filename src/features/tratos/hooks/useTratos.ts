// Hook para listar tratos. Los filtros se envían al back como query params opcionales.

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { listItems, toPageResponse, type ListResponse } from '@/api/pagination';
import type { ListQueryOptions, PageResponse, Trato } from '@/api/types';
import { sortNullableLast } from '@/components/shared/listPaging';
import type { TratoFilters } from '../lib/tratoFilters';

type TratoListQuery = Partial<TratoFilters> & ListQueryOptions;

function sortTratos(items: Trato[], sortBy?: string, direction?: 'asc' | 'desc'): Trato[] {
  if (!sortBy || !direction) return items;

  const getters: Record<string, (trato: Trato) => string | number | null | undefined> = {
    nombre: (trato) => trato.nombre,
    valorEstimado: (trato) => trato.valorEstimado,
    probabilidad: (trato) => trato.probabilidad,
    fechaCierreEsperada: (trato) => trato.fechaCierreEsperada,
    creadoEn: (trato) => trato.creadoEn,
    actualizadoEn: (trato) => trato.actualizadoEn,
  };
  const getValue = getters[sortBy];
  return getValue ? sortNullableLast(items, getValue, direction) : items;
}

interface UseTratosOptions {
  enabled?: boolean;
}

export const tratosKeys = {
  all: ['tratos'] as const,
  list: (filters?: TratoListQuery) =>
    filters ? (['tratos', filters] as const) : (['tratos'] as const),
  detail: (id: string) => ['tratos', id] as const,
};

export function useTratos(
  filters?: TratoListQuery,
  options?: UseTratosOptions,
): UseQueryResult<Trato[]> {
  return useQuery<Trato[]>({
    queryKey: tratosKeys.list(filters),
    queryFn: async () => listItems(await apiClient.get<ListResponse<Trato>>(endpoints.tratos.getAll(filters))),
    enabled: options?.enabled ?? true,
  });
}

export function useTratosPage(filters: TratoListQuery): UseQueryResult<PageResponse<Trato>> {
  return useQuery<PageResponse<Trato>>({
    queryKey: tratosKeys.list(filters),
    queryFn: async () => toPageResponse(
      await apiClient.get<ListResponse<Trato>>(endpoints.tratos.getAll(filters)),
      filters.page ?? 0,
      filters.pageSize ?? 25,
      { sortItems: (items) => sortTratos(items, filters.sortBy, filters.sortDirection) },
    ),
  });
}
