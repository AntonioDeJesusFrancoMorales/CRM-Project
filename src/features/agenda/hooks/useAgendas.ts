// Hook para listar la agenda del usuario autenticado (GET /agendas/get-all-by-user).
// El back filtra por el usuario del JWT — es "mi agenda", no un listado global.
// queryKey plana ['agendas']. Valida la respuesta con agendaSchema (zod).

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { z } from 'zod';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { agendaSchema, type Agenda } from '@/features/agenda/schemas/agenda.schema';

export const agendasKeys = {
  all: ['agendas'] as const,
  detail: (id: string) => ['agendas', id] as const,
};

export function useAgendas(): UseQueryResult<Agenda[]> {
  return useQuery<Agenda[]>({
    queryKey: agendasKeys.all,
    queryFn: async () => {
      const data = await apiClient.get<unknown[]>(endpoints.agendas.getAllByUser());
      return z.array(agendaSchema).parse(data);
    },
  });
}
