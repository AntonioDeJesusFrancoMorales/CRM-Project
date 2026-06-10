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
import { useArrastreReciente } from './arrastreReciente';
import { FichaDeleteDialog } from './FichaDeleteDialog';

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
}

export function KanbanCard({ ficha, titulo, detalles = [], badge, etiquetas = [], to }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: ficha.id,
    // type: 'ficha' permite discriminar fichas vs columnas en el onDragEnd del DndContext
    data: { type: 'ficha', ficha },
  });

  const [deleteOpen, setDeleteOpen] = useState(false);
  const { eliminar, isPending, bloqueado, cantidadTareas } = useEliminarTarjeta(ficha);

  // Bandera compartida por el board: si recién terminó un arrastre, el click posterior al
  // drop no debe navegar al detalle. Ver arrastreReciente.ts.
  const arrastreRecienteRef = useArrastreReciente();

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
          <div className="min-w-0 flex-1">
            {/* Título: ÚNICO punto de entrada al detalle (click). El resto de la tarjeta solo arrastra. */}
            {to ? (
              <Link
                to={to}
                className="block truncate text-sm font-medium text-card-foreground hover:underline"
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
              <p className="truncate text-sm font-medium text-card-foreground">{titulo}</p>
            )}

            {/* Badge de prioridad u otro indicador — área de arrastre, NO navegable */}
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

            {/* Detalles adicionales (valor, probabilidad, fecha, tipo, etc.) — área de arrastre, NO navegable */}
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

            {/* Chips de etiquetas — punto de color + nombre. Fondo tenue derivado del color
                de la etiqueta (sufijo alpha fijo, funciona en light y dark). */}
            {etiquetas.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-1" aria-label="Etiquetas">
                {etiquetas.map((e) => (
                  <li
                    key={e.id}
                    className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium"
                    style={{ borderColor: e.color, backgroundColor: e.color + '1A', color: e.color }}
                    title={e.nombre}
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: e.color }}
                      aria-hidden="true"
                    />
                    <span className="max-w-[8rem] truncate">{e.nombre}</span>
                  </li>
                ))}
              </ul>
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
