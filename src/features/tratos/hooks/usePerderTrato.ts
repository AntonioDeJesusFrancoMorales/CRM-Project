// ADR-043 — usePerderTrato invoca PATCH /tratos/:id/perder con motivo_perdida requerido.
// El modal TratoPerderDialog (Lote D) es el único punto de entrada a este endpoint.
// El handler MSW devuelve 422 si motivo_perdida está vacío — el hook propaga el error.

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { isHttpError } from '@/api/http-error';
import type { Trato } from '@/api/types';
import { tratosKeys } from './useTratos';

interface PerderTratoVars {
  id: string;
  motivo_perdida: string;
}

export function usePerderTrato(): UseMutationResult<Trato, Error, PerderTratoVars> {
  const queryClient = useQueryClient();

  return useMutation<Trato, Error, PerderTratoVars>({
    mutationFn: ({ id, motivo_perdida }) =>
      apiClient.patch<Trato>(`/tratos/${id}/perder`, { motivo_perdida }),
    onSuccess: (updated, { id }) => {
      void queryClient.invalidateQueries({ queryKey: tratosKeys.all });
      void queryClient.invalidateQueries({ queryKey: tratosKeys.detail(id) });
      toast.success(`Trato "${updated.nombre}" marcado como perdido`);
    },
    onError: (error) => {
      if (isHttpError(error)) {
        if (error.status === 422) return; // El modal mapea el error inline.
        toast.error(error.message);
      } else {
        toast.error('No fue posible marcar el trato como perdido');
      }
    },
  });
}
