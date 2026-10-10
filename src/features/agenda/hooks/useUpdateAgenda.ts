// useUpdateAgenda — PUT /agendas/edit?id= con AgendaEditInput (full replace).
// onSuccess: invalida lista ['agendas'] y el detalle. onError: 400/422 con details silencioso, resto toast.

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import { usePermissions } from '@/features/permissions/context';
import type { Agenda, AgendaEditInput } from '@/features/agenda/schemas/agenda.schema';
import { agendasKeys } from './useAgendas';

interface UpdateAgendaVars {
  id: string;
  data: AgendaEditInput;
}

export function useUpdateAgenda(): UseMutationResult<Agenda, Error, UpdateAgendaVars> {
  const queryClient = useQueryClient();
  const permissions = usePermissions();
  const canEdit = permissions.allows('AGENDA', 'ACTUALIZAR');

  return useMutation<Agenda, Error, UpdateAgendaVars>({
    mutationFn: ({ id, data }) => {
      if (!canEdit) return Promise.reject(new Error('Agenda update permission denied'));
      return apiClient.put<Agenda>(endpoints.agendas.edit(id), data);
    },
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: agendasKeys.all });
      void queryClient.invalidateQueries({ queryKey: agendasKeys.detail(updated.id) });
      toast.success('Evento actualizado');
    },
    onError: (error) => {
      if (isHttpError(error)) {
        if (error.status === 422 || (error.status === 400 && error.details?.length)) return;
        toast.error(error.message);
      } else {
        toast.error('No fue posible actualizar el evento');
      }
    },
  });
}
