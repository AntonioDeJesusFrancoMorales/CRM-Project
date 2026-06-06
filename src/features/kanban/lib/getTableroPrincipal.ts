// getTableroPrincipal — selección canónica del tablero de un tipo.
//
// Regla de dominio: si hay varios tableros del mismo tipo (TRATOS/TAREAS), el front
// usa SIEMPRE el PRIMERO POR FECHA DE CREACIÓN e ignora el resto. Criterio único y
// estable para que el Kanban embebido, la navegación (sidebar Tratos/Tareas) y la
// derivación de estado del trato apunten todos al mismo tablero.
//
// creadoEn es ISO-8601, que ordena cronológicamente de forma lexicográfica.

import type { Tablero, TipoTablero } from '@/features/kanban/schemas/tablero.schema';

export function getTableroPrincipal(
  tableros: Tablero[],
  tipo: TipoTablero,
): Tablero | undefined {
  return tableros
    .filter((t) => t.tipoTablero === tipo)
    .sort((a, b) => a.creadoEn.localeCompare(b.creadoEn))[0];
}
