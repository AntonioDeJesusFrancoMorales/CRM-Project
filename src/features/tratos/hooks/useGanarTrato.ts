import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { isHttpError } from '@/api/http-error';
import type { Trato } from '@/api/types';
import { tratosKeys } from './useTratos';

export function useGanarTrato(): UseMutationResult<Trato, Error, string> {
  const queryClient = useQueryClient();

  return useMutation<Trato, Error, string>({
    mutationFn: (id) => apiClient.patch<Trato>(`/tratos/${id}/ganar`),
    onSuccess: (updated, id) => {
      void queryClient.invalidateQueries({ queryKey: tratosKeys.all });
      void queryClient.invalidateQueries({ queryKey: tratosKeys.detail(id) });
      toast.success(`Trato "${updated.nombre}" marcado como ganado`);
    },
    onError: (error) => {
      if (isHttpError(error)) {
        toast.error(error.message);
      } else {
        toast.error('No fue posible marcar el trato como ganado');
      }
    },
  });
}
