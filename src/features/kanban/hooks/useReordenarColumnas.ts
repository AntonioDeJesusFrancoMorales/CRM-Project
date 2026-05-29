// useReordenarColumnas — PUT /tableros/reordenar-columnas?id=
// Reordena las columnas de un tablero enviando la lista completa en el nuevo orden.
// Validación client-side (permutación completa):
//   1. nuevoOrden no puede estar vacío.
//   2. nuevoOrden.length === idsActuales.length (mismo número de columnas).
//   3. nuevoOrden no tiene duplicados (set size === length).
//   4. Todos los elementos de nuevoOrden pertenecen a idsActuales (sin ids ajenos).
// Si alguna condición falla → Promise.reject con mensaje claro, SIN llamar HTTP.
// El back requiere la lista completa con los mismos ids; no acepta subconjuntos.
// Invalida ['tableros', tableroId] para refrescar el orden persistido.

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import type { Tablero } from '@/features/kanban/schemas/tablero.schema';
import { tablerosKeys } from './useTableros';

interface ReordenarColumnasVars {
  tableroId: string;
  nuevoOrden: string[];
  /** IDs de las columnas actuales del tablero. nuevoOrden debe ser una permutación exacta. */
  idsActuales: string[];
}

export function useReordenarColumnas(): UseMutationResult<Tablero, Error, ReordenarColumnasVars> {
  const queryClient = useQueryClient();

  return useMutation<Tablero, Error, ReordenarColumnasVars>({
    mutationFn: ({ tableroId, nuevoOrden, idsActuales }) => {
      // Guard 1: lista vacía es inválida
      if (nuevoOrden.length === 0) {
        return Promise.reject(new Error('nuevoOrden no puede estar vacío'));
      }

      // Guard 2: debe tener el mismo número de columnas que el tablero
      if (nuevoOrden.length !== idsActuales.length) {
        return Promise.reject(
          new Error(
            `nuevoOrden debe contener exactamente ${idsActuales.length} elemento(s), recibió ${nuevoOrden.length}`,
          ),
        );
      }

      // Guard 3: no puede tener duplicados
      const sinDuplicados = new Set(nuevoOrden);
      if (sinDuplicados.size !== nuevoOrden.length) {
        return Promise.reject(
          new Error('nuevoOrden contiene ids duplicados; debe ser una permutación sin repeticiones'),
        );
      }

      // Guard 4: todos los ids deben pertenecer al tablero (sin ids ajenos)
      const setActuales = new Set(idsActuales);
      const hayAjenos = nuevoOrden.some((id) => !setActuales.has(id));
      if (hayAjenos) {
        return Promise.reject(
          new Error('nuevoOrden contiene ids que no pertenecen a las columnas del tablero'),
        );
      }

      return apiClient.put<Tablero>(endpoints.tableros.reordenarColumnas(tableroId), {
        nuevoOrden,
      });
    },
    onSuccess: (_result, { tableroId }) => {
      void queryClient.invalidateQueries({ queryKey: tablerosKeys.detail(tableroId) });
      toast.success('Columnas reordenadas');
    },
    onError: (error) => {
      if (isHttpError(error)) {
        if (error.status === 422) return;
        toast.error(error.message);
      } else {
        toast.error('No fue posible reordenar las columnas');
      }
    },
  });
}
