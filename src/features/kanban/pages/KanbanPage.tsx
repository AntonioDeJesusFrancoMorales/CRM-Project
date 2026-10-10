// KanbanPage — vista de un tablero Kanban concreto.
// Consume useTablero(id) + useFichas().
// Detecta tipoTablero del tablero: filtra fichas por tipoFicha correspondiente.
// totalValorEstimado=0 fijo (oculto): es un valor derivado en runtime.
// 404 → toast + redirect a /tableros.
// Renderiza KanbanBoard con columnas y fichas del tablero + tipoFicha.
// Botón "Nueva columna" abre ColumnaCreateDialog (Fase 3).

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router';
import { toast } from 'sonner';
import { AlertCircle, ArrowLeft, Inbox, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { isHttpError } from '@/api/http-error';
import { useTablero } from '../hooks/useTablero';
import { useFichas } from '../hooks/useFichas';
import { KanbanBoard } from '../components/KanbanBoard';
import { ColumnaCreateDialog } from '../components/ColumnaCreateDialog';
import type { Tablero } from '../schemas/tablero.schema';
import type { TipoFicha } from '../schemas/ficha.schema';
import { usePermissions } from '@/features/permissions/context';
import { KANBAN_CREATE_COLUMN_CHECKS } from '../lib/kanbanPermissions';

function KanbanDetailStatePanel({
  variant,
  message,
  action,
}: {
  variant: 'error' | 'empty';
  message: string;
  action?: ReactNode;
}) {
  const Icon = variant === 'error' ? AlertCircle : Inbox;

  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      aria-label={message}
      className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border px-6 py-16 text-center"
    >
      <span
        className={
          variant === 'error'
            ? 'flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive'
            : 'flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground'
        }
      >
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <p className="text-sm text-muted-foreground">{message}</p>
      {action}
    </div>
  );
}

function KanbanDetailSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Cargando tablero..."
      className="flex h-[calc(100svh-15rem)] min-h-96 gap-3 overflow-hidden"
    >
      <span className="sr-only">Cargando tablero...</span>
      {[0, 1, 2, 3].map((index) => (
        <div
          key={index}
          aria-hidden="true"
          className="flex h-full w-72 shrink-0 flex-col gap-2 rounded-lg border border-border bg-muted/40 p-3"
        >
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ))}
    </div>
  );
}

function KanbanDetailShell({
  tablero,
  onNewColumn,
  children,
}: {
  tablero?: Tablero;
  onNewColumn?: () => void;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100svh-3.5rem)] flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            className="mt-0.5 shrink-0"
            asChild
            aria-label="Volver al listado de tableros"
          >
            <Link to="/tableros">
              <ArrowLeft aria-hidden="true" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight text-foreground">
              {tablero?.nombre ?? 'Tablero'}
            </h1>
            {tablero?.descripcion && (
              <p className="mt-0.5 text-sm text-muted-foreground">{tablero.descripcion}</p>
            )}
          </div>
        </div>

        {tablero && onNewColumn && (
          <Button size="sm" onClick={onNewColumn}>
            <Plus data-icon="inline-start" aria-hidden="true" />
            Nueva columna
          </Button>
        )}
      </header>
      {children}
    </div>
  );
}

export function KanbanPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [nuevaColumnaOpen, setNuevaColumnaOpen] = useState(false);
  const permissions = usePermissions();
  const canCreateColumn = permissions.allowsAll(KANBAN_CREATE_COLUMN_CHECKS);

  const { data: tablero, isLoading, error } = useTablero(id);
  const { data: fichas = [] } = useFichas();

  // Derivar tipoFicha desde tipoTablero del tablero
  const tipoTableroActual = tablero?.tipoTablero ?? 'TRATOS';
  const tipoFicha: TipoFicha = tipoTableroActual === 'TAREAS' ? 'TAREA' : 'TRATO';

  const is404 = isHttpError(error) && error.status === 404;

  // Redirect en caso de 404
  useEffect(() => {
    if (!is404) return;
    toast.error('El tablero no existe');
    void navigate('/tableros', { replace: true });
  }, [is404, navigate]);

  // Fichas filtradas: por tipoFicha derivado del tipo de tablero + columnaId presente
  const columnaIds = new Set(tablero?.columnas.map((c) => c.id) ?? []);
  const fichasFiltradas = fichas.filter(
    (f) => f.tipoFicha === tipoFicha && columnaIds.has(f.columnaId),
  );

  // Nombres de columnas existentes para el bloqueo de duplicados
  const nombresExistentes = tablero?.columnas.map((c) => c.nombre ?? '') ?? [];

  if (isLoading) {
    return (
      <KanbanDetailShell>
        <KanbanDetailSkeleton />
      </KanbanDetailShell>
    );
  }

  if (is404) {
    return (
      <KanbanDetailShell>
        <KanbanDetailStatePanel
          variant="error"
          message="El tablero no existe. Volviendo al listado..."
        />
      </KanbanDetailShell>
    );
  }

  if (error || !tablero) {
    return (
      <KanbanDetailShell>
        <KanbanDetailStatePanel
          variant="error"
          message="No fue posible cargar el tablero."
          action={
            <Button variant="outline" size="sm" onClick={() => void navigate('/tableros')}>
              <ArrowLeft data-icon="inline-start" aria-hidden="true" />
              Volver al listado
            </Button>
          }
        />
      </KanbanDetailShell>
    );
  }

  return (
    <KanbanDetailShell tablero={tablero} onNewColumn={canCreateColumn ? () => setNuevaColumnaOpen(true) : undefined}>
      {/* Tablero Kanban */}
      {tablero.columnas.length === 0 ? (
        <KanbanDetailStatePanel
          variant="empty"
          message="Este tablero no tiene columnas configuradas."
        />
      ) : (
        <div className="min-h-0 flex-1">
          <KanbanBoard
            className="h-[calc(100svh-15rem)] min-h-96"
            columnas={tablero.columnas}
            fichas={fichasFiltradas}
            tableroId={tablero.id}
            tipoFicha={tipoFicha}
          />
        </div>
      )}

      {/* Dialog Nueva columna */}
      {canCreateColumn && (
        <ColumnaCreateDialog
          open={nuevaColumnaOpen}
          onOpenChange={setNuevaColumnaOpen}
          tableroId={tablero.id}
          tipoTablero={tipoTableroActual}
          nombresExistentes={nombresExistentes}
        />
      )}
    </KanbanDetailShell>
  );
}
