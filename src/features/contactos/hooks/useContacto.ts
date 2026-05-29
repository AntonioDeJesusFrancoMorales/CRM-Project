// useContacto — resuelve el detalle con initialData de la cache de lista.
// Si la cache ['contactos'] está poblada, la data está disponible sincrónicamente.
// Si no hay cache, llama GET /contactos/get-by-id?id= directamente.

import { useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import type { Contacto } from '@/api/types';
import { contactosKeys } from './useContactos';

export function useContacto(id: string | undefined): UseQueryResult<Contacto> {
  const queryClient = useQueryClient();

  return useQuery<Contacto>({
    queryKey: contactosKeys.detail(id ?? ''),
    queryFn: () => apiClient.get<Contacto>(endpoints.contactos.getById(id ?? '')),
    initialData: () =>
      queryClient.getQueryData<Contacto[]>(contactosKeys.list())?.find((c) => c.id === id),
    enabled: !!id,
  });
}
