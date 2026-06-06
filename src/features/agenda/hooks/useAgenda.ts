// Hook para obtener un evento de agenda por id (GET /agendas/get-by-id?id=).
// queryKey ['agendas', id]. enabled solo cuando hay id.

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { agendaSchema, type Agenda } from '@/features/agenda/schemas/agenda.schema';
import { agendasKeys } from './useAgendas';

export function useAgenda(id: string | undefined): UseQueryResult<Agenda> {
  return useQuery<Agenda>({
    queryKey: agendasKeys.detail(id ?? ''),
    queryFn: async () => {
      const data = await apiClient.get<unknown>(endpoints.agendas.getById(id!));
      return agendaSchema.parse(data);
    },
    enabled: Boolean(id),
  });
}
