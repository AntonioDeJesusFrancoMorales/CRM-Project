import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import type { Empresa } from '@/api/types';
import type { EmpresaFilters } from '../lib/empresaFilters';

export const empresasKeys = {
  all: ['empresas'] as const,
  list: (filters?: Partial<EmpresaFilters>) =>
    filters ? (['empresas', filters] as const) : (['empresas'] as const),
  detail: (id: string) => ['empresas', id] as const,
  prospectos: (id: string) => ['empresas', id, 'prospectos'] as const,
  clientes: (id: string) => ['empresas', id, 'clientes'] as const,
};

export function useEmpresas(filters?: Partial<EmpresaFilters>): UseQueryResult<Empresa[]> {
  return useQuery<Empresa[]>({
    queryKey: empresasKeys.list(filters),
    queryFn: () => apiClient.get<Empresa[]>(endpoints.empresas.getAll(filters)),
  });
}
