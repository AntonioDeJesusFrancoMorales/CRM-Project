// Hook para obtener el catálogo de columnas disponibles.
// queryKey plana ['columnas'] — catálogo sin filtros.
// Valida la respuesta con columnaSchema (zod).

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { z } from 'zod';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { columnaSchema, type Columna } from '@/features/kanban/schemas/columna.schema';

export const columnasKeys = {
  all: ['columnas'] as const,
};

export function useColumnas(): UseQueryResult<Columna[]> {
  return useQuery<Columna[]>({
    queryKey: columnasKeys.all,
    queryFn: async () => {
      const data = await apiClient.get<unknown[]>(endpoints.columnas.getAll());
      return z.array(columnaSchema).parse(data);
    },
  });
}
