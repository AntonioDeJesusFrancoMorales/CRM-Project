// useDeleteTablero — DELETE /tableros/delete?id= (204).
// La protección de los tableros base vive en tableroPolicy.ts y en la página de listado;
// este hook refleja deliberadamente el contrato actual del backend, que acepta cualquier id.

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import type { Tablero } from '@/features/kanban/schemas/tablero.schema';
import { tablerosKeys } from './useTableros';

export function useDeleteTablero(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => apiClient.delete<void>(endpoints.tableros.delete(id)),
    onSuccess: (_result, id) => {
      queryClient.removeQueries({ queryKey: tablerosKeys.detail(id) });
      queryClient.setQueryData<Tablero[]>(tablerosKeys.list(), (current) =>
        (current ?? []).filter((tablero) => tablero.id !== id),
      );
      void queryClient.invalidateQueries({ queryKey: tablerosKeys.all });
      toast.success('Tablero eliminado');
    },
    onError: (error) => {
      if (isHttpError(error)) {
        if (error.status === 404) {
          toast.message('El tablero ya fue eliminado');
          void queryClient.invalidateQueries({ queryKey: tablerosKeys.all });
          return;
        }
        toast.error(error.message);
      } else {
        toast.error('No fue posible eliminar el tablero');
      }
    },
  });
}
