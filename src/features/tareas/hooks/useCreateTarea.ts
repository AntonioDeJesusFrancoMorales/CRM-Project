// useCreateTarea — POST /tareas/create con tratoId en el body (contrato RPC del back).
// El schema TareaCreateInput ya usa camelCase y enums del back — se pasa el body tal cual.
// onSuccess invalida tareasKeys.all para refrescar todas las listas de tareas.
//
// IMPORTANTE: el back AUTO-CREA una ficha TAREA al crear la tarea
// (CreateTareaService.java). Por eso el front NO debe crear otra ficha (sería duplicada)
// y SÍ debe invalidar ['fichas'] para que el Kanban muestre la ficha creada por el back.

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import type { Tarea } from '@/api/types';
import type { TareaCreateInput } from '../schemas/tarea.schema';
import { tareasKeys } from './useTareas';
import { fichasKeys } from '@/features/kanban/hooks/useFichas';

export function useCreateTarea(): UseMutationResult<Tarea, Error, TareaCreateInput> {
  const queryClient = useQueryClient();

  return useMutation<Tarea, Error, TareaCreateInput>({
    mutationFn: (input: TareaCreateInput) => {
      // El schema ya produce camelCase con enums del back — se pasa directamente.
      return apiClient.post<Tarea>(endpoints.tareas.create(), input);
    },
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: tareasKeys.all });
      // El back creó la ficha asociada — refrescar el Kanban.
      void queryClient.invalidateQueries({ queryKey: fichasKeys.all });
      toast.success(`Tarea "${created.titulo}" creada`);
    },
    onError: (error) => {
      if (isHttpError(error)) {
        if (error.status === 422) return; // El form mapea details inline.
        toast.error(error.message);
      } else {
        toast.error('No fue posible crear la tarea');
      }
    },
  });
}
