// huboArrastre — función pura que decide si un gesto fue un ARRASTRE o un CLICK,
// comparando la posición inicial del puntero (pointerdown/mousedown) con la final (click).
// Se usa para que arrastrar una tarjeta del Kanban NO dispare la navegación al detalle.
// El umbral por defecto (5px) es consistente con el activationConstraint del PointerSensor
// de @dnd-kit en KanbanBoard.

export interface PuntoPuntero {
  x: number;
  y: number;
}

/**
 * Devuelve true si el puntero se movió más del umbral entre inicio y fin (= fue un arrastre).
 * Si no hay posición inicial registrada, devuelve false (se trata como click limpio).
 */
export function huboArrastre(
  inicio: PuntoPuntero | null,
  fin: PuntoPuntero,
  umbralPx = 5,
): boolean {
  if (!inicio) return false;
  const dx = Math.abs(fin.x - inicio.x);
  const dy = Math.abs(fin.y - inicio.y);
  return dx > umbralPx || dy > umbralPx;
}
