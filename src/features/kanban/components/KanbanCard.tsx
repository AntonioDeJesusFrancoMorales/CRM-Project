// KanbanCard — tarjeta draggable PURAMENTE PRESENTACIONAL.
// Recibe titulo, detalles y badge ya resueltos por el container (KanbanColumn).
// NO hace fetches internos. El container (KanbanColumn) es responsable de resolver
// trato.nombre, probabilidad, valorEstimado, tarea.titulo, prioridad, etc.
// Props:
//   - ficha: para drag&drop (@dnd-kit) y lógica de borrado
//   - titulo: string resuelto por el container
//   - detalles: lista de {label, value} para mostrar campos adicionales
//   - badge?: {text, classes} para badge de prioridad (TAREA) u otro indicador de color
//   - to?: ruta de detalle resuelta por el container (/tratos/:id o /tareas/:id)
//          cuando se provee, el area de contenido es un Link que navega al detalle.
//          sin to, la tarjeta no es navegable.
// Dropdown Radix con opción "Eliminar" + FichaDeleteDialog + useEliminarTarjeta.

import { useState } from 'react';
import { Link } from 'react-router';
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
import { useEliminarTarjeta } from '../hooks/useEliminarTarjeta';
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
  /** Ruta de detalle resuelta por el container (/tratos/:id o /tareas/:id).
   *  Cuando se provee, el área de contenido renderiza un Link para navegar al detalle.
   *  Sin to, la tarjeta no es navegable. */
  to?: string;
}

export function KanbanCard({ ficha, titulo, detalles = [], badge, to }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: ficha.id,
    data: { ficha },
  });

  const [deleteOpen, setDeleteOpen] = useState(false);
  const { eliminar, isPending, bloqueado, cantidadTareas } = useEliminarTarjeta(ficha);

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  async function handleConfirmDelete() {
    await eliminar();
    setDeleteOpen(false);
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
          {/* Área de contenido — es un Link cuando to está definido */}
          {to ? (
            <Link
              to={to}
              className="min-w-0 flex-1"
              onClick={(e) => e.stopPropagation()}
              draggable={false}
            >
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
            </Link>
          ) : (
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
          )}

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
        onConfirm={() => { void handleConfirmDelete(); }}
        onCancel={() => setDeleteOpen(false)}
        isDeleting={isPending}
        tipoFicha={ficha.tipoFicha}
        bloqueado={bloqueado}
        cantidadTareas={cantidadTareas}
      />
    </>
  );
}
