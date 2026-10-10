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
import { CalendarClock, GripVertical, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSynchronousMutationLock } from '@/components/shared/useSynchronousMutationLock';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Ficha } from '@/features/kanban/schemas/ficha.schema';
import { useEliminarTarjeta } from '../hooks/useEliminarTarjeta';
import { useArrastreReciente } from './arrastreReciente';
import { FichaDeleteDialog } from './FichaDeleteDialog';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/features/permissions/context';
import {
  KANBAN_MOVE_FICHA_CHECKS,
  getKanbanEntityDeletionChecks,
} from '../lib/kanbanPermissions';

export interface KanbanCardDetalle {
  label: string;
  value: string;
}

export interface KanbanCardBadge {
  text: string;
  classes: string;
}

/** Etiqueta ya resuelta (nombre + color del catálogo) por el container. */
export interface KanbanCardEtiqueta {
  id: string;
  nombre: string;
  color: string;
}

interface KanbanCardProps {
  ficha: Ficha;
  /** Título principal de la tarjeta — resuelto por KanbanColumn (trato.nombre o tarea.titulo). */
  titulo: string;
  /** Lista de campos adicionales a mostrar debajo del título. */
  detalles?: KanbanCardDetalle[];
  /** Badge opcional (prioridad de tarea u otro indicador con color). */
  badge?: KanbanCardBadge;
  /** Etiquetas resueltas (nombre+color) por el container — se pintan como chips. */
  etiquetas?: KanbanCardEtiqueta[];
  /** Ruta de detalle resuelta por el container (/tratos/:id o /tareas/:id).
   *  Cuando se provee, el área de contenido renderiza un Link para navegar al detalle.
   *  Sin to, la tarjeta no es navegable. */
  to?: string;
  empresaNombre?: string;
  responsableNombre?: string;
}

export interface KanbanCardOverlayData {
  ficha: Ficha;
  titulo: string;
  detalles: KanbanCardDetalle[];
  badge?: KanbanCardBadge;
  etiquetas: KanbanCardEtiqueta[];
  empresaNombre?: string;
  responsableNombre?: string;
}

