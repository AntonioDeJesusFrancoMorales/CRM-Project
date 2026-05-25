// useCreateTarea — POST /tratos/:trato_id/tareas.
// trato_id va en el PATH (no en el body). Patrón de useCreateTrato.
// onSuccess invalida tareasKeys.all para refrescar todas las listas de tareas.

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { isHttpError } from '@/api/http-error';
import type { Tarea } from '@/api/types';
import type { TareaCreateInput } from '../schemas/tarea.schema';
import { tareasKeys } from './useTareas';

// El payload que va al body NO incluye trato_id (va en el PATH).
type TareaCreateBody = Omit<TareaCreateInput, 'trato_id'>;

export function useCreateTarea(): UseMutationResult<Tarea, Error, TareaCreateInput> {
  const queryClient = useQueryClient();

  return useMutation<Tarea, Error, TareaCreateInput>({
    mutationFn: ({ trato_id, ...body }: TareaCreateInput) =>
      apiClient.post<Tarea>(`/tratos/${trato_id}/tareas`, body as TareaCreateBody),
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: tareasKeys.all });
      toast.success(`Tarea "${created.titulo}" creada`);
    },
    onError: (error) => {
      if (isHttpError(error)) {
        if (error.status === 422) return;
        toast.error(error.message);
      } else {
        toast.error('No fue posible crear la tarea');
      }
    },
  });
}
