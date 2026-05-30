// Hook para listar TODAS las fichas del sistema.
// queryKey plana ['fichas'] — COMPARTIDA con W1 (ContactoDetailPage).
// El back no filtra por tablero (get-all devuelve todas); filtrado client-side.
// Valida la respuesta con fichaSchema (zod).

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { z } from 'zod';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { fichaSchema, type Ficha } from '@/features/kanban/schemas/ficha.schema';

export const fichasKeys = {
  all: ['fichas'] as const,
};

export function useFichas(): UseQueryResult<Ficha[]> {
  return useQuery<Ficha[]>({
    queryKey: fichasKeys.all,
    queryFn: async () => {
      const data = await apiClient.get<unknown[]>(endpoints.fichas.getAll());
      return z.array(fichaSchema).parse(data);
    },
  });
}
