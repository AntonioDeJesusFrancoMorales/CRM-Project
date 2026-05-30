// useDeleteFicha — DELETE /fichas/delete?id=
// 204 → invalida ['fichas'] + toast de confirmación.
// Sin removeQueries: las fichas no tienen queryKey de detalle (solo listado global).

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import { fichasKeys } from './useFichas';

export function useDeleteFicha(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => apiClient.delete<void>(endpoints.fichas.delete(id)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: fichasKeys.all });
      toast.success('Ficha eliminada');
    },
    onError: (error) => {
      if (isHttpError(error)) {
        toast.error(error.message);
      } else {
        toast.error('No fue posible eliminar la ficha');
      }
    },
  });
}
