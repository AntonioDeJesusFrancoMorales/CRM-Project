// Hook para obtener un tablero individual por id.
// queryKey ['tableros', id] — habilitada solo cuando id es truthy.
// Valida la respuesta con tableroSchema (zod).

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { tableroSchema, type Tablero } from '@/features/kanban/schemas/tablero.schema';
import { tablerosKeys } from './useTableros';

export function useTablero(id: string | undefined): UseQueryResult<Tablero> {
  return useQuery<Tablero>({
    queryKey: tablerosKeys.detail(id ?? ''),
    queryFn: async () => {
      const data = await apiClient.get<unknown>(endpoints.tableros.getById(id!));
      return tableroSchema.parse(data);
    },
    enabled: !!id,
  });
}
