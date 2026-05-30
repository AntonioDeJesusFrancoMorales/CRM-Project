// Función pura: deriva el estado de una tarea (PENDIENTE | EN_CURSO | FINALIZADA)
// a partir de la columna donde está su ficha en el tablero.
//
// El back NO expone un campo `estado` en la Tarea: el ciclo de vida se DERIVA
// de la columna (ColumnaTablero.estadoTarea) donde vive la ficha de la tarea.
// Cadena: tareaId -> Ficha (tipoFicha=TAREA) -> columnaId -> Columna.estadoTarea.
//
// Sin side-effects, sin hooks: espejo exacto de deriveEstadoTrato.ts.

import type { Ficha } from '../schemas/ficha.schema';
import type { ColumnaTablero, EstadoTarea } from '../schemas/tablero.schema';

/**
 * Devuelve el estado de la tarea derivado de la columna de su ficha.
 *
 * Retorna `null` cuando:
 * - la tarea no tiene ninguna ficha de tipo TAREA,
 * - la ficha apunta a una columna que no está en el tablero, o
 * - la columna no tiene estadoTarea (p. ej. columna de un tablero de TRATOS).
 *
 * Si hay múltiples fichas TAREA con el mismo tareaId, usa la primera del array
 * (el orden del caller define la prioridad).
 */
export function deriveEstadoTarea(
  tareaId: string,
  fichas: Ficha[],
  columnas: ColumnaTablero[],
): EstadoTarea | null {
  const ficha = fichas.find((f) => f.tipoFicha === 'TAREA' && f.tareaId === tareaId);
  if (!ficha) return null;

  const columna = columnas.find((c) => c.id === ficha.columnaId);
  if (!columna) return null;

  return columna.estadoTarea;
}
