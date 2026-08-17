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

import { useEffect, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
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
import type { Ficha, TipoFicha } from '@/features/kanban/schemas/ficha.schema';
import { useMoverFicha, type MoverFichaVars } from '@/features/kanban/hooks/useMoverFicha';
import { useReordenarColumnas } from '@/features/kanban/hooks/useReordenarColumnas';
import { ArrastreRecienteContext } from './arrastreReciente';
import { KanbanColumn } from './KanbanColumn';

// ---------------------------------------------------------------------------
// Tipos para buildDragEndHandler
// ---------------------------------------------------------------------------

interface DragEndHandlerParams {
  fichas: Ficha[];
  mutate: (vars: MoverFichaVars) => void;
}

/**
 * Función pura de lógica de drag-end exportada para testeo aislado.
 * Acepta DragEndEvent directamente (UniqueIdentifier = string | number).
 * Si la ficha se soltó en OTRA columna → llama mutate con el nuevo targetColumnaId.
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

    mutate({ id: fichaId, targetColumnaId: columnaDestinoId });
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
  onAddColumn?: () => void;
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function KanbanBoard({ columnas, fichas, tableroId, tipoFicha = 'TRATO', onAddColumn }: KanbanBoardProps) {
  const { mutate } = useMoverFicha();
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
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [canScrollRight, setCanScrollRight] = useState(false);

  function updateScrollHint() {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }

  useEffect(() => {
    updateScrollHint();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollHint, { passive: true });
    window.addEventListener('resize', updateScrollHint);
    return () => {
      el.removeEventListener('scroll', updateScrollHint);
      window.removeEventListener('resize', updateScrollHint);
    };
  }, [columnas.length, fichasFiltradas.length, onAddColumn]);

  function scrollRight() {
    scrollRef.current?.scrollBy({ left: 320, behavior: 'smooth' });
  }

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
          <div className="relative">
            <div
              ref={scrollRef}
              className="-mx-4 flex min-h-[calc(100dvh-25rem)] gap-3 overflow-x-auto overflow-y-visible px-4 pb-2 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:-mx-6 lg:px-6 [&::-webkit-scrollbar]:hidden"
            >
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
              {onAddColumn && (
                <div className="w-72 shrink-0">
                  <button
                    type="button"
                    onClick={onAddColumn}
                    className="flex h-28 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    Nueva columna
                  </button>
                </div>
              )}
            </div>

            {canScrollRight && (
              <>
                <div className="pointer-events-none fixed bottom-0 right-0 top-14 z-10 w-20 bg-gradient-to-l from-background via-background/80 to-transparent" aria-hidden="true" />
                <button
                  type="button"
                  onClick={scrollRight}
                  className="fixed right-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-popover/90 text-muted-foreground shadow-lg ring-1 ring-foreground/10 backdrop-blur transition-colors hover:text-foreground"
                  aria-label="Mostrar más columnas"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </>
            )}
          </div>
        </SortableContext>
      </ArrastreRecienteContext.Provider>
    </DndContext>
  );
}
