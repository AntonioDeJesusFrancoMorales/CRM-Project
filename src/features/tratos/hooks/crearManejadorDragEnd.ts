// crearManejadorDragEnd — fábrica del manejador drag-end para el tablero kanban.
// ADR-061: lógica de decisión delegada a resolverDragEnd (función pura).
// ADR-058: drag a 'perdido' interrumpe con modal; no hay optimistic update.
//
// Recibe dependencias inyectadas → pure/testeable sin React ni hooks.
// KanbanBoard llama a esta fábrica y conecta los callbacks a sus mutations/state.

import type { DragEndEvent } from '@dnd-kit/core';
import type { EstadoTrato } from '@/api/types';
import type { ColumnaKanban } from './useColumnasKanban';
import { resolverDragEnd } from './resolverDragEnd';

export interface ManejadorDragEndDeps {
  /** Columnas del tablero (provienen de useColumnasKanban). */
  columnas: ColumnaKanban[];
  /**
   * Lookup: dado un tratoId devuelve { estadoOrigen, nombre } o undefined
   * si el trato no existe en la lista actual.
   */
  lookup: (tratoId: string) => { estadoOrigen: EstadoTrato; nombre: string } | undefined;
  /** Callback cuando la acción es 'ganar'. */
  onGanar: (tratoId: string) => void;
  /** Callback cuando la acción es 'reabrir'. */
  onReabrir: (tratoId: string) => void;
  /**
   * Callback cuando la acción es 'abrir-modal-perder'.
   * Recibe el ID y el nombre del trato (para mostrar en el modal).
   */
  onPedirMotivoPerder: (tratoId: string, nombre: string) => void;
}

/**
 * Crea el handler `onDragEnd` para DndContext.
 *
 * Encapsula el dispatch de AccionDrag sin acoplar a React,
 * facilitando los unit tests sin render.
 */
export function crearManejadorDragEnd(deps: ManejadorDragEndDeps): (event: DragEndEvent) => void {
  const { columnas, lookup, onGanar, onReabrir, onPedirMotivoPerder } = deps;

  return function handleDragEnd(event: DragEndEvent): void {
    const activeId = String(event.active.id);
    const overId = event.over ? (String(event.over.id) as EstadoTrato) : null;

    const tratoInfo = lookup(activeId);
    if (!tratoInfo) return;

    const { estadoOrigen, nombre } = tratoInfo;
    const accion = resolverDragEnd(activeId, estadoOrigen, overId, columnas, nombre);

    switch (accion.accion) {
      case 'ignorar':
        return;

      case 'ganar':
        onGanar(accion.tratoId);
        return;

      case 'reabrir':
        onReabrir(accion.tratoId);
        return;

      case 'abrir-modal-perder':
        onPedirMotivoPerder(accion.tratoId, accion.nombre);
        return;
    }
  };
}
