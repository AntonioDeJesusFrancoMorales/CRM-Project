// ADR-050 — TareaEstadoMenu: DropdownMenu con 3 ítems SIEMPRE visibles.
// El `disabled` de cada ítem se computa por `tarea.estado`:
//   - "Iniciar":   disabled si estado !== 'pendiente'
//   - "Completar": disabled si estado === 'completada'
//   - "Reabrir":   disabled si estado !== 'completada'
// Sin modal. Homologa TratoEstadoMenu.

import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Tarea } from '@/api/types';
import { useUpdateTarea } from '../hooks/useUpdateTarea';
import { useCompletarTarea } from '../hooks/useCompletarTarea';

interface TareaEstadoMenuProps {
  tarea: Tarea;
}

export function TareaEstadoMenu({ tarea }: TareaEstadoMenuProps) {
  const update = useUpdateTarea();
  const completar = useCompletarTarea();

  const isMutating = update.isPending || completar.isPending;

  function handleIniciar() {
    update.mutate({ id: tarea.id, data: { estado: 'en_progreso' } });
  }

  function handleCompletar() {
    completar.mutate({ tareaId: tarea.id, tratoId: tarea.trato_id });
  }

  function handleReabrir() {
    update.mutate({
      id: tarea.id,
      data: { estado: 'pendiente', fecha_completada: null },
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Cambiar estado de la tarea"
          disabled={isMutating}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          disabled={tarea.estado !== 'pendiente' || isMutating}
          onClick={handleIniciar}
        >
          Iniciar
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={tarea.estado === 'completada' || isMutating}
          onClick={handleCompletar}
        >
          Completar
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={tarea.estado !== 'completada' || isMutating}
          onClick={handleReabrir}
        >
          Reabrir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
