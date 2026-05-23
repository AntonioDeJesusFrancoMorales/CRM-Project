import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import type { Cliente } from '@/api/types';

// ADR-031 (revisión): list() con filtros embebidos en la key para que TanStack Query
// refetchee cuando los filtros cambian. La invalidación de useConvertirProspecto
// usa prefix-match: { queryKey: ['clientes'] } invalida todas las keys que empiecen
// con ['clientes'], incluidas ['clientes', { filters }]. Compatibilidad preservada.
export const clientesKeys = {
  all: ['clientes'] as const,
  list: (filters?: UseClientesFilters) => ['clientes', filters ?? {}] as const,
  detail: (id: string) => ['clientes', id] as const,
  tratos: (id: string) => ['clientes', id, 'tratos'] as const,
};

export interface UseClientesFilters {
  empresa_id?: string;
  origen?: 'prospecto' | 'manual';
}

export function useClientes(filters?: UseClientesFilters): UseQueryResult<Cliente[]> {
  return useQuery<Cliente[]>({
    queryKey: clientesKeys.list(filters),
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters?.empresa_id) params.set('empresa_id', filters.empresa_id);
      if (filters?.origen) params.set('origen', filters.origen);
      const qs = params.toString();
      return apiClient.get<Cliente[]>(qs ? `/clientes?${qs}` : '/clientes');
    },
  });
}
