import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import type { Contacto } from '@/api/types';

export const contactosKeys = {
  all: ['contactos'] as const,
  list: () => ['contactos'] as const,
  detail: (id: string) => ['contactos', id] as const,
};

export function useContactos(): UseQueryResult<Contacto[]> {
  return useQuery<Contacto[]>({
    queryKey: contactosKeys.list(),
    queryFn: () => apiClient.get<Contacto[]>(endpoints.contactos.getAll()),
  });
}
