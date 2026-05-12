import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import type { Cliente } from '@/api/types';
import { empresasKeys } from './useEmpresas';

export function useEmpresaClientes(id: string | undefined): UseQueryResult<Cliente[]> {
  return useQuery<Cliente[]>({
    queryKey: empresasKeys.clientes(id ?? ''),
    queryFn: () => apiClient.get<Cliente[]>(`/empresas/${id}/clientes`),
    enabled: !!id,
  });
}
