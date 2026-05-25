// KanbanCard — tarjeta arrastrable del kanban de tratos.
// Usa useDraggable de @dnd-kit/core. Requiere un <DndContext> ancestro.
// Homologación de navegación: button + navigate (mismo patrón que TratosTable — ADR-043).
// Constraint de distancia para que click ≠ drag (activationConstraint distance 8px).

import { useNavigate } from 'react-router';
import { useDraggable } from '@dnd-kit/core';
import type { Trato } from '@/api/types';
import { TratoEstadoBadge } from './TratoEstadoBadge';

interface KanbanCardProps {
  trato: Trato;
}

export function KanbanCard({ trato }: KanbanCardProps) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: trato.id,
    data: { trato },
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`rounded-lg border bg-card p-3 shadow-sm cursor-grab active:cursor-grabbing transition-opacity ${
        isDragging ? 'opacity-50' : 'opacity-100'
      }`}
    >
      <button
        type="button"
        onClick={() => void navigate(`/tratos/${trato.id}`)}
        className="w-full text-left text-sm font-medium text-primary underline-offset-4 hover:underline focus:underline focus:outline-none"
      >
        {trato.nombre}
      </button>
      <div className="mt-2">
        <TratoEstadoBadge estado={trato.estado} />
      </div>
    </div>
  );
}
