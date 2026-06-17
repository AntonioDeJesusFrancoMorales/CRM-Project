import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import type { CanalWhatsapp, CanalUpdatePayload } from '@/api/types';
import { canalesKeys } from './useCanales';

interface EditVars {
  id: string;
  payload: CanalUpdatePayload;
}

export function useEditCanal(): UseMutationResult<CanalWhatsapp, Error, EditVars> {
  const queryClient = useQueryClient();

  return useMutation<CanalWhatsapp, Error, EditVars>({
    mutationFn: ({ id, payload }) =>
      apiClient.put<CanalWhatsapp>(endpoints.wa.canales.edit(id), payload),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: canalesKeys.all });
      toast.success(`Canal "${updated.nombre}" actualizado`);
    },
    onError: (error) => {
      if (isHttpError(error)) {
        toast.error(error.message);
      } else {
        toast.error('No fue posible actualizar el canal');
      }
    },
  });
}
