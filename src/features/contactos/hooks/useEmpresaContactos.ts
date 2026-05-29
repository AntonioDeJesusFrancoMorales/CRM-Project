// useEmpresaContactos — derivado client-side de useContactos() con select de TanStack Query v5.
// Comparte la cache ['contactos'] con useContactos — sin fetch extra.
// El back no tiene endpoint /contactos?empresaId= — el filtro es siempre client-side.

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import type { Contacto } from '@/api/types';
import { contactosKeys } from './useContactos';

export function useEmpresaContactos(empresaId: string | undefined): UseQueryResult<Contacto[]> {
  return useQuery<Contacto[], Error, Contacto[]>({
    queryKey: contactosKeys.list(),
    queryFn: () => apiClient.get<Contacto[]>(endpoints.contactos.getAll()),
    select: (data) =>
      empresaId ? data.filter((c) => c.empresaId === empresaId) : [],
    enabled: !!empresaId,
  });
}
