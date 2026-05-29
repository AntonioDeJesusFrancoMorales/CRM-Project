// useQuitarColumna — DELETE /tableros/eliminar-columna?id=&columnaId=
// Quita una columna de un tablero. Invalida ['tableros', tableroId] para refrescar el tablero.
// 409 (columna con fichas activas) → toast con instrucción específica.
// 422 → retorna silenciosamente (el formulario muestra serverErrors propios).

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import { tablerosKeys } from './useTableros';

export interface QuitarColumnaVars {
  tableroId: string;
  columnaId: string;
}

export function useQuitarColumna(): UseMutationResult<void, Error, QuitarColumnaVars> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, QuitarColumnaVars>({
    mutationFn: ({ tableroId, columnaId }) =>
      apiClient.delete<void>(endpoints.tableros.eliminarColumna(tableroId, columnaId)),
    onSuccess: (_result, { tableroId }) => {
      void queryClient.invalidateQueries({ queryKey: tablerosKeys.detail(tableroId) });
      toast.success('Columna quitada');
    },
    onError: (error) => {
      if (isHttpError(error)) {
        if (error.status === 409) {
          toast.error('La columna tiene fichas; muévelas o elimínalas antes de quitarla');
          return;
        }
        if (error.status === 422) return;
        toast.error(error.message);
      } else {
        toast.error('No fue posible quitar la columna');
      }
    },
  });
}
