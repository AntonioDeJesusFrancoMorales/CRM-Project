// KanbanListPage — lista unificada de todos los tableros (TRATOS + TAREAS).
// Batch 7: quita el filtro tipoTablero === 'TRATOS'; muestra todos los tableros.
// Añade badge de tipo (TRATOS / TAREAS) por card.
// Maneja loading, error (con reintentar), y empty state.
// Los tableros base enlazan a su página de entidad; los adicionales enlazan a /tableros/:id.

import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { KanbanSquare, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RefreshButton, RefreshIcon } from '@/components/shared/RefreshButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTableros } from '../hooks/useTableros';
import { TableroDeleteDialog } from '../components/TableroDeleteDialog';
import { TableroFormDialog } from '../components/TableroFormDialog';
import { canDeleteTablero, getBaseTableroIds } from '../lib/tableroPolicy';
import type { Tablero } from '../schemas/tablero.schema';

function getTableroHref(tablero: Tablero, baseTableroIds: ReadonlySet<string>): string {
  if (!baseTableroIds.has(tablero.id)) return `/tableros/${tablero.id}`;
  return tablero.tipoTablero === 'TRATOS' ? '/tratos' : '/tareas';
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
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tableros</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona el ciclo de vida de los tratos y tareas en el Kanban.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton
            resourceLabel="tableros"
            onRefresh={() => void refetch()}
            isRefreshing={isFetching}
          />
          <Button onClick={() => setCreateOpen(true)}>
            <Plus aria-hidden="true" />
            Nuevo tablero
          </Button>
        </div>
      </header>

      {/* Loading */}
      {isLoading && (
        <p className="py-12 text-center text-sm text-muted-foreground">Cargando tableros...</p>
      )}

      {/* Error */}
      {isError && (
        <div className="py-12 text-center space-y-3">
          <p className="text-sm text-destructive">
            No fue posible cargar los tableros. Intenta de nuevo.
          </p>
          <Button
            variant="outline"
            onClick={() => void refetch()}
            disabled={isFetching}
            aria-busy={isFetching}
          >
            <RefreshIcon isRefreshing={isFetching} />
            {isFetching ? 'Cargando...' : 'Reintentar'}
          </Button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && todosLosTableros.length === 0 && (
        <p className="py-12 text-center text-sm text-muted-foreground">No hay tableros todavía.</p>
      )}

      {/* Lista de tableros */}
      {!isLoading && !isError && todosLosTableros.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {todosLosTableros.map((tablero) => (
            <li key={tablero.id} className="relative">
              <Link
                to={getTableroHref(tablero, baseTableroIds)}
                className="flex items-start gap-3 rounded-lg border bg-card p-4 pr-12 shadow-sm transition-colors hover:bg-muted"
              >
                <KanbanSquare className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium leading-tight">{tablero.nombre}</p>
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      {tablero.tipoTablero}
                    </span>
                  </div>
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="absolute right-2 top-2"
                    aria-label={`Acciones de ${tablero.nombre}`}
                  >
                    <MoreHorizontal aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setEditing(tablero)}>
                    <Pencil aria-hidden="true" />
                    Editar tablero
                  </DropdownMenuItem>
                  {canDeleteTablero(tablero, baseTableroIds) && (
                    <DropdownMenuItem onSelect={() => setDeleting(tablero)}>
                      <Trash2 aria-hidden="true" />
                      Eliminar tablero
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
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
