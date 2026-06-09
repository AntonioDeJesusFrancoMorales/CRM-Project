// useCrearColumnaEnTablero — orquestador del flujo "Nueva columna desde el board".
//
// DOS llamadas encadenadas (el back NO tiene endpoint atómico):
//   1. POST /columnas/create        → crea la columna en el catálogo, devuelve su id.
//   2. POST /tableros/asignar-columna?id={tableroId}&columnaId={columna.id}
//                                    → agrega esa columna al tablero con su config contextual.
//
// El back AR-CRM no expone /tableros/agregar-columna: el ColumnaController crea el
// catálogo y el TableroController.asignarColumna lo asocia al tablero. Son operaciones
// separadas por diseño (catálogo vs. asignación contextual).
//
// onSuccess: invalida ['columnas'] + ['tableros'] + toast éxito.

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import type { Columna, ColumnaCreateInput } from '@/features/kanban/schemas/columna.schema';
import type { Tablero } from '@/features/kanban/schemas/tablero.schema';
import { columnasKeys } from './useColumnas';
import { tablerosKeys } from './useTableros';
import type { AsignarColumnaInput } from './useAsignarColumna';

// Datos de asignación — misma forma que AsignarColumnaInput + tableroId
interface AsignacionInput extends AsignarColumnaInput {
  tableroId: string;
}

export interface CrearColumnaEnTableroVars {
  columna: ColumnaCreateInput;
  asignacion: AsignacionInput;
}

export function useCrearColumnaEnTablero(): UseMutationResult<
  Tablero,
  Error,
  CrearColumnaEnTableroVars
> {
  const queryClient = useQueryClient();

  return useMutation<Tablero, Error, CrearColumnaEnTableroVars>({
    mutationFn: async ({ columna, asignacion }) => {
      const { tableroId, limiteWip, nota, estadoTarea, estadoTrato, totalValorEstimado } =
        asignacion;

      // Paso 1: crear la columna en el catálogo. Devuelve la Columna con su id.
      const columnaCreada = await apiClient.post<Columna>(
        endpoints.columnas.create(),
        columna,
      );

      // Paso 2: asignar la columna recién creada al tablero con su config contextual.
      // Body = AsignarColumnaRequest del back (totalValorEstimado @NotNull).
      const asignarBody: AsignarColumnaInput = {
        limiteWip,
        nota,
        estadoTarea,
        estadoTrato,
        totalValorEstimado,
      };

      return apiClient.post<Tablero>(
        endpoints.tableros.asignarColumna(tableroId, columnaCreada.id),
        asignarBody,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: columnasKeys.all });
      void queryClient.invalidateQueries({ queryKey: tablerosKeys.all });
      toast.success('Columna creada y agregada al tablero');
    },
    onError: (error) => {
      if (isHttpError(error)) {
        toast.error(error.message);
      } else {
        toast.error('No fue posible crear la columna');
      }
    },
  });
}
