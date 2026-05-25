// KanbanColumna — columna droppable del kanban de tratos.
// Usa useDroppable de @dnd-kit/core. Requiere un <DndContext> ancestro.
// Header: título + WIP counter con formato "Label (N)".

import { useDroppable } from '@dnd-kit/core';
import type { Trato } from '@/api/types';
import type { ColumnaKanban } from '../hooks/useColumnasKanban';
import { KanbanCard } from './KanbanCard';

interface KanbanColumnaProps {
  columna: ColumnaKanban;
  tratos: Trato[];
}

export function KanbanColumna({ columna, tratos }: KanbanColumnaProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: columna.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-xl border bg-muted/40 p-3 transition-colors ${
        isOver ? 'bg-muted/70 ring-2 ring-primary/30' : ''
      }`}
    >
      {/* Header con título y WIP counter */}
      <h3 className="mb-3 text-sm font-semibold text-foreground">
        {columna.label} ({tratos.length})
      </h3>

      {/* Lista de tarjetas */}
      <div className="flex flex-col gap-2">
        {tratos.map((trato) => (
          <KanbanCard key={trato.id} trato={trato} />
        ))}
      </div>
    </div>
  );
}
