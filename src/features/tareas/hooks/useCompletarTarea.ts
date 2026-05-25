// ADR-049 — useCompletarTarea: PATCH /tareas/:id/completar.
// La fecha_completada se auto-rellena en el handler del servidor.
// DOBLE invalidación: tareasKeys.all + tareasKeys.byTrato(trato_id).
// Espeja useGanarTrato pero recibe { tareaId, tratoId } para hacer la doble invalidación.

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { isHttpError } from '@/api/http-error';
import type { Tarea } from '@/api/types';
import { tareasKeys } from './useTareas';

interface CompletarTareaVars {
  tareaId: string;
  tratoId: string;
}

export function useCompletarTarea(): UseMutationResult<Tarea, Error, CompletarTareaVars> {
  const queryClient = useQueryClient();

  return useMutation<Tarea, Error, CompletarTareaVars>({
    mutationFn: ({ tareaId }) => apiClient.patch<Tarea>(`/tareas/${tareaId}/completar`),
    onSuccess: (updated, { tratoId }) => {
      // ADR-049: DOBLE invalidación
      void queryClient.invalidateQueries({ queryKey: tareasKeys.all });
      void queryClient.invalidateQueries({ queryKey: tareasKeys.byTrato(tratoId) });
      toast.success(`Tarea "${updated.titulo}" completada`);
    },
    onError: (error) => {
      if (isHttpError(error)) {
        toast.error(error.message);
      } else {
        toast.error('No fue posible completar la tarea');
      }
    },
  });
}
