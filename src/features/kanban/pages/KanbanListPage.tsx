// KanbanListPage — lista unificada de todos los tableros (TRATOS + TAREAS).
// Batch 7: quita el filtro tipoTablero === 'TRATOS'; muestra todos los tableros.
// Añade badge de tipo (TRATOS / TAREAS) por card.
// Maneja loading, error (con reintentar), y empty state.
// Los tableros base enlazan a su página de entidad; los adicionales enlazan a /tableros/:id.

import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { AlertCircle, Inbox, KanbanSquare, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshButton, RefreshIcon } from '@/components/shared/RefreshButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useTableros } from '../hooks/useTableros';
import { TableroDeleteDialog } from '../components/TableroDeleteDialog';
import { TableroFormDialog } from '../components/TableroFormDialog';
import { canDeleteTablero, getBaseTableroIds } from '../lib/tableroPolicy';
import type { Tablero } from '../schemas/tablero.schema';

function getTableroHref(tablero: Tablero, baseTableroIds: ReadonlySet<string>): string {
  if (!baseTableroIds.has(tablero.id)) return `/tableros/${tablero.id}`;
  return tablero.tipoTablero === 'TRATOS' ? '/tratos' : '/tareas';
}

function TablerosListSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Cargando tableros..."
      className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
    >
      <span className="sr-only">Cargando tableros...</span>
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          aria-hidden="true"
          className="flex min-h-32 flex-col gap-3 rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-sm" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-14 rounded-md" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

function TablerosStatePanel({
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
        className={cn(
          'flex size-10 items-center justify-center rounded-full',
          variant === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground',
        )}
      >
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <p className="text-sm text-muted-foreground">{message}</p>
      {action}
    </div>
  );
}

export function KanbanListPage() {
  const { data: tableros, isLoading, isError, isFetching, refetch } = useTableros();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Tablero | null>(null);
  const [deleting, setDeleting] = useState<Tablero | null>(null);

  // Lista unificada — todos los tableros (TRATOS + TAREAS)
  const todosLosTableros = tableros ?? [];
  const baseTableroIds = useMemo(() => getBaseTableroIds(todosLosTableros), [todosLosTableros]);

  return (
    <div className="flex flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Tableros</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Gestiona el ciclo de vida de los tratos y tareas en el Kanban.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <RefreshButton
            resourceLabel="tableros"
            onRefresh={() => void refetch()}
            isRefreshing={isFetching}
            size="icon-sm"
          />
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus data-icon="inline-start" aria-hidden="true" />
            Nuevo tablero
          </Button>
        </div>
      </header>

      {/* Loading */}
      {isLoading && <TablerosListSkeleton />}

      {/* Error */}
      {isError && (
        <TablerosStatePanel
          variant="error"
          message="No fue posible cargar los tableros. Intenta de nuevo."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
              disabled={isFetching}
              aria-busy={isFetching}
            >
              <RefreshIcon isRefreshing={isFetching} />
              {isFetching ? 'Cargando...' : 'Reintentar'}
            </Button>
          }
        />
      )}

      {/* Empty state */}
      {!isLoading && !isError && todosLosTableros.length === 0 && (
        <TablerosStatePanel variant="empty" message="No hay tableros todavía." />
      )}

      {/* Lista de tableros */}
      {!isLoading && !isError && todosLosTableros.length > 0 && (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {todosLosTableros.map((tablero) => (
            <li key={tablero.id} className="relative">
              <Link
                to={getTableroHref(tablero, baseTableroIds)}
                className="flex h-full flex-col gap-2 rounded-xl border border-border bg-card p-4 pr-12 shadow-xs transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <KanbanSquare className="size-4 shrink-0 text-primary" aria-hidden="true" />
                  <h2 className="truncate text-sm font-semibold text-foreground">{tablero.nombre}</h2>
                  <span className="shrink-0 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-primary">
                    {tablero.tipoTablero}
                  </span>
                </div>
                {tablero.descripcion && (
                  <p className="line-clamp-2 text-sm text-muted-foreground">{tablero.descripcion}</p>
                )}
                <p className="mt-auto text-xs text-muted-foreground">
                  {tablero.columnas.length} columnas
                </p>
              </Link>
              <div className="absolute right-3 top-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="text-muted-foreground"
                      aria-label={`Acciones de ${tablero.nombre}`}
                    >
                      <MoreHorizontal aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuGroup>
                      <DropdownMenuItem onSelect={() => setEditing(tablero)}>
                        <Pencil aria-hidden="true" />
                        Editar tablero
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    {canDeleteTablero(tablero, baseTableroIds) && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onSelect={() => setDeleting(tablero)}
                        >
                          <Trash2 aria-hidden="true" />
                          Eliminar tablero
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </li>
          ))}
        </ul>
      )}

      <TableroFormDialog mode="create" open={createOpen} onOpenChange={setCreateOpen} />

      {editing && (
        <TableroFormDialog
          key={editing.id}
          mode="edit"
          open={true}
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
          tablero={editing}
        />
      )}

      <TableroDeleteDialog
        tablero={deleting}
        deletable={deleting ? canDeleteTablero(deleting, baseTableroIds) : true}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        onSuccess={() => setDeleting(null)}
      />
    </div>
  );
}
