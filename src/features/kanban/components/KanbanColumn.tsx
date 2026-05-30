// KanbanColumn — columna droppable del tablero Kanban.
// Usa @dnd-kit/core useDroppable; el id del droppable es columna.id.
// Muestra: nombre (fallback 'Sin nombre'), badge estado (dual: estadoTarea o estadoTrato),
//          contador fichas, indicador limiteWip, indicador WIP superado.
// Orden de fichas: creadoEn ASC (orden estable derivado del back).
// Prop tipoFicha: discrimina badge dual y label de KanbanCard.
//   - 'TRATO' (default): badge estadoTrato; KanbanCard.label = trato.nombre (fallback interno)
//   - 'TAREA': badge estadoTarea; KanbanCard.label = tarea.titulo
// Batch 5: prop tableroId + botón "+" (FichaCreateDialog) + botón "Quitar columna".
// Tailwind + Radix Badge (via componentes del proyecto).

import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ColumnaTablero } from '@/features/kanban/schemas/tablero.schema';
import type { Ficha } from '@/features/kanban/schemas/ficha.schema';
import type { TipoFicha } from '@/features/kanban/schemas/ficha.schema';
import { useQuitarColumna } from '@/features/kanban/hooks/useQuitarColumna';
import { useTareas } from '@/features/tareas/hooks/useTareas';
import { FichaCreateDialog } from './FichaCreateDialog';
import { KanbanCard } from './KanbanCard';

interface KanbanColumnProps {
  columna: ColumnaTablero;
  fichas: Ficha[];
  tableroId: string;
  tipoFicha?: TipoFicha; // default 'TRATO' (backward-compatible)
}

// ---------------------------------------------------------------------------
// Badge maps — TRATOS
// ---------------------------------------------------------------------------

const estadoTratoBadgeClasses: Record<string, string> = {
  ABIERTO: 'bg-blue-100 text-blue-800',
  GANADO: 'bg-green-100 text-green-800',
  PERDIDO: 'bg-red-100 text-red-800',
};

const estadoTratoLabel: Record<string, string> = {
  ABIERTO: 'Abierto',
  GANADO: 'Ganado',
  PERDIDO: 'Perdido',
};

// ---------------------------------------------------------------------------
// Badge maps — TAREAS
// ---------------------------------------------------------------------------

const estadoTareaBadgeClasses: Record<string, string> = {
  PENDIENTE: 'bg-yellow-100 text-yellow-800',
  EN_CURSO: 'bg-blue-100 text-blue-800',
  FINALIZADA: 'bg-green-100 text-green-800',
};

const estadoTareaLabel: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  EN_CURSO: 'En curso',
  FINALIZADA: 'Finalizada',
};

// Color de fondo para el header de la columna — usa el color del fixture (puede ser null)
const DEFAULT_COLUMN_COLOR = '#e2e8f0'; // slate-200 como fallback

function sortByFechaAsc(fichas: Ficha[]): Ficha[] {
  return [...fichas].sort(
    (a, b) => new Date(a.creadoEn).getTime() - new Date(b.creadoEn).getTime(),
  );
}

export function KanbanColumn({ columna, fichas, tableroId, tipoFicha = 'TRATO' }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: columna.id });
  const [createOpen, setCreateOpen] = useState(false);
  const { mutate: quitarColumna, isPending: isQuitando } = useQuitarColumna();

  // Para tableros TAREA: resolver label de cada ficha desde tarea.titulo
  const { data: tareas } = useTareas();

  const nombre = columna.nombre ?? 'Sin nombre';
  const color = columna.color ?? DEFAULT_COLUMN_COLOR;
  const sortedFichas = sortByFechaAsc(fichas);

  const wipExcedido =
    columna.limiteWip !== null && fichas.length > columna.limiteWip;

  function handleQuitarColumna() {
    quitarColumna({ tableroId, columnaId: columna.id });
  }

  // Resolver label por tipo: para TAREA busca tarea.titulo; para TRATO lo maneja KanbanCard internamente
  function resolveLabel(ficha: Ficha): string | undefined {
    if (tipoFicha === 'TAREA' && ficha.tareaId) {
      const tarea = tareas?.find((t) => t.id === ficha.tareaId);
      return tarea?.titulo;
    }
    return undefined; // KanbanCard usa su fallback interno (trato.nombre)
  }

  // Badge dual según tipoFicha
  const badge =
    tipoFicha === 'TAREA'
      ? columna.estadoTarea
        ? { text: estadoTareaLabel[columna.estadoTarea] ?? columna.estadoTarea, classes: estadoTareaBadgeClasses[columna.estadoTarea] ?? 'bg-gray-100 text-gray-800' }
        : null
      : columna.estadoTrato
        ? { text: estadoTratoLabel[columna.estadoTrato] ?? columna.estadoTrato, classes: estadoTratoBadgeClasses[columna.estadoTrato] ?? 'bg-gray-100 text-gray-800' }
        : null;

  return (
    <div className="flex w-72 flex-shrink-0 flex-col gap-2">
      {/* Header de la columna */}
      <div
        className="flex items-center justify-between rounded-t-md px-3 py-2"
        style={{ backgroundColor: color + '33' /* transparencia 20% */ }}
      >
        <div className="flex items-center gap-2">
          {/* Indicador de color */}
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: color }}
            aria-hidden="true"
          />
          <h3 className="text-sm font-semibold text-foreground">{nombre}</h3>
        </div>

        <div className="flex items-center gap-1">
          {/* Badge de estado (dual: estadoTrato o estadoTarea según tipoFicha) */}
          {badge && (
            <span
              className={[
                'rounded-full px-2 py-0.5 text-xs font-medium',
                badge.classes,
              ].join(' ')}
            >
              {badge.text}
            </span>
          )}

          {/* Contador de fichas */}
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {fichas.length}
          </span>

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

          {/* Botón "Quitar columna" */}
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
        </div>
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
              className="rounded bg-orange-100 px-1.5 py-0.5 text-xs font-medium text-orange-700"
              aria-label="Limite WIP superado"
            >
              ⚠ Limite superado
            </span>
          )}
        </div>
      )}

      {/* Zona droppable con las fichas */}
      <div
        ref={setNodeRef}
        className={[
          'flex min-h-32 flex-col gap-2 rounded-b-md border-2 p-2 transition-colors',
          isOver ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/30',
        ].join(' ')}
      >
        {sortedFichas.map((ficha) => (
          <KanbanCard key={ficha.id} ficha={ficha} label={resolveLabel(ficha)} />
        ))}
      </div>

      {/* FichaCreateDialog — abierto desde el botón "+" */}
      <FichaCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        columnaId={columna.id}
        tipoFicha={tipoFicha}
      />
    </div>
  );
}
