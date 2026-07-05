// Hook para listar fichas con filtros server-side opcionales.
// Valida la respuesta con fichaSchema (zod).

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { z } from 'zod';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { fichaSchema, type Ficha } from '@/features/kanban/schemas/ficha.schema';

export const fichasKeys = {
  all: ['fichas'] as const,
  list: (filters?: { tipoFicha?: string; tratoIds?: string[]; tareaIds?: string[] }) =>
    filters ? (['fichas', filters] as const) : (['fichas'] as const),
};

export function useFichas(filters?: { tipoFicha?: string; tratoIds?: string[]; tareaIds?: string[] }): UseQueryResult<Ficha[]> {
  return useQuery<Ficha[]>({
    queryKey: fichasKeys.list(filters),
    queryFn: async () => {
      const data = await apiClient.get<unknown[]>(endpoints.fichas.getAll(filters));
      return z.array(fichaSchema).parse(data);
    },
  });
}
