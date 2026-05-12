import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import type { Empresa } from '@/api/types';
import { empresasKeys } from './useEmpresas';

export function useEmpresa(id: string | undefined): UseQueryResult<Empresa> {
  return useQuery<Empresa>({
    queryKey: empresasKeys.detail(id ?? ''),
    queryFn: () => apiClient.get<Empresa>(`/empresas/${id}`),
    enabled: !!id,
  });
}
