// KanbanColumn — columna droppable del tablero Kanban.
// Usa @dnd-kit/core useDroppable; el id del droppable es columna.id.
// Muestra: nombre (fallback 'Sin nombre'), badge estadoTrato, contador fichas,
//          indicador limiteWip (si no null), indicador WIP superado (data-testid="wip-exceeded").
// Orden de fichas: creadoEn ASC (orden estable derivado del back).
// Tailwind + Radix Badge (via componentes del proyecto).

import { useDroppable } from '@dnd-kit/core';
import type { ColumnaTablero } from '@/features/kanban/schemas/tablero.schema';
import type { Ficha } from '@/features/kanban/schemas/ficha.schema';
import { KanbanCard } from './KanbanCard';

interface KanbanColumnProps {
  columna: ColumnaTablero;
  fichas: Ficha[];
}

const estadoBadgeClasses: Record<string, string> = {
  ABIERTO: 'bg-blue-100 text-blue-800',
  GANADO: 'bg-green-100 text-green-800',
  PERDIDO: 'bg-red-100 text-red-800',
};

const estadoLabel: Record<string, string> = {
  ABIERTO: 'Abierto',
  GANADO: 'Ganado',
  PERDIDO: 'Perdido',
};

// Color de fondo para el header de la columna — usa el color del fixture (puede ser null)
const DEFAULT_COLUMN_COLOR = '#e2e8f0'; // slate-200 como fallback

function sortByFechaAsc(fichas: Ficha[]): Ficha[] {
  return [...fichas].sort(
    (a, b) => new Date(a.creadoEn).getTime() - new Date(b.creadoEn).getTime(),
  );
}

export function KanbanColumn({ columna, fichas }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: columna.id });

  const nombre = columna.nombre ?? 'Sin nombre';
  const color = columna.color ?? DEFAULT_COLUMN_COLOR;
  const sortedFichas = sortByFechaAsc(fichas);

  const wipExcedido =
    columna.limiteWip !== null && fichas.length > columna.limiteWip;

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
          {/* Badge estadoTrato */}
          {columna.estadoTrato && (
            <span
              className={[
                'rounded-full px-2 py-0.5 text-xs font-medium',
                estadoBadgeClasses[columna.estadoTrato] ?? 'bg-gray-100 text-gray-800',
              ].join(' ')}
            >
              {estadoLabel[columna.estadoTrato] ?? columna.estadoTrato}
            </span>
          )}

          {/* Contador de fichas */}
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {fichas.length}
          </span>
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
          <KanbanCard key={ficha.id} ficha={ficha} />
        ))}
      </div>
    </div>
  );
}
