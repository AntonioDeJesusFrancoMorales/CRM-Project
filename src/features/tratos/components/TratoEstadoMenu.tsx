// ADR-044 / D1: DropdownMenu con 3 ítems SIEMPRE visibles.
// El `disabled` de cada ítem se computa por `trato.estado`:
//   - "Marcar ganado":   disabled si estado === 'ganado'
//   - "Marcar perdido…": disabled si estado === 'perdido'
//   - "Reabrir":         disabled si estado === 'abierto'
// La acción "Marcar perdido…" NO invoca el endpoint — dispara `onPerder()`
// (el host monta TratoPerderDialog con el modal obligatorio motivo_perdida).

import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Trato } from '@/api/types';
import { useGanarTrato } from '../hooks/useGanarTrato';
import { useUpdateTrato } from '../hooks/useUpdateTrato';

interface TratoEstadoMenuProps {
  trato: Trato;
  onPerder: () => void;
}

export function TratoEstadoMenu({ trato, onPerder }: TratoEstadoMenuProps) {
  const ganar = useGanarTrato();
  const update = useUpdateTrato();

  const isMutating = ganar.isPending || update.isPending;

  function handleGanar() {
    ganar.mutate(trato.id);
  }

  function handleReabrir() {
    update.mutate({
      id: trato.id,
      data: { estado: 'abierto', motivo_perdida: null },
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Cambiar estado del trato"
          disabled={isMutating}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          disabled={trato.estado === 'ganado' || isMutating}
          onClick={handleGanar}
        >
          Marcar como ganado
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={trato.estado === 'perdido' || isMutating}
          onClick={onPerder}
        >
          Marcar como perdido…
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={trato.estado === 'abierto' || isMutating}
          onClick={handleReabrir}
        >
          Reabrir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
