import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { listItems, type ListResponse } from '@/api/pagination';
import type { Contacto, ListQueryOptions, PageResponse } from '@/api/types';
import type { ContactoFilters } from '../lib/contactoFilters';

type ContactoListQuery = Partial<ContactoFilters> & { estadoRelacion?: Contacto['estadoRelacion'] } & ListQueryOptions;

export const contactosKeys = {
  all: ['contactos'] as const,
  list: (filters?: ContactoListQuery) =>
    filters ? (['contactos', filters] as const) : (['contactos'] as const),
  detail: (id: string) => ['contactos', id] as const,
};

export function useContactos(filters?: ContactoListQuery): UseQueryResult<Contacto[]> {
  return useQuery<Contacto[]>({
    queryKey: contactosKeys.list(filters),
    queryFn: async () => listItems(await apiClient.get<ListResponse<Contacto>>(endpoints.contactos.getAll(filters))),
  });
}

export function useContactosPage(filters: ContactoListQuery): UseQueryResult<PageResponse<Contacto>> {
  return useQuery<PageResponse<Contacto>>({
    queryKey: contactosKeys.list(filters),
    queryFn: () => apiClient.get<PageResponse<Contacto>>(endpoints.contactos.getAll(filters)),
  });
}
