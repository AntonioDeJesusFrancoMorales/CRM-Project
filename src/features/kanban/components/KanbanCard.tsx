// KanbanCard — tarjeta draggable PURAMENTE PRESENTACIONAL.
// Recibe titulo, detalles y badge ya resueltos por el container (KanbanColumn).
// NO hace fetches internos. El container (KanbanColumn) es responsable de resolver
// trato.nombre, probabilidad, valorEstimado, tarea.titulo, prioridad, etc.
// Props:
//   - ficha: para drag&drop (@dnd-kit) y FichaDeleteDialog
//   - titulo: string resuelto por el container
//   - detalles: lista de {label, value} para mostrar campos adicionales
//   - badge?: {text, classes} para badge de prioridad (TAREA) u otro indicador de color
// Dropdown Radix con opción "Eliminar" + FichaDeleteDialog + useDeleteFicha.

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
import { useDeleteFicha } from '../hooks/useDeleteFicha';
import { FichaDeleteDialog } from './FichaDeleteDialog';

export interface KanbanCardDetalle {
  label: string;
  value: string;
}

export interface KanbanCardBadge {
  text: string;
  classes: string;
}

interface KanbanCardProps {
  ficha: Ficha;
  /** Título principal de la tarjeta — resuelto por KanbanColumn (trato.nombre o tarea.titulo). */
  titulo: string;
  /** Lista de campos adicionales a mostrar debajo del título. */
  detalles?: KanbanCardDetalle[];
  /** Badge opcional (prioridad de tarea u otro indicador con color). */
  badge?: KanbanCardBadge;
}

export function KanbanCard({ ficha, titulo, detalles = [], badge }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: ficha.id,
    data: { ficha },
  });

  const [deleteOpen, setDeleteOpen] = useState(false);
  const deleteMutation = useDeleteFicha();

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

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
          <div className="min-w-0 flex-1">
            {/* Título principal */}
            <p className="truncate text-sm font-medium text-card-foreground">{titulo}</p>

            {/* Badge de prioridad u otro indicador */}
            {badge && (
              <span
                className={[
                  'mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium',
                  badge.classes,
                ].join(' ')}
              >
                {badge.text}
              </span>
            )}

            {/* Detalles adicionales (valor, probabilidad, fecha, tipo, etc.) */}
            {detalles.length > 0 && (
              <dl className="mt-1.5 space-y-0.5">
                {detalles.map((d) => (
                  <div key={d.label} className="flex items-center gap-1 text-xs text-muted-foreground">
                    <dt className="shrink-0 font-medium">{d.label}:</dt>
                    <dd className="truncate">{d.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

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
