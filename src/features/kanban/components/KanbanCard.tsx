// KanbanCard — tarjeta draggable de una ficha de tipo TRATO.
// Usa @dnd-kit/core useDraggable; el id del draggable es ficha.id.
// Muestra tratoId como texto identificable (hasta que haya lookup de datos del trato).
// Tailwind + clases semánticas del design system (sin Radix — es una tarjeta simple).

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Ficha } from '@/features/kanban/schemas/ficha.schema';

interface KanbanCardProps {
  ficha: Ficha;
}

export function KanbanCard({ ficha }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: ficha.id,
    data: { ficha },
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  const tratoLabel = ficha.tratoId ?? 'Sin trato';

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-testid="kanban-card"
      className={[
        'rounded-md border bg-card p-3 shadow-sm',
        'cursor-grab select-none',
        'transition-shadow',
        isDragging ? 'opacity-50 shadow-lg ring-2 ring-primary' : 'hover:shadow-md',
      ].join(' ')}
      {...attributes}
      {...listeners}
    >
      <p className="truncate text-sm font-medium text-card-foreground">{tratoLabel}</p>
    </div>
  );
}
