import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { isHttpError } from '@/api/http-error';
import type { Trato } from '@/api/types';
import type { TratoUpdateInput } from '../schemas/trato.schema';
import { tratosKeys } from './useTratos';

interface UpdateTratoVars {
  id: string;
  data: TratoUpdateInput;
}

export function useUpdateTrato(): UseMutationResult<Trato, Error, UpdateTratoVars> {
  const queryClient = useQueryClient();

  return useMutation<Trato, Error, UpdateTratoVars>({
    mutationFn: ({ id, data }) => apiClient.patch<Trato>(`/tratos/${id}`, data),
    onSuccess: (updated, { id }) => {
      void queryClient.invalidateQueries({ queryKey: tratosKeys.all });
      void queryClient.invalidateQueries({ queryKey: tratosKeys.detail(id) });
      toast.success(`Trato "${updated.nombre}" actualizado`);
    },
    onError: (error) => {
      if (isHttpError(error)) {
        if (error.status === 422) return;
        toast.error(error.message);
      } else {
        toast.error('No fue posible actualizar el trato');
      }
    },
  });
}
