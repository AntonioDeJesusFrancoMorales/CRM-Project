// useCreateFicha — POST /fichas/create con FichaCreateInput.
// tipoFicha=TRATO y tratoId son requeridos para fichas de trato.
// responsableId/creadoPor los pasa el dialog (FichaCreateDialog) con MOCK_USER_ID.
// Sin optimistic update: invalidación simple tras éxito.
//
// options.silentSuccess: si es true, omite el toast "Ficha creada". Se usa cuando la
// creación es parte de un flujo orquestado (p. ej. al crear una tarea), donde otro toast
// ya confirma la acción y un segundo toast sería ruido. Default false: el flujo manual
// (FichaCreateDialog) sigue mostrando su confirmación.

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import type { Ficha, FichaCreateInput } from '@/features/kanban/schemas/ficha.schema';
import { fichasKeys } from './useFichas';

interface UseCreateFichaOptions {
  /** Si es true, no muestra el toast de éxito "Ficha creada". Default: false. */
  silentSuccess?: boolean;
}

export function useCreateFicha(
  options?: UseCreateFichaOptions,
): UseMutationResult<Ficha, Error, FichaCreateInput> {
  const queryClient = useQueryClient();
  const silentSuccess = options?.silentSuccess ?? false;

  return useMutation<Ficha, Error, FichaCreateInput>({
    mutationFn: (payload) => apiClient.post<Ficha>(endpoints.fichas.create(), payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: fichasKeys.all });
      if (!silentSuccess) {
        toast.success('Ficha creada');
      }
    },
    onError: (error) => {
      if (isHttpError(error)) {
        if (error.status === 422 || (error.status === 400 && error.details?.length)) return;
        toast.error(error.message);
      } else {
        toast.error('No fue posible crear la ficha');
      }
    },
  });
}
