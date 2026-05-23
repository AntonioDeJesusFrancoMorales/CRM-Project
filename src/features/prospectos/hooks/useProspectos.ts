import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import type { Prospecto } from '@/api/types';

export interface ProspectosFilters {
  responsable_id?: string;
  empresa_id?: string;
}

function buildQueryString(filters: ProspectosFilters): string {
  const params = new URLSearchParams();
  if (filters.responsable_id) params.set('responsable_id', filters.responsable_id);
  if (filters.empresa_id) params.set('empresa_id', filters.empresa_id);
  return params.toString();
}

export const prospectosKeys = {
  all: ['prospectos'] as const,
  list: (filters: ProspectosFilters = {}) => {
    const qs = buildQueryString(filters);
    return qs ? ['prospectos', qs] : (['prospectos'] as const);
  },
  detail: (id: string) => ['prospectos', id] as const,
  tratos: (id: string) => ['prospectos', id, 'tratos'] as const,
  // Empresa-scoped keys para invalidación cruzada (ADR-024, R5)
  empresaClientes: (empresaId: string) => ['empresa-clientes', empresaId] as const,
  empresaProspectos: (empresaId: string) => ['empresa-prospectos', empresaId] as const,
};

export function useProspectos(filters: ProspectosFilters = {}): UseQueryResult<Prospecto[]> {
  const qs = buildQueryString(filters);
  const url = qs ? `/prospectos?${qs}` : '/prospectos';

  return useQuery<Prospecto[]>({
    queryKey: prospectosKeys.list(filters),
    queryFn: () => apiClient.get<Prospecto[]>(url),
  });
}
