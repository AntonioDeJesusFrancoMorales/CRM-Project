import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSynchronousMutationLock } from '@/components/shared/useSynchronousMutationLock';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Tarea } from '@/api/types';
import type { ColumnaTablero } from '@/features/kanban/schemas/tablero.schema';
import { useMoverFicha } from '@/features/kanban/hooks/useMoverFicha';
import { usePermissions } from '@/features/permissions/context';
import { KANBAN_MOVE_FICHA_CHECKS } from '@/features/kanban/lib/kanbanPermissions';
import type { TareaWorkflowState } from '../lib/tareaWorkflow';

interface TareaEstadoMenuProps {
  tarea: Tarea;
  workflowState?: TareaWorkflowState;
  workflowColumns?: ColumnaTablero[];
}

export function TareaEstadoMenu({
  workflowState,
  workflowColumns = [],
}: TareaEstadoMenuProps) {
  const moverFicha = useMoverFicha();
  const permissions = usePermissions();
  const { acquire, release, isLocked } = useSynchronousMutationLock();
  const canMove =
    permissions.allowsAll(KANBAN_MOVE_FICHA_CHECKS) &&
    workflowState?.fichaId !== null &&
    workflowState?.fichaId !== undefined;

  function moveTo(columnaId: string) {
    if (!workflowState?.fichaId || !acquire()) return;
    moverFicha.mutate(
      { id: workflowState.fichaId, targetColumnaId: columnaId },
      { onSettled: () => release() },
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Cambiar estado de la tarea"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {workflowColumns.length === 0 && (
          <DropdownMenuItem disabled>Sin columnas disponibles</DropdownMenuItem>
        )}
        {workflowColumns.map((columna) => (
          <DropdownMenuItem
            key={columna.id}
            disabled={!canMove || workflowState?.columnaId === columna.id || moverFicha.isPending || isLocked}
            onClick={() => moveTo(columna.id)}
          >
            Mover a {columna.nombre ?? 'Sin nombre'}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
