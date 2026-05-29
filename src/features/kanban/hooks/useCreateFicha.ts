// useCreateFicha — POST /fichas/create con FichaCreateInput.
// tipoFicha=TRATO y tratoId son requeridos para fichas de trato.
// responsableId/creadoPor: auth fuera de alcance en v1; el llamador pasa 'MOCK_USER'
// como constante provisional hasta que el contexto de auth esté en scope.
// Sin optimistic update: invalidación simple tras éxito.

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import type { Ficha, FichaCreateInput } from '@/features/kanban/schemas/ficha.schema';
import { fichasKeys } from './useFichas';

export function useCreateFicha(): UseMutationResult<Ficha, Error, FichaCreateInput> {
  const queryClient = useQueryClient();

  return useMutation<Ficha, Error, FichaCreateInput>({
    mutationFn: (payload) => apiClient.post<Ficha>(endpoints.fichas.create(), payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: fichasKeys.all });
      toast.success('Ficha creada');
    },
    onError: (error) => {
      if (isHttpError(error)) {
        if (error.status === 422) return;
        toast.error(error.message);
      } else {
        toast.error('No fue posible crear la ficha');
      }
    },
  });
}