export function KanbanCard({ ficha, titulo, detalles = [], badge, etiquetas = [], to, empresaNombre, responsableNombre }: KanbanCardProps) {
  const permissions = usePermissions();
  const resource = ficha.tipoFicha === 'TAREA' ? 'TAREA' : 'TRATO';
  const canEdit = permissions.allows(resource, 'ACTUALIZAR');
  const canDelete = permissions.allowsAll(getKanbanEntityDeletionChecks(ficha.tipoFicha));
  const canMoveFicha = permissions.allowsAll(KANBAN_MOVE_FICHA_CHECKS);
  const overlayData: KanbanCardOverlayData = {
    ficha,
    titulo,
    detalles,
    badge,
    etiquetas,
    empresaNombre,
    responsableNombre,
  };
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: ficha.id,
    disabled: !canMoveFicha,
    // type: 'ficha' permite discriminar fichas vs columnas en el onDragEnd del DndContext
    data: { type: 'ficha', ficha, card: overlayData },
  });

  const [deleteOpen, setDeleteOpen] = useState(false);
  const { eliminar, isPending, bloqueado, cantidadTareas } = useEliminarTarjeta(ficha);
  const { acquire, release, isLocked } = useSynchronousMutationLock();

  // Bandera compartida por el board: si recién terminó un arrastre, el click posterior al
  // drop no debe navegar al detalle. Ver arrastreReciente.ts.
  const arrastreRecienteRef = useArrastreReciente();

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  async function handleConfirmDelete() {
    if (!acquire()) return;
    try {
      await eliminar();
      setDeleteOpen(false);
    } finally {
      release();
    }
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        data-testid="kanban-card"
        className={[
          'group/card relative rounded-lg border border-border bg-card p-3',
          'cursor-grab select-none transition-shadow active:cursor-grabbing',
          isDragging ? 'opacity-40' : 'hover:shadow-sm',
        ].join(' ')}
        {...attributes}
        {...listeners}
      >
        <div className="flex items-start gap-1.5">
          <GripVertical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/40 opacity-0 transition-opacity group-hover/card:opacity-100" />
          <div className="min-w-0 flex-1">
            {/* Título: ÚNICO punto de entrada al detalle (click). El resto de la tarjeta solo arrastra. */}
            {to ? (
              <Link
                to={to}
                className="block truncate text-sm font-medium text-foreground hover:text-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  // Backup: si el click llega justo tras soltar un arrastre, no navegar.
                  if (arrastreRecienteRef?.current) {
                    e.preventDefault();
                    arrastreRecienteRef.current = false;
                  }
                }}
                draggable={false}
              >
                {titulo}
              </Link>
            ) : (
              <p className="truncate text-sm font-medium text-foreground">{titulo}</p>
            )}

            {/* Badge de prioridad u otro indicador — área de arrastre, NO navegable */}
          </div>

          {/* Dropdown de acciones — stopPropagation evita que el drag intercepte el click */}
          {(canEdit || canDelete) && <div
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Acciones de ficha"
                  className="-mr-1 -mt-1 shrink-0 text-muted-foreground opacity-0 group-hover/card:opacity-100 data-[state=open]:opacity-100"
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuGroup>
                  {to && canEdit && (
                    <DropdownMenuItem asChild>
                      <Link to={to}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </Link>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuGroup>
                {to && canEdit && canDelete && <DropdownMenuSeparator />}
                {canDelete && (
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>}
        </div>

        {detalles.length > 0 && (
          <dl className="mt-2 flex items-baseline justify-between gap-2 pl-5">
            {detalles.slice(0, 2).map((detalle) => (
              <div key={detalle.label} className="min-w-0">
                <dt className="sr-only">{detalle.label}</dt>
                <dd className="truncate text-sm font-semibold tabular-nums text-foreground">
                  {detalle.value}
                </dd>
              </div>
            ))}
          </dl>
        )}

        {(badge || empresaNombre) && (
          <div className="mt-2 flex items-center gap-2 pl-5">
            {badge && (
              <span className={cn('inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset', badge.classes)}>
                {badge.text}
              </span>
            )}
            {empresaNombre && <span className="truncate text-xs text-muted-foreground">{empresaNombre}</span>}
          </div>
        )}

        <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-border/70 pt-2.5 pl-5">
          <div className="inline-flex items-center gap-1 text-xs tabular-nums text-muted-foreground">
            <CalendarClock className="h-3.5 w-3.5" />
            {detalles[2]?.value ?? 'Sin fecha'}
          </div>
          {responsableNombre && (
            <span className="flex min-w-0 items-center gap-1.5" title={`Responsable: ${responsableNombre}`}>
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                {initials(responsableNombre)}
              </span>
              <span className="truncate text-xs font-medium text-foreground">{responsableNombre}</span>
            </span>
          )}
        </div>

        {etiquetas.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-1 pl-5" aria-label="Etiquetas">
            {etiquetas.map((e) => (
              <li key={e.id} className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground ring-1 ring-inset ring-border" title={e.nombre}>
                {e.nombre}
              </li>
            ))}
          </ul>
        )}
      </div>

      {canDelete && (
        <FichaDeleteDialog
          open={deleteOpen}
          onConfirm={() => { void handleConfirmDelete(); }}
          onCancel={() => setDeleteOpen(false)}
          isDeleting={isPending || isLocked}
          tipoFicha={ficha.tipoFicha}
          bloqueado={bloqueado}
          cantidadTareas={cantidadTareas}
        />
      )}
    </>
  );
}

/** Static card used by DragOverlay; it never registers a second draggable. */
export function KanbanCardOverlay({ card }: { card: KanbanCardOverlayData }) {
  const { titulo, detalles, badge, empresaNombre, responsableNombre } = card;

  return (
    <div className="pointer-events-none w-72 rotate-1 rounded-lg border border-primary/40 bg-card p-3 shadow-2xl ring-2 ring-primary/20">
      <div className="flex items-start gap-1.5">
        <GripVertical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{titulo}</p>
      </div>
      {detalles.length > 0 && (
        <dl className="mt-2 flex items-baseline justify-between gap-2 pl-5">
          {detalles.slice(0, 2).map((detalle) => (
            <div key={detalle.label} className="min-w-0">
              <dt className="sr-only">{detalle.label}</dt>
              <dd className="truncate text-sm font-semibold tabular-nums text-foreground">
                {detalle.value}
              </dd>
            </div>
          ))}
        </dl>
      )}
      {(badge || empresaNombre) && (
        <div className="mt-2 flex items-center gap-2 pl-5">
          {badge && (
            <span className={cn('inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset', badge.classes)}>
              {badge.text}
            </span>
          )}
          {empresaNombre && <span className="truncate text-xs text-muted-foreground">{empresaNombre}</span>}
        </div>
      )}
      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-border/70 pt-2.5 pl-5">
        <div className="inline-flex items-center gap-1 text-xs tabular-nums text-muted-foreground">
          <CalendarClock className="h-3.5 w-3.5" />
          {detalles[2]?.value ?? 'Sin fecha'}
        </div>
        {responsableNombre && (
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
              {initials(responsableNombre)}
            </span>
            <span className="truncate text-xs font-medium text-foreground">{responsableNombre}</span>
          </span>
        )}
      </div>
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}
