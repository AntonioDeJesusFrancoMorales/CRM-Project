import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import type { Prospecto } from '@/api/types';
import { empresasKeys } from './useEmpresas';

export function useEmpresaProspectos(id: string | undefined): UseQueryResult<Prospecto[]> {
  return useQuery<Prospecto[]>({
    queryKey: empresasKeys.prospectos(id ?? ''),
    queryFn: () => apiClient.get<Prospecto[]>(`/empresas/${id}/prospectos`),
    enabled: !!id,
  });
}
