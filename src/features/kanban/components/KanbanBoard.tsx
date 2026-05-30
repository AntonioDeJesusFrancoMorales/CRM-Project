// KanbanBoard — tablero Kanban completo con DnD entre columnas.
// Envuelve todo en <DndContext onDragEnd={handler}>.
// Drag SOLO entre columnas (no intra-columna).
// Agrupar fichas por columnaId, filtrar por tipoFicha (prop, default 'TRATO').
// Orden dentro de cada columna: creadoEn ASC (estable, no reordenable).
//
// buildDragEndHandler es una función pura exportada para poder testearla
// de forma aislada (jsdom no soporta arrastre real).
// onDragEnd: si over.id !== ficha.columnaId → useUpdateFicha(mutate); si igual → no-op.

import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { ColumnaTablero } from '@/features/kanban/schemas/tablero.schema';
import type { Ficha, FichaEditInput, TipoFicha } from '@/features/kanban/schemas/ficha.schema';
import { useUpdateFicha } from '@/features/kanban/hooks/useUpdateFicha';
import { KanbanColumn } from './KanbanColumn';

// ---------------------------------------------------------------------------
// Tipos para buildDragEndHandler
// ---------------------------------------------------------------------------

interface DragEndHandlerParams {
  fichas: Ficha[];
  mutate: (vars: { id: string; data: FichaEditInput }) => void;
}

/**
 * Función pura de lógica de drag-end exportada para testeo aislado.
 * Acepta DragEndEvent directamente (UniqueIdentifier = string | number).
 * Si la ficha se soltó en OTRA columna → llama mutate con el nuevo columnaId.
 * Si misma columna o sin destino → no-op.
 */
export function buildDragEndHandler({ fichas, mutate }: DragEndHandlerParams) {
  return function handleDragEnd(event: DragEndEvent): void {
    const { active, over } = event;

    if (!over) return;

    const fichaId = String(active.id);
    const columnaDestinoId = String(over.id);

    const ficha = fichas.find((f) => f.id === fichaId);
    if (!ficha) return;

    // No-op si se soltó en la misma columna
    if (ficha.columnaId === columnaDestinoId) return;

    // Construye FichaEditInput (sin creadoPor — inmutable en el back)
    const data: FichaEditInput = {
      columnaId: columnaDestinoId,
      tipoFicha: ficha.tipoFicha,
      tratoId: ficha.tratoId,
      tareaId: ficha.tareaId,
      responsableId: ficha.responsableId,
    };

    mutate({ id: fichaId, data });
  };
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface KanbanBoardProps {
  columnas: ColumnaTablero[];
  fichas: Ficha[];
  tableroId: string;
  tipoFicha?: TipoFicha; // default 'TRATO' (backward-compatible)
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function KanbanBoard({ columnas, fichas, tableroId, tipoFicha = 'TRATO' }: KanbanBoardProps) {
  const { mutate } = useUpdateFicha();

  // Filtrar fichas por tipo (no hardcodear 'TRATO')
  const fichasFiltradas = fichas.filter((f) => f.tipoFicha === tipoFicha);

  // Agrupar fichas por columnaId
  const fichasPorColumna = new Map<string, Ficha[]>();
  for (const columna of columnas) {
    fichasPorColumna.set(columna.id, []);
  }
  for (const ficha of fichasFiltradas) {
    const lista = fichasPorColumna.get(ficha.columnaId);
    if (lista) {
      lista.push(ficha);
    }
  }

  const handleDragEnd = buildDragEndHandler({ fichas: fichasFiltradas, mutate });

  // Sensor con tolerancia de 5px para evitar drags accidentales en clicks
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columnas.map((columna) => (
          <KanbanColumn
            key={columna.id}
            columna={columna}
            fichas={fichasPorColumna.get(columna.id) ?? []}
            tableroId={tableroId}
            tipoFicha={tipoFicha}
          />
        ))}
      </div>
    </DndContext>
  );
}
