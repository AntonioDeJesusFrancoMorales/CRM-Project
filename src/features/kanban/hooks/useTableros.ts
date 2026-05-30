// Hook para listar todos los tableros del Kanban.
// queryKey plana ['tableros'] — filtros client-side (el back no filtra server-side).
// Valida la respuesta con tableroSchema (zod) — fuente de verdad del contrato.

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { z } from 'zod';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { tableroSchema, type Tablero } from '@/features/kanban/schemas/tablero.schema';

export const tablerosKeys = {
  all: ['tableros'] as const,
  detail: (id: string) => ['tableros', id] as const,
};

export function useTableros(): UseQueryResult<Tablero[]> {
  return useQuery<Tablero[]>({
    queryKey: tablerosKeys.all,
    queryFn: async () => {
      const data = await apiClient.get<unknown[]>(endpoints.tableros.getAll());
      return z.array(tableroSchema).parse(data);
    },
  });
}
