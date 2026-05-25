// useDeleteTarea — DELETE /tareas/:id (204).
// Patrón de useDeleteTrato: removeQueries(detail) + invalidateQueries(all).
// 404 → propaga el error (el componente host decide el mensaje).

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { isHttpError } from '@/api/http-error';
import { tareasKeys } from './useTareas';

export function useDeleteTarea(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => apiClient.delete<void>(`/tareas/${id}`),
    onSuccess: (_void, id) => {
      queryClient.removeQueries({ queryKey: tareasKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: tareasKeys.all });
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
