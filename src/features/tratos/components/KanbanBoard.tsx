// KanbanBoard — tablero kanban con DnD de tratos.
// ADR-055: @dnd-kit/core — PointerSensor (activation distance 8px) + KeyboardSensor (a11y).
// ADR-058: drag a 'perdido' interrumpe con modal-interrupt (pendingDrag); sin optimistic update.
// ADR-060: reglas terminales — ganado→perdido abre modal aunque ambos sean terminales.
// ADR-061: lógica de decisión drag-end delegada a crearManejadorDragEnd (fábrica pura).

import { useState, useMemo } from 'react';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import type { EstadoTrato, Trato } from '@/api/types';
import { useTratos, type UseTratosFilters } from '../hooks/useTratos';
import { useColumnasKanban } from '../hooks/useColumnasKanban';
import { crearManejadorDragEnd } from '../hooks/crearManejadorDragEnd';
import { useGanarTrato } from '../hooks/useGanarTrato';
import { useUpdateTrato } from '../hooks/useUpdateTrato';
import { KanbanColumna } from './KanbanColumna';
import { TratoPerderDialog } from './TratoPerderDialog';

// Estado pendiente de drag cuando se requiere modal
interface PendingDrag {
  tratoId: string;
  nombre: string;
}

interface KanbanBoardProps {
  /**
   * Filtros a aplicar a la query de tratos. Cuando se pasan filtros desde
   * TratosListPage, el kanban muestra solo los tratos que los satisfacen
   * (homologación con TratosTable — ambas vistas consumen los mismos filtros).
   */
  filters?: UseTratosFilters;
}

export function KanbanBoard({ filters }: KanbanBoardProps) {
  const columnas = useColumnasKanban();
  const { data: tratos = [], isLoading, isError, refetch } = useTratos(filters);
  const ganarMutation = useGanarTrato();
  const updateMutation = useUpdateTrato();

  const [pendingDrag, setPendingDrag] = useState<PendingDrag | null>(null);

  // ADR-055: PointerSensor con constraint de distancia para que click ≠ drag.
  // KeyboardSensor para accesibilidad (a11y). No se usa sortableKeyboardCoordinates
  // porque @dnd-kit/sortable no está instalado; el KeyboardSensor de core es suficiente.
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor),
  );

  // ADR-061: la lógica de decisión está en crearManejadorDragEnd (fábrica testeable sin React).
  // El lookup deriva estadoOrigen y nombre desde el array de tratos actual.
  // Las callbacks conectan la fábrica con las mutations y el estado local.
  const handleDragEnd = useMemo(
    () =>
      crearManejadorDragEnd({
        columnas,
        lookup: (tratoId: string) => {
          const trato = tratos.find((t: Trato) => t.id === tratoId);
          if (!trato) return undefined;
          return { estadoOrigen: trato.estado as EstadoTrato, nombre: trato.nombre };
        },
        onGanar: (tratoId) => ganarMutation.mutate(tratoId),
        onReabrir: (tratoId) =>
          updateMutation.mutate({
            id: tratoId,
            data: { estado: 'abierto', motivo_perdida: null },
          }),
        // ADR-058: drag a 'perdido' establece pendingDrag → abre TratoPerderDialog.
        onPedirMotivoPerder: (tratoId, nombre) => setPendingDrag({ tratoId, nombre }),
      }),
    [tratos, columnas, ganarMutation, updateMutation],
  );

  // Distribución de tarjetas por estado
  function tarjetasPorColumna(estadoColumna: EstadoTrato) {
    return tratos.filter((t: Trato) => t.estado === estadoColumna);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        Cargando tratos...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 p-8 text-destructive">
        <p>No fue posible cargar los tratos.</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd as (event: DragEndEvent) => void}>
        <div className="grid grid-cols-3 gap-4">
          {columnas.map((columna) => (
            <KanbanColumna
              key={columna.id}
              columna={columna}
              tratos={tarjetasPorColumna(columna.id)}
            />
          ))}
        </div>
      </DndContext>

      {/* modal-interrupt (ADR-058): se abre solo cuando hay un pendingDrag */}
      <TratoPerderDialog
        open={!!pendingDrag}
        onOpenChange={(open) => {
          if (!open) setPendingDrag(null);
        }}
        tratoId={pendingDrag?.tratoId ?? ''}
        nombre={pendingDrag?.nombre ?? ''}
      />
    </>
  );
}
