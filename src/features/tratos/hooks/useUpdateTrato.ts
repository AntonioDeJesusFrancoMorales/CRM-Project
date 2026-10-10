// useUpdateTrato — PUT /tratos/edit?id= con TratoUpdatePayload (sin contactoId).
// contactoId es inmutable en el back; no se incluye en el payload de edición.

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import type { Trato, TratoUpdatePayload } from '@/api/types';
import { tratosKeys } from './useTratos';

interface UpdateTratoVars {
  id: string;
  data: TratoUpdatePayload;
}

export function useUpdateTrato(): UseMutationResult<Trato, Error, UpdateTratoVars> {
  const queryClient = useQueryClient();

  return useMutation<Trato, Error, UpdateTratoVars>({
    mutationFn: ({ id, data }) => apiClient.put<Trato>(endpoints.tratos.edit(id), data),
    onSuccess: (updated, { id }) => {
      void queryClient.invalidateQueries({ queryKey: tratosKeys.all });
      void queryClient.invalidateQueries({ queryKey: tratosKeys.detail(id) });
      toast.success(`Trato "${updated.nombre}" actualizado`);
    },
    onError: (error) => {
      if (isHttpError(error)) {
        if (error.status === 422 || (error.status === 400 && error.details?.length)) return;
        toast.error(error.message);
      } else {
        toast.error('No fue posible actualizar el trato');
      }
    },
  });
}
