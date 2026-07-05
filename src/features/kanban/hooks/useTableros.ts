// Hook para listar tableros del Kanban con filtro server-side opcional por tipoTablero.
// Valida la respuesta con tableroSchema (zod) — fuente de verdad del contrato.

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { z } from 'zod';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { tableroSchema, type Tablero } from '@/features/kanban/schemas/tablero.schema';

export const tablerosKeys = {
  all: ['tableros'] as const,
  list: (filters?: { tipoTablero?: string }) =>
    filters ? (['tableros', filters] as const) : (['tableros'] as const),
  detail: (id: string) => ['tableros', id] as const,
};

export function useTableros(filters?: { tipoTablero?: string }): UseQueryResult<Tablero[]> {
  return useQuery<Tablero[]>({
    queryKey: tablerosKeys.list(filters),
    queryFn: async () => {
      const data = await apiClient.get<unknown[]>(endpoints.tableros.getAll(filters));
      return z.array(tableroSchema).parse(data);
    },
  });
}
