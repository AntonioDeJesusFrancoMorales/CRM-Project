// Función pura: deriva el estado de un trato (ABIERTO | GANADO | PERDIDO)
// a partir de la columna donde está su ficha en el tablero.
//
// El back NO expone un campo `estado` en el Trato: el ciclo de vida se DERIVA
// de la columna (ColumnaTablero.estadoTrato) donde vive la ficha del trato.
// Cadena: tratoId -> Ficha (tipoFicha=TRATO) -> columnaId -> Columna.estadoTrato.
//
// Sin side-effects, sin hooks: reutilizable por el Kanban y por la página de contacto (W1).

import type { Ficha } from '../schemas/ficha.schema';
import type { ColumnaTablero, EstadoTrato } from '../schemas/tablero.schema';

/**
 * Devuelve el estado del trato derivado de la columna de su ficha.
 *
 * Retorna `null` cuando:
 * - el trato no tiene ninguna ficha de tipo TRATO,
 * - la ficha apunta a una columna que no está en el tablero, o
 * - la columna no tiene estadoTrato (p. ej. columna de un tablero de TAREAS).
 *
 * Si hay múltiples fichas TRATO con el mismo tratoId, usa la primera del array
 * (el orden del caller define la prioridad).
 */
export function deriveEstadoTrato(
  tratoId: string,
  fichas: Ficha[],
  columnas: ColumnaTablero[],
): EstadoTrato | null {
  const ficha = fichas.find(
    (f) => f.tipoFicha === 'TRATO' && f.tratoId === tratoId,
  );
  if (!ficha) return null;

  const columna = columnas.find((c) => c.id === ficha.columnaId);
  if (!columna) return null;

  return columna.estadoTrato;
}
