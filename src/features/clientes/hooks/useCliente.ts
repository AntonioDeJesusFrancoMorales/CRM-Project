import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import type { Cliente } from '@/api/types';
import { clientesKeys } from './useClientes';

export function useCliente(id: string | undefined): UseQueryResult<Cliente> {
  return useQuery<Cliente>({
    queryKey: clientesKeys.detail(id ?? ''),
    queryFn: () => apiClient.get<Cliente>(`/clientes/${id}`),
    enabled: !!id,
  });
}
