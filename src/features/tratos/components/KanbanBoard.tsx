// KanbanBoard — tablero kanban con DnD de tratos (ADR-058, ADR-060, ADR-061).
// DndContext con PointerSensor (activation distance 8px: click ≠ drag) + KeyboardSensor (a11y).
// Sin optimistic update: la tarjeta se mueve solo cuando el servidor responde onSuccess.
// modal-interrupt: drag a 'perdido' abre TratoPerderDialog con pendingDrag state.
//
// Test seam: onHandleDragEndReady recibe handleDragEnd para tests que invocan
// el handler directamente con DragEndEvent sintético (jsdom no soporta gestos pointer).

import { useState, useCallback, useEffect } from 'react';
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
import { resolverDragEnd } from '../hooks/resolverDragEnd';
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
  /**
   * Test seam: el componente llama a esta función con el handleDragEnd
   * una vez que la data y los sensores están listos. Esto permite a los tests
   * de integración invocar el handler directamente con un DragEndEvent sintético
   * sin necesidad de simular gestos pointer (que jsdom no soporta).
   */
  onHandleDragEndReady?: (fn: (event: DragEndEvent) => void) => void;
}

export function KanbanBoard({ filters, onHandleDragEndReady }: KanbanBoardProps) {
  const columnas = useColumnasKanban();
  const { data: tratos = [], isLoading, isError, refetch } = useTratos(filters);
  const ganarMutation = useGanarTrato();
  const updateMutation = useUpdateTrato();

  const [pendingDrag, setPendingDrag] = useState<PendingDrag | null>(null);

  // Sensores: PointerSensor con constraint de distancia para que click ≠ drag (ADR-058).
  // KeyboardSensor para accesibilidad (a11y). No se usa sortableKeyboardCoordinates
  // porque @dnd-kit/sortable no está instalado; el KeyboardSensor de core es suficiente.
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const activeId = String(event.active.id);
      const overId = event.over ? (String(event.over.id) as EstadoTrato) : null;

      // Derivar estadoOrigen del trato arrastrado
      const trato = tratos.find((t: Trato) => t.id === activeId);
      if (!trato) return;

      const estadoOrigen = trato.estado as EstadoTrato;
      const accion = resolverDragEnd(activeId, estadoOrigen, overId, columnas, trato.nombre);

      switch (accion.accion) {
        case 'ignorar':
          return;

        case 'ganar':
          ganarMutation.mutate(accion.tratoId);
          return;

        case 'reabrir':
          updateMutation.mutate({
            id: accion.tratoId,
            data: { estado: 'abierto', motivo_perdida: null },
          });
          return;

        case 'abrir-modal-perder':
          setPendingDrag({ tratoId: accion.tratoId, nombre: accion.nombre });
          return;
      }
    },
    [tratos, columnas, ganarMutation, updateMutation],
  );

  // Test seam: notificar al test cuando handleDragEnd está listo
  useEffect(() => {
    onHandleDragEndReady?.(handleDragEnd);
  }, [handleDragEnd, onHandleDragEndReady]);

  // Distribución de tarjetas por estado
  const tarjetasPorColumna = useCallback(
    (estadoColumna: EstadoTrato) => tratos.filter((t: Trato) => t.estado === estadoColumna),
    [tratos],
  );

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
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
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

      {/* modal-interrupt: se abre solo cuando hay un pendingDrag */}
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
