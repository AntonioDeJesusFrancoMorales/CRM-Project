// KanbanColumn — columna droppable del tablero Kanban (CONTAINER).
// Usa @dnd-kit/core useDroppable para recibir fichas (área de tarjetas).
// Usa @dnd-kit/sortable useSortable para reordenar columnas entre sí (drag desde el handle).
// Coexistencia: useSortable da su propio setNodeRef para el wrapper de columna;
//   useDroppable da su setNodeRef para el área interna de fichas. Son refs distintas.
// Muestra: nombre (fallback 'Sin nombre'), contador fichas, indicador limiteWip,
//          indicador WIP superado. El badge de estado de columna se omite en AMBOS tipos
//          (TRATO y TAREA): el nombre de la columna ya comunica el estado (decisión de UX).
// Orden de fichas: creadoEn ASC (orden estable derivado del back).
// Prop tipoFicha: discrimina badge dual y resolución de datos de cada ficha.
//   - 'TRATO' (default): badge estadoTrato; resuelve trato.nombre, valorEstimado, probabilidad, fechaCierreEsperada
//                        + muestra total derivado (suma valorEstimado de fichas de la columna)
//   - 'TAREA': badge estadoTarea; resuelve tarea.titulo, prioridad (badge de color), fechaLimite, tipo
// Batch 5: prop tableroId + botón "+" (FichaCreateDialog) + botón "Quitar columna".
// Cambio 2: Container centraliza la resolución de datos para KanbanCard (presentacional).
// Fase 4: botón Pencil (editar columna, siempre visible) + Trash2 condicional (solo columnas PERSONALIZADA).
// Fase 5: GripVertical handle para iniciar reorden de columna (solo el handle arrastra la columna).
// Ajuste: totalValorEstimado es DERIVADO en runtime (suma valorEstimado de tratos de las fichas).
//         No se usa columna.totalValorEstimado del back — ese valor es siempre 0 al crear.

import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Trash2, Pencil, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ColumnaTablero } from '@/features/kanban/schemas/tablero.schema';
import type { Ficha } from '@/features/kanban/schemas/ficha.schema';
import type { TipoFicha } from '@/features/kanban/schemas/ficha.schema';
import { useQuitarColumna } from '@/features/kanban/hooks/useQuitarColumna';
import { useColumnas } from '@/features/kanban/hooks/useColumnas';
import { esPredeterminada } from '@/features/kanban/lib/esPredeterminada';
import { useTareas } from '@/features/tareas/hooks/useTareas';
import { useTratos } from '@/features/tratos/hooks/useTratos';
import { useEtiquetas } from '@/features/etiquetas/hooks/useEtiquetas';
import { TIPO_TAREA_OPTIONS, PRIORIDAD_OPTIONS } from '@/features/tareas/schemas/tarea.schema';
import { formatCurrency, formatDate } from '@/lib/format';
import { FichaCreateDialog } from './FichaCreateDialog';
import { ColumnaEditDialog } from './ColumnaEditDialog';
import { KanbanCard } from './KanbanCard';
import type { KanbanCardDetalle, KanbanCardBadge, KanbanCardEtiqueta } from './KanbanCard';

interface KanbanColumnProps {
  columna: ColumnaTablero;
  fichas: Ficha[];
  tableroId: string;
  tipoFicha?: TipoFicha; // default 'TRATO' (backward-compatible)
  /**
   * Nombres de las demás columnas del tablero (excluye esta misma).
   * Se pasa desde KanbanBoard para evitar acoplar KanbanColumn a un fetch adicional.
   * Se usa como nombresExistentes en ColumnaEditDialog (bloqueo de duplicados).
   */
  nombresHermanos?: string[];
}

// Nota: NINGÚN tablero (ni TRATO ni TAREA) muestra badge de estado de columna — el nombre
// de la columna ya comunica el estado (decisión de UX). Por eso no hay maps de
// estadoTrato/estadoTarea acá. El único badge de tarjeta que sobrevive es el de PRIORIDAD.

