// TareaEstadoMenu: DropdownMenu con 3 ítems para cambiar estado de tarea.
// Estado es client-only (localStorage). No emite calls al back para estado.
// ADR-050 (actualizado): estado via localStorage, no via campo del back.

import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Tarea } from '@/api/types';

const STORAGE_KEY = (id: string) => `tarea-estado-${id}`;

type EstadoLocal = 'pendiente' | 'en_progreso' | 'completada';

function getEstadoLocal(id: string): EstadoLocal {
  return (localStorage.getItem(STORAGE_KEY(id)) as EstadoLocal | null) ?? 'pendiente';
}

function setEstadoLocal(id: string, estado: EstadoLocal): void {
  localStorage.setItem(STORAGE_KEY(id), estado);
}

interface TareaEstadoMenuProps {
  tarea: Tarea;
}

export function TareaEstadoMenu({ tarea }: TareaEstadoMenuProps) {
  const estado = getEstadoLocal(tarea.id);

  function handleIniciar() {
    setEstadoLocal(tarea.id, 'en_progreso');
    // Forzar re-render no es necesario en este lote; el estado se lee al re-montar
  }

  function handleCompletar() {
    setEstadoLocal(tarea.id, 'completada');
  }

  function handleReabrir() {
    setEstadoLocal(tarea.id, 'pendiente');
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
        <DropdownMenuItem
          disabled={estado !== 'pendiente'}
          onClick={handleIniciar}
        >
          Iniciar
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={estado === 'completada'}
          onClick={handleCompletar}
        >
          Completar
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={estado !== 'completada'}
          onClick={handleReabrir}
        >
          Reabrir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
