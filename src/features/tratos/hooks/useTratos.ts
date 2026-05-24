// ADR-040 + ADR-042 — Hook paramétrico para listar tratos con filtros server-side.
// Filtros embebidos en queryKey para que TanStack refetchee al cambiar.
// Reemplaza el acoplamiento cruzado clientes/hooks/useTratosByCliente (eliminado en Lote C).

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import type { EstadoTrato, Trato } from '@/api/types';

export interface UseTratosFilters {
  cliente_id?: string;
  prospecto_id?: string;
  estado?: EstadoTrato;
  responsable_id?: string;
}

export const tratosKeys = {
  all: ['tratos'] as const,
  list: (filters?: UseTratosFilters) => ['tratos', filters ?? {}] as const,
  detail: (id: string) => ['tratos', id] as const,
};

export function useTratos(filters?: UseTratosFilters): UseQueryResult<Trato[]> {
  return useQuery<Trato[]>({
    queryKey: tratosKeys.list(filters),
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters?.cliente_id) params.set('cliente_id', filters.cliente_id);
      if (filters?.prospecto_id) params.set('prospecto_id', filters.prospecto_id);
      if (filters?.estado) params.set('estado', filters.estado);
      if (filters?.responsable_id) params.set('responsable_id', filters.responsable_id);
      const qs = params.toString();
      return apiClient.get<Trato[]>(qs ? `/tratos?${qs}` : '/tratos');
    },
  });
}
