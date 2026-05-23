import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import type { Cliente } from '@/api/types';

// Hook temporal — Change 5 creará la feature "clientes" completa.
// Usado aquí por ProspectosListPage para el join client-side de convertidos (ADR-023).

export function useClientes(): UseQueryResult<Cliente[]> {
  return useQuery<Cliente[]>({
    queryKey: ['clientes'],
    queryFn: () => apiClient.get<Cliente[]>('/clientes'),
  });
}