// ---------------------------------------------------------------------------
// Badge maps — PRIORIDAD (tarjeta TAREA)
// ---------------------------------------------------------------------------

const prioridadBadgeClasses: Record<string, string> = {
  BAJA: 'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300',
  MEDIA: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  ALTA: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  URGENTE: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DEFAULT_COLUMN_COLOR = '#e2e8f0'; // slate-200 como fallback

function sortByFechaAsc(fichas: Ficha[]): Ficha[] {
  return [...fichas].sort(
    (a, b) => new Date(a.actualizadoEn).getTime() - new Date(b.actualizadoEn).getTime(),
  );
}

/**
 * Sufijo alpha hex fijo para el tinte de fondo del header de columna (≈25%).
 * Valor fijo a propósito: funciona en light y dark sin leer el DOM en render
 * (un cálculo dependiente del tema NO sería reactivo al togglear y desincronizaría
 * el header). Si el dark mode sale de piloto, derivar de useTheme().resolvedTheme.
 */
const HEADER_TINT_ALPHA = '40';

/** Label en español para tipo de tarea. */
function tipoTareaLabel(tipo: string): string {
  return TIPO_TAREA_OPTIONS.find((o) => o.value === tipo)?.label ?? tipo;
}

/** Label en español para prioridad de tarea. */
function prioridadLabel(prioridad: string): string {
  return PRIORIDAD_OPTIONS.find((o) => o.value === prioridad)?.label ?? prioridad;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function KanbanColumn({ columna, fichas, tableroId, tipoFicha = 'TRATO', nombresHermanos = [] }: KanbanColumnProps) {
  // useSortable para reordenar columnas — el arrastre se activa SOLO desde el GripVertical handle.
  // data: { type: 'columna' } permite discriminar en el onDragEnd del DndContext padre.
  const {
    attributes: sortableAttributes,
    listeners: sortableListeners,
    setNodeRef: setSortableRef,
    transform: sortableTransform,
    transition: sortableTransition,
    isDragging: isColumnDragging,
  } = useSortable({ id: columna.id, data: { type: 'columna' } });

  // useDroppable exclusivo para el área de fichas (zona interna de la columna).
  // Ref independiente del sortable — se aplica al div interior de tarjetas.
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: columna.id });

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const { mutate: quitarColumna, isPending: isQuitando } = useQuitarColumna();

  // Derivar si la columna es PREDETERMINADA para mostrar/ocultar el Trash2
  const { data: catalogo = [] } = useColumnas();
  const predeterminada = esPredeterminada(columna.id, catalogo);

  const { data: tareas } = useTareas();
  const { data: tratos } = useTratos();
  // Catálogo de etiquetas (full) — fuente de verdad de nombre+color. Las fichas solo
  // traen el id, así que el chip se resuelve por join contra este mapa.
  const { data: catalogoEtiquetas = [] } = useEtiquetas();
  const etiquetaById = new Map(catalogoEtiquetas.map((e) => [e.id, e]));

  // Resuelve las refs compactas de una ficha en chips listos para pintar (nombre+color).
  // Ids que ya no existen en el catálogo (borrados out-of-band) se descartan.
  function resolveEtiquetas(ficha: Ficha): KanbanCardEtiqueta[] {
    return (ficha.etiquetas ?? [])
      .map((ref) => etiquetaById.get(ref.id))
      .filter((e): e is NonNullable<typeof e> => e !== undefined)
      .map((e) => ({ id: e.id, nombre: e.nombre, color: e.color }));
  }

  const nombre = columna.nombre ?? 'Sin nombre';
  const color = columna.color ?? DEFAULT_COLUMN_COLOR;
  const sortedFichas = sortByFechaAsc(fichas);

  // Total derivado: solo para tableros TRATOS — suma de valorEstimado de los tratos de las fichas.
  // Tratamos valorEstimado ausente/null como 0. NO usa columna.totalValorEstimado del back.
  const totalDerivado: number | null =
    tipoFicha === 'TRATO'
      ? fichas.reduce((acc, ficha) => {
          const trato = tratos?.find((t) => t.id === ficha.tratoId);
          return acc + (trato?.valorEstimado ?? 0);
        }, 0)
      : null;

  const wipExcedido =
    columna.limiteWip !== null && fichas.length > columna.limiteWip;

  function handleQuitarColumna() {
    quitarColumna({ tableroId, columnaId: columna.id });
  }

  // Resolver título, detalles, badge y to de cada ficha según tipoFicha
  function resolveCardProps(ficha: Ficha): {
    titulo: string;
    detalles: KanbanCardDetalle[];
    badge: KanbanCardBadge | undefined;
    to: string | undefined;
  } {
    if (tipoFicha === 'TAREA') {
      const tarea = tareas?.find((t) => t.id === ficha.tareaId);
      const titulo = tarea?.titulo ?? ficha.tareaId ?? 'Sin tarea';
      const detalles: KanbanCardDetalle[] = [];
      let badge: KanbanCardBadge | undefined;

      if (tarea) {
        // Badge de prioridad
        if (tarea.prioridad) {
          badge = {
            text: prioridadLabel(tarea.prioridad),
            classes: prioridadBadgeClasses[tarea.prioridad] ?? 'bg-gray-100 text-gray-800',
          };
        }
        // Fecha límite
        if (tarea.fechaLimite) {
          detalles.push({ label: 'Límite', value: formatDate(tarea.fechaLimite) });
        }
        // Tipo
        if (tarea.tipo) {
          detalles.push({ label: 'Tipo', value: tipoTareaLabel(tarea.tipo) });
        }
      }

      // Solo navegar si hay tareaId válido
      const to = ficha.tareaId ? `/tareas/${ficha.tareaId}` : undefined;

      return { titulo, detalles, badge, to };
    }

    // TRATO (default)
    const trato = tratos?.find((t) => t.id === ficha.tratoId);
    const titulo = trato?.nombre ?? ficha.tratoId ?? 'Sin trato';
    const detalles: KanbanCardDetalle[] = [];
    let badge: KanbanCardBadge | undefined;

    if (trato) {
      if (trato.valorEstimado != null && trato.valorEstimado !== 0) {
        detalles.push({ label: 'Valor', value: formatCurrency(trato.valorEstimado) });
      }
      if (trato.probabilidad != null) {
        detalles.push({ label: 'Prob.', value: `${trato.probabilidad}%` });
      }
      if (trato.fechaCierreEsperada) {
        detalles.push({ label: 'Cierre', value: formatDate(trato.fechaCierreEsperada) });
      }
      // Insignia de cierre: ganado/perdido. Abierto no muestra badge.
      if (trato.estado === 'GANADO') {
        badge = { text: 'Ganado', classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' };
      } else if (trato.estado === 'PERDIDO') {
        badge = { text: 'Perdido', classes: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' };
      }
    }

    // Solo navegar si hay tratoId válido
    const to = ficha.tratoId ? `/tratos/${ficha.tratoId}` : undefined;

    return { titulo, detalles, badge, to };
  }

  // Estilo de transformación para la columna durante el reorden
  const columnStyle = {
    transform: CSS.Transform.toString(sortableTransform),
    transition: sortableTransition,
    opacity: isColumnDragging ? 0.5 : undefined,
  };

  return (
    <div
      ref={setSortableRef}
      style={columnStyle}
      className="flex w-72 flex-shrink-0 flex-col gap-2"
    >
      {/* Header de la columna — dos filas: (1) nombre + acciones, (2) badges informativos */}
      <div
        className="flex flex-col gap-1.5 rounded-t-md px-3 py-2"
        style={{ backgroundColor: color + HEADER_TINT_ALPHA /* tinte ~25%, fijo para light y dark */ }}
      >
        {/* Fila 1: handle + color + nombre (trunca) + acciones */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {/* Handle de reordenamiento — SOLO este elemento inicia el drag de columna */}
            <button
              type="button"
              aria-label="Reordenar columna"
              className="flex-shrink-0 cursor-grab text-muted-foreground hover:text-foreground focus:outline-none"
              {...sortableAttributes}
              {...sortableListeners}
            >
              <GripVertical className="h-4 w-4" />
            </button>

            {/* Indicador de color */}
            <span
              className="h-3 w-3 flex-shrink-0 rounded-full"
              style={{ backgroundColor: color }}
              aria-hidden="true"
            />
            <h3 className="truncate text-sm font-semibold text-foreground" title={nombre}>
              {nombre}
            </h3>
            {/* Contador de fichas — visible junto al nombre (cuántas ocupa la columna) */}
            <span
              className="flex-shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary"
              aria-label={`${fichas.length} fichas`}
            >
              {fichas.length}
            </span>
          </div>

          {/* Acciones — no se encogen */}
          <div className="flex flex-shrink-0 items-center gap-0.5">
            {/* Botón "+" — abre FichaCreateDialog */}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              aria-label="Nueva ficha"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>

            {/* Botón "Editar columna" — siempre visible */}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              aria-label="Editar columna"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>

            {/* Botón "Quitar columna" — solo si la columna NO es PREDETERMINADA */}
            {!predeterminada && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive hover:text-destructive"
                aria-label="Quitar columna"
                onClick={handleQuitarColumna}
                disabled={isQuitando}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Fila 2: Total derivado — SOLO tableros TRATOS. El estado de columna se omite
            a propósito (el nombre ya lo comunica), así que esta fila no aparece en TAREA. */}
        {totalDerivado !== null && (
          <div className="flex flex-wrap items-center gap-1">
            <span
              data-testid="columna-total-derivado"
              className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/40 dark:text-green-300"
            >
              Total: {formatCurrency(totalDerivado)}
            </span>
          </div>
        )}
      </div>

      {/* Indicador limiteWip */}
      {columna.limiteWip !== null && (
        <div className="flex items-center justify-between px-3">
          <span className="text-xs text-muted-foreground">
            WIP: {fichas.length}/{columna.limiteWip}
          </span>
          {wipExcedido && (
            <span
              data-testid="wip-exceeded"
              className="rounded bg-orange-100 px-1.5 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"
              aria-label="Limite WIP superado"
            >
              ⚠ Limite superado
            </span>
          )}
        </div>
      )}

      {/* Zona droppable para fichas — ref independiente del sortable de columna.
          min-h chico: la columna se ajusta a su contenido (sin bloque vacío forzado),
          conservando una zona mínima para poder soltar fichas. */}
      <div
        ref={setDropRef}
        className={[
          'flex min-h-16 flex-col gap-2 rounded-b-md border-2 p-2 transition-colors',
          isOver ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/30',
        ].join(' ')}
      >
        {sortedFichas.length === 0 ? (
          <p className="flex flex-1 items-center justify-center rounded-md border border-dashed border-muted-foreground/20 px-2 py-3 text-center text-xs text-muted-foreground/60">
            Suelta fichas aquí
          </p>
        ) : (
          sortedFichas.map((ficha) => {
            const { titulo, detalles, badge, to } = resolveCardProps(ficha);
            return (
              <KanbanCard
                key={ficha.id}
                ficha={ficha}
                titulo={titulo}
                detalles={detalles}
                badge={badge}
                etiquetas={resolveEtiquetas(ficha)}
                to={to}
              />
            );
          })
        )}
      </div>

      {/* FichaCreateDialog — abierto desde el botón "+" */}
      <FichaCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        columnaId={columna.id}
        tipoFicha={tipoFicha}
      />

      {/* ColumnaEditDialog — abierto desde el botón lápiz */}
      <ColumnaEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        columna={columna}
        nombresExistentes={nombresHermanos}
      />
    </div>
  );
}
