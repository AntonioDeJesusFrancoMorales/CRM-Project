// ADR-046 — useDeleteTrato maneja 204 (remove + invalidate + toast) y 409 (no invalida, propaga err.message).
// Pattern verbatim de useDeleteCliente (ADR-031 de Change 5).

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { isHttpError } from '@/api/http-error';
import { tratosKeys } from './useTratos';

export function useDeleteTrato(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => apiClient.delete<void>(`/tratos/${id}`),
    onSuccess: (_void, id) => {
      queryClient.removeQueries({ queryKey: tratosKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: tratosKeys.all });
      toast.success('Trato eliminado');
    },
    onError: (error) => {
      if (isHttpError(error)) {
        if (error.status === 409) {
          // 409 → NO invalida (el trato sigue existiendo).
          // El componente host lee `err.message` del useMutation result para el toast.
          return;
        }
        toast.error(error.message);
      } else {
        toast.error('No fue posible eliminar el trato');
      }
    },
  });
}
