// resolverDragEnd — función pura de lógica drag-and-drop para el tablero kanban (ADR-061).
// Recibe el estado explícito del caller (no lo deriva internamente) para mantenerse pura y testeable.
// Usa columna.requiereModal para detectar el caso modal; no hardcodea el valor 'perdido'.

import type { EstadoTrato } from '@/api/types';
import type { ColumnaKanban } from './useColumnasKanban';

export type AccionDrag =
  | { accion: 'ignorar' }
  | { accion: 'ganar'; tratoId: string }
  | { accion: 'reabrir'; tratoId: string }
  | { accion: 'abrir-modal-perder'; tratoId: string; nombre: string };

/**
 * Determina qué acción ejecutar tras un evento drag-end.
 *
 * @param tratoId       ID del trato arrastrado
 * @param estadoOrigen  Estado actual del trato antes del drag
 * @param estadoDestino Estado de la columna destino, o null si se soltó fuera de columna
 * @param columnas      Array de columnas del board (fuente de requiereModal y esTerminal)
 * @param nombre        Nombre del trato (necesario para el payload del modal)
 * @returns AccionDrag — discriminated union con la acción a despachar
 */
export function resolverDragEnd(
  tratoId: string,
  estadoOrigen: EstadoTrato,
  estadoDestino: EstadoTrato | null,
  columnas: ColumnaKanban[],
  nombre: string,
): AccionDrag {
  // Caso 1: drop fuera de cualquier columna
  if (estadoDestino === null) {
    return { accion: 'ignorar' };
  }

  // Caso 2: drop en la misma columna
  if (estadoOrigen === estadoDestino) {
    return { accion: 'ignorar' };
  }

  const columnaOrigen = columnas.find((c) => c.id === estadoOrigen);
  const columnaDestino = columnas.find((c) => c.id === estadoDestino);

  // Caso 3: destino requiere modal (tiene precedencia sobre la regla terminal→terminal).
  // Lee requiereModal de la columna; no hardcodea el valor 'perdido'.
  // Ejemplo: ganado→perdido abre modal aunque ambos sean terminales (ADR-060 excepción).
  if (columnaDestino?.requiereModal) {
    return { accion: 'abrir-modal-perder', tratoId, nombre };
  }

  // Caso 4: transición terminal→terminal prohibida sin modal (ADR-060).
  // Aplica solo cuando el destino no requiere modal (ya descartado arriba).
  if (columnaOrigen?.esTerminal && columnaDestino?.esTerminal) {
    return { accion: 'ignorar' };
  }

  // Caso 5: destino es ganado (transición de abierto o reabrir no aplica aquí)
  // Si llegamos aquí, el destino no es terminal ni requiere modal → es 'ganado' desde no-terminal
  // o es 'abierto' (reabrir desde terminal).
  if (columnaDestino?.esTerminal) {
    // Destino es terminal y no requiere modal → ganar
    return { accion: 'ganar', tratoId };
  }

  // Destino no es terminal → reabrir (el trato vuelve a abierto)
  return { accion: 'reabrir', tratoId };
}
