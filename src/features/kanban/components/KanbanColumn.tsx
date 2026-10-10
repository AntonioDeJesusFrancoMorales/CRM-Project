// KanbanColumn — columna droppable del tablero Kanban (CONTAINER).
// Usa @dnd-kit/core useDroppable para recibir fichas (área de tarjetas).
// Usa @dnd-kit/sortable useSortable para reordenar columnas entre sí (drag desde el handle).
// Coexistencia: useSortable da su propio setNodeRef para el wrapper de columna;
//   useDroppable da su setNodeRef para el área interna de fichas. Son refs distintas.
// Muestra: nombre (fallback 'Sin nombre'), contador fichas, indicador limiteWip,
//          indicador WIP superado. El badge de estado de columna se omite en AMBOS tipos
//          (TRATO y TAREA): el nombre de la columna ya comunica el estado (decisión de UX).
// Orden de fichas: actualizadoEn ASC (orden estable derivado del back).
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
import { MoreHorizontal, Trash2, Pencil, GripVertical, Trophy, XCircle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSynchronousMutationLock } from '@/components/shared/useSynchronousMutationLock';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ColumnaTablero } from '@/features/kanban/schemas/tablero.schema';
import type { Ficha } from '@/features/kanban/schemas/ficha.schema';
import type { TipoFicha } from '@/features/kanban/schemas/ficha.schema';
import { useQuitarColumna } from '@/features/kanban/hooks/useQuitarColumna';
import { useColumnas } from '@/features/kanban/hooks/useColumnas';
import { esPredeterminada } from '@/features/kanban/lib/esPredeterminada';
import { useTareas } from '@/features/tareas/hooks/useTareas';
import { useTratos } from '@/features/tratos/hooks/useTratos';
import { useContactos } from '@/features/contactos/hooks/useContactos';
import { useEmpresas } from '@/features/empresas/hooks/useEmpresas';
import { useUsuarios } from '@/features/usuarios/hooks/useUsuarios';
import { useEtiquetas } from '@/features/etiquetas/hooks/useEtiquetas';
import { TIPO_TAREA_OPTIONS, PRIORIDAD_OPTIONS } from '@/features/tareas/schemas/tarea.schema';
import { formatCompactCurrency, formatCurrency, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { TratoCreateDialog } from '@/features/tratos/components/TratoCreateDialog';
import { TareaCreateDialog } from '@/features/tareas/components/TareaCreateDialog';
import { ColumnaEditDialog } from './ColumnaEditDialog';
import { KanbanCard } from './KanbanCard';
import type { KanbanCardDetalle, KanbanCardBadge, KanbanCardEtiqueta } from './KanbanCard';
import { usePermissions } from '@/features/permissions/context';
import {
  KANBAN_REORDER_COLUMN_CHECKS,
  getKanbanEntityCreationChecks,
} from '../lib/kanbanPermissions';

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

function stageTone(nombre: string) {
  const normalized = nombre.toLowerCase();
  if (normalized.includes('ganad')) {
    return {
      Icon: Trophy,
      column: 'border-emerald-200/60 bg-emerald-50/40 dark:border-emerald-500/15 dark:bg-emerald-500/[0.03]',
      header: 'border-b border-emerald-200/50 bg-emerald-50/60 dark:border-emerald-500/10 dark:bg-emerald-500/[0.06]',
      title: 'text-emerald-700/90 dark:text-emerald-300/90',
      icon: 'text-emerald-600/90 dark:text-emerald-400/90',
      count: 'bg-emerald-100/70 text-emerald-700/90 ring-emerald-600/15 dark:bg-emerald-500/10 dark:text-emerald-300/90 dark:ring-emerald-400/15',
      empty: 'border-emerald-200/50 text-emerald-600/90 dark:border-emerald-500/15 dark:text-emerald-400/90',
      emptyLabel: 'Aún sin tratos ganados',
    };
  }
  if (normalized.includes('perdid')) {
    return {
      Icon: XCircle,
      column: 'border-rose-200/60 bg-rose-50/40 dark:border-rose-500/15 dark:bg-rose-500/[0.03]',
      header: 'border-b border-rose-200/50 bg-rose-50/60 dark:border-rose-500/10 dark:bg-rose-500/[0.06]',
      title: 'text-rose-600/90 dark:text-rose-300/90',
      icon: 'text-rose-500/90 dark:text-rose-400/90',
      count: 'bg-rose-100/70 text-rose-600/90 ring-rose-500/15 dark:bg-rose-500/10 dark:text-rose-300/90 dark:ring-rose-400/15',
      empty: 'border-rose-200/50 text-rose-500/90 dark:border-rose-500/15 dark:text-rose-400/90',
      emptyLabel: 'Sin tratos perdidos',
    };
  }
  return null;
}

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
  const permissions = usePermissions();
  const canCreateEntity = permissions.allowsAll(getKanbanEntityCreationChecks(tipoFicha));
  const canEditColumn = permissions.allows('COLUMNA', 'ACTUALIZAR');
  const canReorderColumns = permissions.allowsAll(KANBAN_REORDER_COLUMN_CHECKS);
  const canRemoveColumn = permissions.allowsAll(KANBAN_REORDER_COLUMN_CHECKS);
  const canReadFinancial = permissions.canReadGroup('TRATO', 'FINANCIERO');

  // useSortable para reordenar columnas — el arrastre se activa SOLO desde el GripVertical handle.
  // data: { type: 'columna' } permite discriminar en el onDragEnd del DndContext padre.
  const {
    attributes: sortableAttributes,
    listeners: sortableListeners,
    setNodeRef: setSortableRef,
    transform: sortableTransform,
    transition: sortableTransition,
    isDragging: isColumnDragging,
  } = useSortable({ id: columna.id, disabled: !canReorderColumns, data: { type: 'columna' } });

  // useDroppable exclusivo para el área de fichas (zona interna de la columna).
  // Ref independiente del sortable — se aplica al div interior de tarjetas.
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: columna.id });

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const { mutate: quitarColumna, isPending: isQuitando } = useQuitarColumna();
  const { acquire: acquireDelete, release: releaseDelete, isLocked: deleteLocked } = useSynchronousMutationLock();

  // Derivar si la columna es PREDETERMINADA para mostrar/ocultar el Trash2
  const { data: catalogo = [] } = useColumnas();
  const predeterminada = esPredeterminada(columna.id, catalogo);

  const { data: tareas } = useTareas();
  const { data: tratos } = useTratos();
  const { data: contactos = [] } = useContactos();
  const { data: empresas = [] } = useEmpresas();
  const { data: usuarios = [] } = useUsuarios();
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
  const tone = stageTone(nombre);
  const sortedFichas = sortByFechaAsc(fichas);

  // Total derivado: solo para tableros TRATOS — suma de valorEstimado de los tratos de las fichas.
  // Tratamos valorEstimado ausente/null como 0. NO usa columna.totalValorEstimado del back.
  const totalDerivado: number | null =
    tipoFicha === 'TRATO' && canReadFinancial
      ? fichas.reduce((acc, ficha) => {
          const trato = tratos?.find((t) => t.id === ficha.tratoId);
          return acc + (trato?.valorEstimado ?? 0);
        }, 0)
      : null;

  const wipExcedido =
    columna.limiteWip !== null && fichas.length > columna.limiteWip;
  const wipAlMaximo =
    columna.limiteWip !== null && fichas.length >= columna.limiteWip;
  const wipAdvertencia =
    columna.limiteWip !== null && fichas.length >= Math.ceil(columna.limiteWip * 0.75);

  function handleEliminarColumna() {
    if (predeterminada || fichas.length > 0 || isQuitando || !canRemoveColumn || !acquireDelete()) return;
    quitarColumna(
      { tableroId, columnaId: columna.id },
      { onSettled: () => releaseDelete() },
    );
  }

  // Resolver título, detalles, badge y to de cada ficha según tipoFicha
  function resolveCardProps(ficha: Ficha): {
    titulo: string;
    detalles: KanbanCardDetalle[];
    badge: KanbanCardBadge | undefined;
    to: string | undefined;
    empresaNombre: string | undefined;
    responsableNombre: string | undefined;
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

       return { titulo, detalles, badge, to, empresaNombre: undefined, responsableNombre: undefined };
    }

    // TRATO (default)
    const trato = tratos?.find((t) => t.id === ficha.tratoId);
    const contacto = trato ? contactos.find((c) => c.id === trato.contactoId) : undefined;
    const empresa = contacto ? empresas.find((e) => e.id === contacto.empresaId) : undefined;
    const responsable = trato ? usuarios.find((u) => u.id === trato.responsableId) : undefined;
    const titulo = trato?.nombre ?? ficha.tratoId ?? 'Sin trato';
    const detalles: KanbanCardDetalle[] = [];
    let badge: KanbanCardBadge | undefined;

    if (trato) {
       if (canReadFinancial) {
         if (trato.valorEstimado != null && trato.valorEstimado !== 0) {
           detalles.push({ label: 'Valor', value: formatCurrency(trato.valorEstimado) });
         }
         if (trato.probabilidad != null) {
           detalles.push({ label: 'Prob.', value: `${trato.probabilidad}%` });
         }
         if (trato.fechaCierreEsperada) {
           detalles.push({ label: 'Cierre', value: formatDate(trato.fechaCierreEsperada) });
         }
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
    return {
      titulo,
      detalles,
      badge,
      to,
      empresaNombre: empresa?.nombre,
      responsableNombre: responsable?.nombre,
    };
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
      className={cn(
        'group flex w-72 flex-shrink-0 flex-col overflow-hidden rounded-lg border transition-colors',
        isOver
          ? 'border-primary/50 bg-primary/5 ring-2 ring-primary/20'
          : tone?.column ?? 'border-border bg-muted/40',
      )}
    >
      {/* Header de la columna — alineado al diseño v0: nombre, contador, total compacto y menú. */}
      <div
        className={cn('flex items-center gap-2 px-3 py-2.5', tone?.header)}
        style={!tone ? { backgroundColor: color + HEADER_TINT_ALPHA } : undefined}
      >
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {/* Handle de reordenamiento — SOLO este elemento inicia el drag de columna */}
            {canReorderColumns ? (
              <button
                type="button"
                aria-label="Reordenar columna"
                className="flex-shrink-0 cursor-grab text-muted-foreground hover:text-foreground focus:outline-none"
                {...sortableAttributes}
                {...sortableListeners}
              >
                <GripVertical className="h-4 w-4" />
              </button>
            ) : (
              <span className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            )}

            {/* Indicador de color */}
            <span
              className="h-3 w-3 flex-shrink-0 rounded-full"
              style={{ backgroundColor: color }}
              aria-hidden="true"
            />
            <h3 className={cn('truncate text-sm font-semibold', tone?.title ?? 'font-medium text-foreground')} title={nombre}>
              {nombre}
            </h3>
            {/* Contador de fichas — visible junto al nombre (cuántas ocupa la columna) */}
            <span
              className={cn('flex-shrink-0 rounded-full px-1.5 py-0.5 text-xs font-medium tabular-nums ring-1 ring-inset', tone?.count ?? 'bg-background text-muted-foreground ring-border')}
              aria-label={`${fichas.length} fichas`}
            >
              {fichas.length}
            </span>
          </div>
        {totalDerivado !== null && (
          <span
            data-testid="columna-total-derivado"
            className="mr-1 hidden text-xs tabular-nums text-muted-foreground sm:inline"
            aria-label={`Total estimado: ${formatCompactCurrency(totalDerivado)}`}
          >
            Total: {formatCompactCurrency(totalDerivado)}
          </span>
        )}
        {(canCreateEntity || canEditColumn || canRemoveColumn) && <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-xs" className="text-muted-foreground" aria-label={`Acciones de la columna ${nombre}`}>
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
             <DropdownMenuGroup>
              {canCreateEntity && (
                <DropdownMenuItem onClick={() => setCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  {tipoFicha === 'TAREA' ? 'Agregar tarea' : 'Agregar trato'}
                </DropdownMenuItem>
              )}
              {canEditColumn && (
                <DropdownMenuItem onClick={() => setEditOpen(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar columna
                </DropdownMenuItem>
              )}
                {canRemoveColumn && !predeterminada && (fichas.length > 0 ? (
                 <span title="No se puede eliminar hasta que la columna no tenga fichas">
                   <DropdownMenuItem
                     className="text-destructive focus:text-destructive"
                     disabled
                     aria-label="Eliminar columna; primero mueve sus fichas"
                   >
                     <Trash2 className="mr-2 h-4 w-4" />
                     Eliminar columna
                   </DropdownMenuItem>
                 </span>
               ) : (
                 <DropdownMenuItem
                   className="text-destructive focus:text-destructive"
                   onClick={handleEliminarColumna}
                   disabled={isQuitando || deleteLocked}
                   aria-label="Eliminar columna"
                 >
                   <Trash2 className="mr-2 h-4 w-4" />
                   Eliminar columna
                 </DropdownMenuItem>
               ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>}
      </div>

      {/* Indicador limiteWip */}
      {columna.limiteWip !== null && (
        <div className="flex items-center justify-between gap-2 px-3 pb-2 pt-1.5">
          <span
            className={cn(
              'text-xs font-medium tabular-nums transition-colors',
              wipAlMaximo
                ? 'text-red-600 dark:text-red-400'
                : wipAdvertencia
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-muted-foreground',
            )}
          >
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
          'flex min-h-24 flex-1 flex-col gap-2 px-2 pb-2 transition-colors',
          columna.limiteWip === null ? 'pt-2' : '',
          isOver ? 'bg-primary/5' : '',
        ].join(' ')}
      >
        {sortedFichas.length === 0 ? (
          <p className={cn('flex flex-1 items-center justify-center rounded-md border border-dashed px-3 py-6 text-center text-xs', tone?.empty ?? 'border-border/70 text-muted-foreground')}>
            {tone?.emptyLabel ?? 'Sin tratos'}
          </p>
        ) : (
          sortedFichas.map((ficha) => {
            const { titulo, detalles, badge, to, empresaNombre, responsableNombre } = resolveCardProps(ficha);
            return (
              <KanbanCard
                key={ficha.id}
                ficha={ficha}
                titulo={titulo}
                detalles={detalles}
                badge={badge}
                etiquetas={resolveEtiquetas(ficha)}
                to={to}
                empresaNombre={empresaNombre}
                responsableNombre={responsableNombre}
              />
            );
          })
        )}
      </div>

      {/* Entity creation — the backend creates the ficha; the dialog moves it here afterward. */}
      {canCreateEntity && (tipoFicha === 'TAREA' ? (
        <TareaCreateDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          targetColumnId={columna.id}
          targetColumnName={nombre}
        />
      ) : (
        <TratoCreateDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          targetColumnId={columna.id}
          targetColumnName={nombre}
        />
      ))}

      {/* ColumnaEditDialog — abierto desde el botón lápiz */}
      {canEditColumn && (
        <ColumnaEditDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          columna={columna}
          nombresExistentes={nombresHermanos}
        />
      )}
    </div>
  );
}
