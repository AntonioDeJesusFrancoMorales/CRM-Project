// useCrearColumnaEnTablero — orquestador del flujo "Nueva columna desde el board".
//
// El flujo son DOS llamadas en secuencia:
//   1. POST /columnas/create → crea la columna en el catálogo y obtiene su id.
//   2. POST /tableros/asignar-columna → asigna esa columna al tablero con la
//      configuración contextual (limiteWip, estado, totalValorEstimado).
//
// Fallo parcial: si 1 OK y 2 falla → toast específico + error propagado.
//   El dialog NO debe cerrarse como éxito (la mutación queda en isError).
//   No hay rollback del catálogo (el back no lo expone; la columna queda reutilizable).
//
// onSuccess total: invalida ['columnas'] + ['tableros'] + toast éxito.

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import type { Columna, ColumnaCreateInput } from '@/features/kanban/schemas/columna.schema';
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
  Columna,
  Error,
  CrearColumnaEnTableroVars
> {
  const queryClient = useQueryClient();

  return useMutation<Columna, Error, CrearColumnaEnTableroVars>({
    mutationFn: async ({ columna, asignacion }) => {
      // Paso 1: crear en el catálogo
      const columnaCreada = await apiClient.post<Columna>(
        endpoints.columnas.create(),
        columna,
      );

      // Paso 2: asignar al tablero usando el id recién obtenido
      const { tableroId, ...datosAsignacion } = asignacion;
      try {
        await apiClient.post(
          endpoints.tableros.asignarColumna(tableroId, columnaCreada.id),
          datosAsignacion,
        );
      } catch (asignarError) {
        // Fallo parcial: la columna se creó pero no se pudo asignar.
        // El catálogo queda con la columna (reutilizable); notificamos al usuario
        // con un mensaje específico y re-lanzamos para que la mutación quede en isError.
        if (isHttpError(asignarError)) {
          toast.error('La columna se creó pero no se pudo agregar al tablero');
          throw asignarError;
        }
        toast.error('La columna se creó pero no se pudo agregar al tablero');
        throw asignarError;
      }

      return columnaCreada;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: columnasKeys.all });
      void queryClient.invalidateQueries({ queryKey: tablerosKeys.all });
      toast.success('Columna creada y agregada al tablero');
    },
    onError: (_error) => {
      // El fallo parcial ya mostró su toast específico desde mutationFn.
      // Los errores de la primera llamada (crear) no tienen toast propio aún;
      // si se necesita se añade aquí en Fase 4 cuando el dialog esté conectado.
    },
  });
}
