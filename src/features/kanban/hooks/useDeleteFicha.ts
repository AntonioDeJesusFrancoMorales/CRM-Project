// useDeleteFicha — DELETE /fichas/delete?id=
// 204 → invalida ['fichas'] + toast de confirmación.
// Sin removeQueries: las fichas no tienen queryKey de detalle (solo listado global).
//
// options.silentSuccess: si es true, omite el toast "Ficha eliminada". Útil cuando
// el borrado es parte de un flujo orquestado (useEliminarTarjeta) donde otro hook
// ya muestra su propio toast de éxito. Mismo patrón que useCreateFicha. Default: false.

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import { fichasKeys } from './useFichas';

interface UseDeleteFichaOptions {
  /** Si es true, no muestra el toast de éxito "Ficha eliminada". Default: false. */
  silentSuccess?: boolean;
}

export function useDeleteFicha(options?: UseDeleteFichaOptions): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();
  const silentSuccess = options?.silentSuccess ?? false;

  return useMutation<void, Error, string>({
    mutationFn: (id) => apiClient.delete<void>(endpoints.fichas.delete(id)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: fichasKeys.all });
      if (!silentSuccess) {
        toast.success('Ficha eliminada');
      }
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
