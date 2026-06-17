import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import type { CanalWhatsapp } from '@/api/types';

export const canalesKeys = {
  all: ['wa-canales'] as const,
  list: (empresaId: string) => ['wa-canales', empresaId] as const,
};

export function useCanales(empresaId: string): UseQueryResult<CanalWhatsapp[]> {
  return useQuery<CanalWhatsapp[]>({
    queryKey: canalesKeys.list(empresaId),
    queryFn: () => apiClient.get<CanalWhatsapp[]>(endpoints.wa.canales.getAll(empresaId)),
    enabled: !!empresaId,
  });
}

export function useAllCanales(): UseQueryResult<CanalWhatsapp[]> {
  return useQuery<CanalWhatsapp[]>({
    queryKey: canalesKeys.all,
    queryFn: () => apiClient.get<CanalWhatsapp[]>(endpoints.wa.canales.getAllGlobal()),
  });
}
