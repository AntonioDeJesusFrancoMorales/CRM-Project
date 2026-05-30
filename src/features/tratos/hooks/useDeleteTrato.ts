// useDeleteTrato — DELETE /tratos/delete?id=
// 204 → removeQueries detail + invalidate list + toast.
// 409 → no invalida (el trato sigue existiendo); el componente host lee err.message.

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import { tratosKeys } from './useTratos';

export function useDeleteTrato(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => apiClient.delete<void>(endpoints.tratos.delete(id)),
    onSuccess: (_void, id) => {
      queryClient.removeQueries({ queryKey: tratosKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: tratosKeys.all });
      toast.success('Trato eliminado');
    },
    onError: (error) => {
      if (isHttpError(error)) {
        if (error.status === 409) {
          // 409 → NO invalida (el trato sigue existiendo).
          return;
        }
        toast.error(error.message);
      } else {
        toast.error('No fue posible eliminar el trato');
      }
    },
  });
}
