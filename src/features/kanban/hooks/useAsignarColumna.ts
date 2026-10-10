// useAsignarColumna — POST /tableros/asignar-columna?id=&columnaId=
// Asigna una columna del catálogo (ya creada) a un tablero con configuración contextual.
// El back NO expone /tableros/agregar-columna: el flujo "nueva columna" encadena
// /columnas/create + este endpoint (ver useCrearColumnaEnTablero).
// totalValorEstimado @NotNull en Java — usar 0 como default si no se especifica.
// Invalida ['tableros', tableroId] para refrescar el tablero con la nueva columna.

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import type { Tablero } from '@/features/kanban/schemas/tablero.schema';
import { tablerosKeys } from './useTableros';

// Refleja AsignarColumnaRequest.java — totalValorEstimado @NotNull
export interface AsignarColumnaInput {
  limiteWip: number;
  nota?: string;
  totalValorEstimado: number;
}

interface AsignarColumnaVars {
  tableroId: string;
  columnaId: string;
  data: AsignarColumnaInput;
}

export function useAsignarColumna(): UseMutationResult<Tablero, Error, AsignarColumnaVars> {
  const queryClient = useQueryClient();

  return useMutation<Tablero, Error, AsignarColumnaVars>({
    mutationFn: ({ tableroId, columnaId, data }) =>
      apiClient.post<Tablero>(endpoints.tableros.asignarColumna(tableroId, columnaId), data),
    onSuccess: (_result, { tableroId }) => {
      void queryClient.invalidateQueries({ queryKey: tablerosKeys.detail(tableroId) });
      toast.success('Columna asignada al tablero');
    },
    onError: (error) => {
      if (isHttpError(error)) {
        if (error.status === 422 || (error.status === 400 && error.details?.length)) return;
        toast.error(error.message);
      } else {
        toast.error('No fue posible asignar la columna');
      }
    },
  });
}
