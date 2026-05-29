// KanbanListPage — lista de tableros de tipo TRATOS.
// Filtrado client-side: solo tipoTablero === 'TRATOS'.
// Maneja loading, error (con reintentar), y empty state.
// Cada tablero es un link a /tableros/:id.

import { Link } from 'react-router';
import { KanbanSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTableros } from '../hooks/useTableros';

export function KanbanListPage() {
  const { data: tableros, isLoading, isError, refetch } = useTableros();

  // Filtrar solo tableros TRATOS (el back devuelve todos los tipos)
  const tablerosTratos = tableros?.filter((t) => t.tipoTablero === 'TRATOS') ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Tableros</h1>
        <p className="text-sm text-muted-foreground">
          Gestiona el ciclo de vida de los tratos en el Kanban.
        </p>
      </header>

      {/* Loading */}
      {isLoading && (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Cargando tableros...
        </p>
      )}

      {/* Error */}
      {isError && (
        <div className="py-12 text-center space-y-3">
          <p className="text-sm text-destructive">
            No fue posible cargar los tableros. Intenta de nuevo.
          </p>
          <Button variant="outline" onClick={() => void refetch()}>
            Reintentar
          </Button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && tablerosTratos.length === 0 && (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No hay tableros de tratos todavía.
        </p>
      )}

      {/* Lista de tableros */}
      {!isLoading && !isError && tablerosTratos.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tablerosTratos.map((tablero) => (
            <li key={tablero.id}>
              <Link
                to={`/tableros/${tablero.id}`}
                className="flex items-start gap-3 rounded-lg border bg-card p-4 shadow-sm hover:bg-muted transition-colors"
              >
                <KanbanSquare className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="font-medium leading-tight">{tablero.nombre}</p>
                  {tablero.descripcion && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {tablero.descripcion}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {tablero.columnas.length} columnas
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
