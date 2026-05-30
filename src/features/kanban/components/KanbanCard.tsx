// KanbanCard — tarjeta draggable de una ficha de tipo TRATO.
// Usa @dnd-kit/core useDraggable; el id del draggable es ficha.id.
// Muestra trato.nombre si está disponible en cache (React Query deduplica la query —
// no es N+1: todos los cards comparten el mismo cache hit de ['tratos']).
// Fallback: tratoId UUID, o 'Sin trato' si tratoId es null.
// Dropdown Radix con opción "Eliminar" que abre FichaDeleteDialog + useDeleteFicha.
// Tailwind + clases semánticas del design system.

import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Ficha } from '@/features/kanban/schemas/ficha.schema';
import { useTratos } from '@/features/tratos/hooks/useTratos';
import { useDeleteFicha } from '../hooks/useDeleteFicha';
import { FichaDeleteDialog } from './FichaDeleteDialog';

interface KanbanCardProps {
  ficha: Ficha;
  /** Label pre-resuelto por el padre (p. ej. tarea.titulo en tableros TAREAS).
   * Si undefined, cae al fallback interno: trato.nombre → tratoId UUID → 'Sin trato'. */
  label?: string;
}

export function KanbanCard({ ficha, label }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: ficha.id,
    data: { ficha },
  });

  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: tratos } = useTratos();
  const deleteMutation = useDeleteFicha();

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  // Fallback interno: trato.nombre → tratoId UUID → 'Sin trato'
  const tratoNombre = tratos?.find((t) => t.id === ficha.tratoId)?.nombre;
  const tratoLabel = tratoNombre ?? ficha.tratoId ?? 'Sin trato';

  // El label final: usa el prop explícito si está presente; si no, cae al fallback interno.
  const displayLabel = label ?? tratoLabel;

  function handleConfirmDelete() {
    deleteMutation.mutate(ficha.id, {
      onSuccess: () => setDeleteOpen(false),
    });
  }

  return (
    <>
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
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-medium text-card-foreground">{displayLabel}</p>

          {/* Dropdown de acciones — stopPropagation evita que el drag intercepte el click */}
          <div
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Acciones de ficha"
                  className="h-6 w-6 shrink-0"
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <FichaDeleteDialog
        open={deleteOpen}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteOpen(false)}
        isDeleting={deleteMutation.isPending}
      />
    </>
  );
}
