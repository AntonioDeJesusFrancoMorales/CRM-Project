import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import type { Contacto } from '@/api/types';
import type { ContactoFilters } from '../lib/contactoFilters';

export const contactosKeys = {
  all: ['contactos'] as const,
  list: (filters?: Partial<ContactoFilters> & { estadoRelacion?: Contacto['estadoRelacion'] }) =>
    filters ? (['contactos', filters] as const) : (['contactos'] as const),
  detail: (id: string) => ['contactos', id] as const,
};

export function useContactos(filters?: Partial<ContactoFilters> & { estadoRelacion?: Contacto['estadoRelacion'] }): UseQueryResult<Contacto[]> {
  return useQuery<Contacto[]>({
    queryKey: contactosKeys.list(filters),
    queryFn: () => apiClient.get<Contacto[]>(endpoints.contactos.getAll(filters)),
  });
}
