// useDeleteTarea — DELETE /tareas/delete?id= (204) + borra la ficha asociada.
//
// El back NO cascadea (DeleteTareaService borra solo la tarea), así que el front
// borra también la ficha TAREA asociada (eliminarFichaAsociada). Esto cubre TODAS
// las vistas: lista, detalle y Kanban (vía useEliminarTarjeta, que delega aquí).
// onSuccess: limpia cache de detalle e invalida lista + fichas.

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import { eliminarFichaAsociada } from '@/features/kanban/lib/eliminarFichaAsociada';
import { fichasKeys } from '@/features/kanban/hooks/useFichas';
import { tareasKeys } from './useTareas';

export function useDeleteTarea(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await apiClient.delete<void>(endpoints.tareas.delete(id));
      // El back no borra la ficha → el front la borra (best-effort).
      await eliminarFichaAsociada(queryClient, (f) => f.tareaId === id);
    },
    onSuccess: (_void, id) => {
      queryClient.removeQueries({ queryKey: tareasKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: tareasKeys.all });
      void queryClient.invalidateQueries({ queryKey: fichasKeys.all });
      toast.success('Tarea eliminada');
    },
    onError: (error) => {
      if (isHttpError(error)) {
        toast.error(error.message);
      } else {
        toast.error('No fue posible eliminar la tarea');
      }
    },
  });
}
