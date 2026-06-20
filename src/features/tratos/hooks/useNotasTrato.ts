import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import type { NotaTrato } from '@/api/types';

export const notasTratoKeys = {
  byTrato: (tratoId: string) => ['notas-trato', tratoId] as const,
};

export function useNotasTrato(tratoId: string | undefined): UseQueryResult<NotaTrato[]> {
  return useQuery<NotaTrato[]>({
    queryKey: notasTratoKeys.byTrato(tratoId ?? ''),
    queryFn: () => apiClient.get<NotaTrato[]>(endpoints.tratos.notasGetAll(tratoId!)),
    enabled: !!tratoId,
  });
}

export function useCrearNotaTrato(tratoId: string) {
  const queryClient = useQueryClient();
  return useMutation<NotaTrato, Error, string>({
    mutationFn: (contenido) =>
      apiClient.post<NotaTrato>(endpoints.tratos.notasCreate(tratoId), { contenido }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notasTratoKeys.byTrato(tratoId) });
    },
    onError: (e) => toast.error(isHttpError(e) ? e.message : 'No se pudo guardar la nota'),
  });
}
