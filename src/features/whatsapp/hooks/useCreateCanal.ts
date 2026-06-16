import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import type { CanalWhatsapp, CanalCreatePayload } from '@/api/types';
import { canalesKeys } from './useCanales';

export function useCreateCanal(empresaId: string): UseMutationResult<CanalWhatsapp, Error, CanalCreatePayload> {
  const queryClient = useQueryClient();

  return useMutation<CanalWhatsapp, Error, CanalCreatePayload>({
    mutationFn: (payload) =>
      apiClient.post<CanalWhatsapp>(endpoints.wa.canales.create(), payload),
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: canalesKeys.list(empresaId) });
      toast.success(`Canal "${created.nombre}" creado`);
    },
    onError: (error) => {
      if (isHttpError(error)) {
        toast.error(error.message);
      } else {
        toast.error('No fue posible crear el canal');
      }
    },
  });
}
