// useDeleteTarea — DELETE /tareas/delete?id= (204).
// onSuccess: limpia cache de detalle, invalida lista, y borra estado de localStorage (ADR-050).

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import { clearTareaEstado } from './useTareaEstado';
import { tareasKeys } from './useTareas';

export function useDeleteTarea(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => apiClient.delete<void>(endpoints.tareas.delete(id)),
    onSuccess: (_void, id) => {
      queryClient.removeQueries({ queryKey: tareasKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: tareasKeys.all });
      clearTareaEstado(id);
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
