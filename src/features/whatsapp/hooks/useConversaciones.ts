import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import type { Conversacion } from '@/api/types';

export const conversacionesKeys = {
  all: ['wa-conversaciones'] as const,
  list: (empresaId: string) => ['wa-conversaciones', empresaId] as const,
  detail: (id: string) => ['wa-conversaciones', 'detail', id] as const,
};

export function useConversaciones(empresaId: string): UseQueryResult<Conversacion[]> {
  return useQuery<Conversacion[]>({
    queryKey: conversacionesKeys.list(empresaId),
    queryFn: () => apiClient.get<Conversacion[]>(endpoints.wa.conversaciones.getAll(empresaId)),
    enabled: !!empresaId,
    refetchInterval: 30_000,
  });
}
