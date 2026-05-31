// KanbanTabContent — lógica híbrida de selección de tablero por tipo.
// Filtra useTableros client-side por tipoTablero === tipo.
// 0 tableros → EmptyState inline con CTA a /tableros.
// 1 tablero → KanbanBoardEmbebido directo.
// >1 tableros → lista de Links a /tableros/:id.

import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { useTableros } from '../hooks/useTableros';
import { KanbanBoardEmbebido } from './KanbanBoardEmbebido';
import type { TipoTablero } from '../schemas/tablero.schema';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface KanbanTabContentProps {
  tipo: TipoTablero;
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function KanbanTabContent({ tipo }: KanbanTabContentProps) {
  const { data: tableros = [], isLoading } = useTableros();

  if (isLoading) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Cargando tableros...
      </p>
    );
  }

  // Filtrar client-side por tipo
  const tablerosFiltrados = tableros.filter((t) => t.tipoTablero === tipo);

  // Rama 0: sin tableros del tipo → EmptyState con CTA
  if (tablerosFiltrados.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <p className="text-sm text-muted-foreground">
          No hay tableros de este tipo
        </p>
        <Button asChild variant="outline">
          <Link to="/tableros">Ir a tableros</Link>
        </Button>
      </div>
    );
  }

  // Rama 1: exactamente un tablero → KanbanBoardEmbebido directo
  if (tablerosFiltrados.length === 1) {
    return <KanbanBoardEmbebido tableroId={tablerosFiltrados[0]!.id} />;
  }

  // Rama >1: lista de selección con Links a /tableros/:id
  return (
    <div className="space-y-2 py-4">
      <p className="text-sm text-muted-foreground">
        Hay varios tableros de este tipo. Selecciona uno para verlo:
      </p>
      <ul className="space-y-1">
        {tablerosFiltrados.map((t) => (
          <li key={t.id}>
            <Link
              to={`/tableros/${t.id}`}
              className="text-sm font-medium underline-offset-4 hover:underline"
            >
              {t.nombre}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
