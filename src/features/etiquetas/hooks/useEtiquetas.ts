import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import type { Etiqueta, TipoEtiqueta } from '@/api/types';

// Factory de query keys de etiquetas — fuente única para la cache.
// La pantalla de Configuración, el selector del detalle de trato/tarea y el render del
// kanban comparten estas keys, por lo que invalidar tras crear/editar/eliminar refresca TODO.
// La key incluye el tipo para cachear por separado los filtros TAREA/TRATO y el catálogo full.
export const etiquetasKeys = {
  all: ['etiquetas'] as const,
  list: (tipo?: TipoEtiqueta) => ['etiquetas', tipo ?? 'ALL'] as const,
  detail: (id: string) => ['etiquetas', 'detail', id] as const,
};

/**
 * Lista el catálogo de etiquetas, opcionalmente filtrado por tipo (TAREA|TRATO).
 * Sin tipo devuelve el catálogo completo.
 */
export function useEtiquetas(tipo?: TipoEtiqueta): UseQueryResult<Etiqueta[]> {
  return useQuery<Etiqueta[]>({
    queryKey: etiquetasKeys.list(tipo),
    queryFn: () => apiClient.get<Etiqueta[]>(endpoints.etiquetas.getAll(tipo)),
  });
}
