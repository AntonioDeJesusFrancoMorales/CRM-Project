// TareaEstadoMenu: DropdownMenu (3 puntos) con ítems para cambiar el estado de una tarea.
// Estado es client-only (localStorage, ADR-050). No emite calls al back para estado.
//
// Usa el hook reactivo useTareaEstado: al cambiar el estado, persiste en localStorage y
// notifica a todas las instancias suscritas (badge en tabla, badge en detalle, este menú),
// que re-renderizan. La visualización del estado vive en TareaEstadoBadge, no acá.

import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Tarea } from '@/api/types';
import { useTareaEstado } from '../hooks/useTareaEstado';

interface TareaEstadoMenuProps {
  tarea: Tarea;
}

export function TareaEstadoMenu({ tarea }: TareaEstadoMenuProps) {
  const [estado, setEstado] = useTareaEstado(tarea.id);

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
          onClick={() => setEstado('en_progreso')}
        >
          Iniciar
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={estado === 'completada'}
          onClick={() => setEstado('completada')}
        >
          Completar
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={estado !== 'completada'}
          onClick={() => setEstado('pendiente')}
        >
          Reabrir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
