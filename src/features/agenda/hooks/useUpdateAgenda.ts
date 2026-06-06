// useUpdateAgenda — PUT /agendas/edit?id= con AgendaEditInput (full replace).
// onSuccess: invalida lista ['agendas'] y el detalle. onError: 422 silencioso, resto toast.

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import type { Agenda, AgendaEditInput } from '@/features/agenda/schemas/agenda.schema';
import { agendasKeys } from './useAgendas';

interface UpdateAgendaVars {
  id: string;
  data: AgendaEditInput;
}

export function useUpdateAgenda(): UseMutationResult<Agenda, Error, UpdateAgendaVars> {
  const queryClient = useQueryClient();

  return useMutation<Agenda, Error, UpdateAgendaVars>({
    mutationFn: ({ id, data }) => apiClient.put<Agenda>(endpoints.agendas.edit(id), data),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: agendasKeys.all });
      void queryClient.invalidateQueries({ queryKey: agendasKeys.detail(updated.id) });
      toast.success('Evento actualizado');
    },
    onError: (error) => {
      if (isHttpError(error)) {
        if (error.status === 422) return;
        toast.error(error.message);
      } else {
        toast.error('No fue posible actualizar el evento');
      }
    },
  });
}
