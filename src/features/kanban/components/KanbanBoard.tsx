// KanbanBoard — tablero Kanban completo con DnD entre columnas.
// Envuelve todo en <DndContext onDragEnd={handler}>.
// Coexistencia de dos tipos de arrastre en el mismo DndContext:
//   - Fichas: draggable con data.type='ficha'; onDragEnd mueve fichas entre columnas.
//   - Columnas: sortable con data.type='columna'; onDragEnd reordena columnas.
// Agrupar fichas por columnaId, filtrar por tipoFicha (prop, default 'TRATO').
// Orden dentro de cada columna: creadoEn ASC (estable, no reordenable).
//
// buildDragEndHandler: función pura exportada para testeo aislado de lógica de fichas.
// buildColumnReorderHandler: función pura exportada para testeo aislado de reorden de columnas.
// onDragEnd: discrimina por active.data.current?.type ('columna' vs resto).

import { useRef } from 'react';
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import type { ColumnaTablero } from '@/features/kanban/schemas/tablero.schema';
import type { Ficha, FichaEditInput, TipoFicha } from '@/features/kanban/schemas/ficha.schema';
import { useUpdateFicha } from '@/features/kanban/hooks/useUpdateFicha';
import { useReordenarColumnas } from '@/features/kanban/hooks/useReordenarColumnas';
import { ArrastreRecienteContext } from './arrastreReciente';
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
// Tipos para buildColumnReorderHandler
// ---------------------------------------------------------------------------

interface ColumnReorderHandlerParams {
  columnas: ColumnaTablero[];
  tableroId: string;
  reordenar: (vars: { tableroId: string; nuevoOrden: string[]; idsActuales: string[] }) => void;
}

/**
 * Función pura de lógica de reorden de columnas exportada para testeo aislado.
 * Recibe un DragEndEvent con active.id = columna origen y over.id = columna destino.
 * Calcula el nuevo orden con arrayMove y llama reordenar.
 * No-op si active.id === over.id (misma posición) o si over es null.
 */
export function buildColumnReorderHandler({
  columnas,
  tableroId,
  reordenar,
}: ColumnReorderHandlerParams) {
  return function handleColumnReorder(event: DragEndEvent): void {
    const { active, over } = event;

    if (!over) return;
    if (active.id === over.id) return;

    const idsActuales = columnas.map((c) => c.id);
    const origenIdx = idsActuales.indexOf(String(active.id));
    const destinoIdx = idsActuales.indexOf(String(over.id));

    if (origenIdx === -1 || destinoIdx === -1) return;

    const nuevoOrden = arrayMove(idsActuales, origenIdx, destinoIdx);

    reordenar({ tableroId, nuevoOrden, idsActuales });
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
  const { mutate: reordenarColumnas } = useReordenarColumnas();

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

  const handleFichaDragEnd = buildDragEndHandler({ fichas: fichasFiltradas, mutate });
  const handleColumnDragEnd = buildColumnReorderHandler({
    columnas,
    tableroId,
    reordenar: reordenarColumnas,
  });

  // Guarda click-vs-arrastre: tras soltar un arrastre el navegador dispara un click sobre
  // la tarjeta; esta bandera (consultada en KanbanCard) cancela esa navegación no deseada.
  // Vive a nivel del board para sobrevivir a re-renders/remounts de las tarjetas.
  const arrastreRecienteRef = useRef(false);

  function handleDragEndConGuard(event: DragEndEvent) {
    const tipo = event.active.data.current?.type as string | undefined;

    if (tipo === 'columna') {
      // Reordenamiento de columna — NO activa la bandera de arrastre reciente de fichas
      handleColumnDragEnd(event);
    } else {
      // Movimiento de ficha entre columnas (tipo === 'ficha' o sin tipo)
      handleFichaDragEnd(event);
      arrastreRecienteRef.current = true;
      // Red de seguridad por si el drop no produce click: limpia la bandera poco después.
      window.setTimeout(() => {
        arrastreRecienteRef.current = false;
      }, 250);
    }
  }

  // Sensor con tolerancia de 5px para evitar drags accidentales en clicks
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  return (
    <DndContext
      sensors={sensors}
      onDragStart={() => {
        arrastreRecienteRef.current = false;
      }}
      onDragEnd={handleDragEndConGuard}
    >
      <ArrastreRecienteContext.Provider value={arrastreRecienteRef}>
        {/* SortableContext habilita el reorden horizontal de columnas */}
        <SortableContext
          items={columnas.map((c) => c.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {columnas.map((columna) => {
              // Nombres de las demás columnas (excluye la propia) para bloqueo de duplicados en edición
              const nombresHermanos = columnas
                .filter((c) => c.id !== columna.id)
                .map((c) => c.nombre ?? '');

              return (
                <KanbanColumn
                  key={columna.id}
                  columna={columna}
                  fichas={fichasPorColumna.get(columna.id) ?? []}
                  tableroId={tableroId}
                  tipoFicha={tipoFicha}
                  nombresHermanos={nombresHermanos}
                />
              );
            })}
          </div>
        </SortableContext>
      </ArrastreRecienteContext.Provider>
    </DndContext>
  );
}
