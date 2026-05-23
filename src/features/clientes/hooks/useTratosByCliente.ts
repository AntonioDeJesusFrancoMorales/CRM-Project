import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import type { Trato } from '@/api/types';
import { clientesKeys } from './useClientes';

// ADR-036: enabled implícito por id — el componente que monte este hook
// solo dispara fetch cuando hay un id válido.
export function useTratosByCliente(id: string | undefined): UseQueryResult<Trato[]> {
  return useQuery<Trato[]>({
    queryKey: clientesKeys.tratos(id ?? ''),
    queryFn: () => apiClient.get<Trato[]>(`/clientes/${id}/tratos`),
    enabled: !!id,
  });
}
