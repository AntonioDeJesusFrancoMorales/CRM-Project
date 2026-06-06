// useDeleteTrato — DELETE /tratos/delete?id= + borra la ficha asociada.
// 204 → borra ficha TRATO asociada (el back no cascadea) + removeQueries detail
//        + invalidate list/fichas + toast.
// 409 → el trato NO se borró (tiene tareas); el await rechaza ANTES de tocar la ficha.

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import { eliminarFichaAsociada } from '@/features/kanban/lib/eliminarFichaAsociada';
import { fichasKeys } from '@/features/kanban/hooks/useFichas';
import { tratosKeys } from './useTratos';

export function useDeleteTrato(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      // Si el back responde 409 (trato con tareas), esto rechaza y no se toca la ficha.
      await apiClient.delete<void>(endpoints.tratos.delete(id));
      await eliminarFichaAsociada(queryClient, (f) => f.tratoId === id);
    },
    onSuccess: (_void, id) => {
      queryClient.removeQueries({ queryKey: tratosKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: tratosKeys.all });
      void queryClient.invalidateQueries({ queryKey: fichasKeys.all });
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
