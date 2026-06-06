// useCreateAgenda — POST /agendas/create. creadoPor lo deriva el back del JWT (no se envía).
// El schema AgendaCreateInput ya produce camelCase con enums del back — se pasa tal cual.
// onSuccess invalida agendasKeys.all. onError: 422 silencioso (el form mapea details), resto toast.

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import type { Agenda, AgendaCreateInput } from '@/features/agenda/schemas/agenda.schema';
import { agendasKeys } from './useAgendas';

export function useCreateAgenda(): UseMutationResult<Agenda, Error, AgendaCreateInput> {
  const queryClient = useQueryClient();

  return useMutation<Agenda, Error, AgendaCreateInput>({
    mutationFn: (input: AgendaCreateInput) =>
      apiClient.post<Agenda>(endpoints.agendas.create(), input),
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: agendasKeys.all });
      toast.success(`Evento "${created.asunto}" creado`);
    },
    onError: (error) => {
      if (isHttpError(error)) {
        if (error.status === 422) return; // El form mapea details inline.
        toast.error(error.message);
      } else {
        toast.error('No fue posible crear el evento');
      }
    },
  });
}
