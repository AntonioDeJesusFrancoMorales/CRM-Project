// KanbanPage — vista de un tablero Kanban concreto.
// Consume useTablero(id) + useFichas().
// Filtra fichas: solo tipoFicha === 'TRATO' cuyo columnaId esté en el tablero.
// 404 → toast + redirect a /tableros.
// Renderiza KanbanBoard con columnas y fichas del tablero.

import { useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isHttpError } from '@/api/http-error';
import { useTablero } from '../hooks/useTablero';
import { useFichas } from '../hooks/useFichas';
import { KanbanBoard } from '../components/KanbanBoard';

export function KanbanPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: tablero, isLoading, error } = useTablero(id);
  const { data: fichas = [] } = useFichas();

  const is404 = isHttpError(error) && error.status === 404;

  // Redirect en caso de 404
  useEffect(() => {
    if (!is404) return;
    toast.error('El tablero no existe');
    void navigate('/tableros', { replace: true });
  }, [is404, navigate]);

  // Fichas filtradas: solo TRATO y columnaId presente en este tablero
  const columnaIds = new Set(tablero?.columnas.map((c) => c.id) ?? []);
  const fichasFiltradas = fichas.filter(
    (f) => f.tipoFicha === 'TRATO' && columnaIds.has(f.columnaId),
  );

  if (isLoading) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Cargando tablero...
      </p>
    );
  }

  if (is404) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        El tablero no existe. Volviendo al listado...
      </p>
    );
  }

  if (error || !tablero) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-sm text-destructive">No fue posible cargar el tablero.</p>
        <Button variant="outline" onClick={() => void navigate('/tableros')}>
          Volver al listado
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/tableros" aria-label="Volver al listado de tableros">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{tablero.nombre}</h1>
          {tablero.descripcion && (
            <p className="text-sm text-muted-foreground">{tablero.descripcion}</p>
          )}
        </div>
      </header>

      {/* Tablero Kanban */}
      {tablero.columnas.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Este tablero no tiene columnas configuradas.
        </p>
      ) : (
        <KanbanBoard columnas={tablero.columnas} fichas={fichasFiltradas} />
      )}
    </div>
  );
}
