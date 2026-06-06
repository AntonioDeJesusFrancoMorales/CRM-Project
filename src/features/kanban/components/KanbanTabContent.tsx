// KanbanTabContent — muestra el tablero principal de un tipo.
// Filtra useTableros client-side por tipoTablero === tipo y elige SIEMPRE el primero
// por fecha de creación (getTableroPrincipal). Si hay más tableros del tipo, se ignoran.
// 0 tableros → EmptyState inline con CTA a /tableros.

import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { useTableros } from '../hooks/useTableros';
import { getTableroPrincipal } from '../lib/getTableroPrincipal';
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

  // Tablero principal del tipo: el primero por creación. Los demás se ignoran.
  const tableroPrincipal = getTableroPrincipal(tableros, tipo);

  // Sin tableros del tipo → EmptyState con CTA
  if (!tableroPrincipal) {
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

  return <KanbanBoardEmbebido tableroId={tableroPrincipal.id} />;
}
