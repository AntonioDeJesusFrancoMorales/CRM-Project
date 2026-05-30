import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import type { Empresa } from '@/api/types';

export const empresasKeys = {
  all: ['empresas'] as const,
  list: () => ['empresas'] as const,
  detail: (id: string) => ['empresas', id] as const,
  prospectos: (id: string) => ['empresas', id, 'prospectos'] as const,
  clientes: (id: string) => ['empresas', id, 'clientes'] as const,
};

export function useEmpresas(): UseQueryResult<Empresa[]> {
  return useQuery<Empresa[]>({
    queryKey: empresasKeys.list(),
    queryFn: () => apiClient.get<Empresa[]>(endpoints.empresas.getAll()),
  });
}
