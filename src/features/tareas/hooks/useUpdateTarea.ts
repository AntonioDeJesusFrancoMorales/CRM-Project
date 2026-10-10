import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import type { Tarea } from '@/api/types';
import type { TareaUpdateInput } from '../schemas/tarea.schema';
import { tareasKeys } from './useTareas';

interface UpdateTareaVars {
  id: string;
  data: TareaUpdateInput;
}

export function useUpdateTarea(): UseMutationResult<Tarea, Error, UpdateTareaVars> {
  const queryClient = useQueryClient();

  return useMutation<Tarea, Error, UpdateTareaVars>({
    mutationFn: ({ id, data }) => apiClient.put<Tarea>(endpoints.tareas.edit(id), data),
    onSuccess: (updated, { id }) => {
      void queryClient.invalidateQueries({ queryKey: tareasKeys.all });
      void queryClient.invalidateQueries({ queryKey: tareasKeys.detail(id) });
      toast.success(`Tarea "${updated.titulo}" actualizada`);
    },
    onError: (error) => {
      if (isHttpError(error)) {
        if (error.status === 422 || (error.status === 400 && error.details?.length)) return;
        toast.error(error.message);
      } else {
        toast.error('No fue posible actualizar la tarea');
      }
    },
  });
}
