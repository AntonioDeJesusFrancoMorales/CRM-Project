// useDeleteAgenda — DELETE /agendas/delete?id= (204).
// El back no cascadea nada de agenda (los vínculos a tarea/trato son solo referencias).
// onSuccess: limpia cache de detalle e invalida la lista.

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import { agendasKeys } from './useAgendas';

export function useDeleteAgenda(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => apiClient.delete<void>(endpoints.agendas.delete(id)),
    onSuccess: (_void, id) => {
      queryClient.removeQueries({ queryKey: agendasKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: agendasKeys.all });
      toast.success('Evento eliminado');
    },
    onError: (error) => {
      if (isHttpError(error)) {
        toast.error(error.message);
      } else {
        toast.error('No fue posible eliminar el evento');
      }
    },
  });
}
