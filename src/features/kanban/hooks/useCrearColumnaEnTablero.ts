// useCrearColumnaEnTablero — orquestador del flujo "Nueva columna desde el board".
//
// UNA sola llamada: POST /tableros/agregar-columna?id={tableroId}. El back crea la
// columna del catálogo Y la agrega al tablero en una operación atómica
// (AgregarColumnaTableroService). Reemplaza el flujo previo de 2 pasos
// (create + asignar-columna), que dejaba estados parciales si el 2º paso fallaba.
//
// onSuccess: invalida ['columnas'] + ['tableros'] + toast éxito.

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { isHttpError } from '@/api/http-error';
import type { ColumnaCreateInput } from '@/features/kanban/schemas/columna.schema';
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

// Body de POST /tableros/agregar-columna (AgregarColumnaRequest del back).
// tipoTablero NO va: el back lo deriva del tablero.
interface AgregarColumnaBody {
  nombre: string;
  color?: string;
  tipoColumna: ColumnaCreateInput['tipoColumna'];
  limiteWip: number;
  nota?: string;
  estadoTarea?: AsignarColumnaInput['estadoTarea'];
  estadoTrato?: AsignarColumnaInput['estadoTrato'];
  totalValorEstimado: number;
}

export function useCrearColumnaEnTablero(): UseMutationResult<
  Tablero,
  Error,
  CrearColumnaEnTableroVars
> {
  const queryClient = useQueryClient();

  return useMutation<Tablero, Error, CrearColumnaEnTableroVars>({
    mutationFn: async ({ columna, asignacion }) => {
      const { tableroId, limiteWip, estadoTarea, estadoTrato, totalValorEstimado } =
        asignacion;

      const body: AgregarColumnaBody = {
        nombre: columna.nombre,
        color: columna.color,
        tipoColumna: columna.tipoColumna,
        limiteWip,
        estadoTarea,
        estadoTrato,
        totalValorEstimado,
      };

      // UNA llamada: el back crea la columna y la agrega al tablero.
      return apiClient.post<Tablero>(
        endpoints.tableros.agregarColumna(tableroId),
        body,
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
