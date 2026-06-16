import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import type { Mensaje } from '@/api/types';

export const mensajesKeys = {
  byConversacion: (conversacionId: string) => ['wa-mensajes', conversacionId] as const,
};

export function useMensajes(conversacionId: string | null): UseQueryResult<Mensaje[]> {
  return useQuery<Mensaje[]>({
    queryKey: mensajesKeys.byConversacion(conversacionId ?? ''),
    queryFn: () => apiClient.get<Mensaje[]>(endpoints.wa.conversaciones.mensajes(conversacionId!)),
    enabled: !!conversacionId,
  });
}
