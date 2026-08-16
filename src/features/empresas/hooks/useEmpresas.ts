import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { listItems, toPageResponse, type ListResponse } from '@/api/pagination';
import type { Empresa, ListQueryOptions, PageResponse } from '@/api/types';
import type { EmpresaFilters } from '../lib/empresaFilters';

type EmpresaListQuery = Partial<EmpresaFilters> & ListQueryOptions;

export const empresasKeys = {
  all: ['empresas'] as const,
  list: (filters?: EmpresaListQuery) =>
    filters ? (['empresas', filters] as const) : (['empresas'] as const),
  detail: (id: string) => ['empresas', id] as const,
  prospectos: (id: string) => ['empresas', id, 'prospectos'] as const,
  clientes: (id: string) => ['empresas', id, 'clientes'] as const,
};

export function useEmpresas(filters?: EmpresaListQuery): UseQueryResult<Empresa[]> {
  return useQuery<Empresa[]>({
    queryKey: empresasKeys.list(filters),
    queryFn: async () => listItems(await apiClient.get<ListResponse<Empresa>>(endpoints.empresas.getAll(filters))),
  });
}

export function useEmpresasPage(filters: EmpresaListQuery): UseQueryResult<PageResponse<Empresa>> {
  return useQuery<PageResponse<Empresa>>({
    queryKey: empresasKeys.list(filters),
    queryFn: async () => toPageResponse(
      await apiClient.get<ListResponse<Empresa>>(endpoints.empresas.getAll(filters)),
      filters.page ?? 0,
      filters.pageSize ?? 25,
    ),
  });
}
