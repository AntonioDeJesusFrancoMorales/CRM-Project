// KanbanBoardEmbebido — board autocontenido identificado por tableroId.
// Se embebe en cualquier página sin redirigir en errores (a diferencia de KanbanPage).
// Incluye loading/error propios, dialog "Nueva columna" y reutiliza KanbanBoard.
// Fase 3: reemplaza el viejo "Asignar columna" (Select catálogo) por ColumnaCreateDialog.

import { useState } from 'react';
import { useTablero } from '../hooks/useTablero';
import { useFichas } from '../hooks/useFichas';
import { KanbanBoard } from './KanbanBoard';
import { ColumnaCreateDialog } from './ColumnaCreateDialog';
import type { TipoFicha } from '../schemas/ficha.schema';
import { usePermissions } from '@/features/permissions/context';
import { KANBAN_CREATE_COLUMN_CHECKS } from '../lib/kanbanPermissions';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface KanbanBoardEmbebidoProps {
  tableroId: string;
  allowedEntityIds?: string[];
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function KanbanBoardEmbebido({ tableroId, allowedEntityIds }: KanbanBoardEmbebidoProps) {
  const permissions = usePermissions();
  const canCreateColumn = permissions.allowsAll(KANBAN_CREATE_COLUMN_CHECKS);
  const [nuevaColumnaOpen, setNuevaColumnaOpen] = useState(false);

  const { data: tablero, isLoading, error } = useTablero(tableroId);

  // Derivar tipoFicha desde tipoTablero del tablero
  const tipoTableroActual = tablero?.tipoTablero ?? 'TRATOS';
  const tipoFicha: TipoFicha = tipoTableroActual === 'TAREAS' ? 'TAREA' : 'TRATO';
  const fichaFilters = {
    tipoFicha,
    tratoIds: tipoFicha === 'TRATO' ? allowedEntityIds : undefined,
    tareaIds: tipoFicha === 'TAREA' ? allowedEntityIds : undefined,
  };
  const { data: fichas = [] } = useFichas(fichaFilters);

  // NOTA: ya no se hace backfill de fichas en el front. El back crea la ficha al crear
  // la tarea/trato (CreateTareaService/CreateTratoService). El backfill client-side
  // duplicaba fichas por una race con la invalidación de ['fichas'].

  // Fichas filtradas: por tipoFicha derivado del tipo de tablero + columnaId presente
  const columnaIds = new Set(tablero?.columnas.map((c) => c.id) ?? []);
  const allowedIds = allowedEntityIds ? new Set(allowedEntityIds) : undefined;
  const fichasFiltradas = fichas.filter((f) => {
    if (f.tipoFicha !== tipoFicha || !columnaIds.has(f.columnaId)) return false;
    if (!allowedIds) return true;

    const entityId = tipoFicha === 'TRATO' ? f.tratoId : f.tareaId;
    return entityId !== null && allowedIds.has(entityId);
  });

  // Nombres de columnas existentes para el bloqueo de duplicados
  const nombresExistentes = tablero?.columnas.map((c) => c.nombre ?? '') ?? [];

  // Estado de carga — sin redirect
  if (isLoading) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Cargando tablero...
      </p>
    );
  }

  // Error de red (cualquier error, incluyendo 404) — sin redirect
  if (error || !tablero) {
    return (
      <p className="text-sm text-destructive">
        No fue posible cargar el tablero.
      </p>
    );
  }

  return (
    <div>
      {/* Tablero Kanban o mensaje de sin columnas */}
      {tablero.columnas.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Este tablero no tiene columnas configuradas.
        </p>
      ) : (
        <KanbanBoard
          columnas={tablero.columnas}
          fichas={fichasFiltradas}
          tableroId={tablero.id}
          tipoFicha={tipoFicha}
            onAddColumn={canCreateColumn ? () => setNuevaColumnaOpen(true) : undefined}
        />
      )}

      {/* Dialog Nueva columna */}
      {canCreateColumn && (
        <ColumnaCreateDialog
          open={nuevaColumnaOpen}
          onOpenChange={setNuevaColumnaOpen}
          tableroId={tableroId}
          tipoTablero={tipoTableroActual}
          nombresExistentes={nombresExistentes}
        />
      )}
    </div>
  );
}
