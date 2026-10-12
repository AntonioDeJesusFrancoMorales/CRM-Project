// EtiquetasListPage — CRUD del catálogo global de etiquetas (estilo Roles).
// Filtro segmentado por tipo (Tratos | Tareas): el back las separa por TipoEtiqueta y
// una ficha solo acepta etiquetas de su mismo tipo. El tipo activo preselecciona el
// tipo al crear. KPIs derivados de la lista. TableSkeleton en loading, EmptyState rico.

import type { LucideIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Plus, Tag, Tags } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RefreshIcon } from '@/components/shared/RefreshButton';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Etiqueta, TipoEtiqueta } from '@/api/types';
import { useEtiquetas } from '../hooks/useEtiquetas';
import { EtiquetasTable } from '../components/EtiquetasTable';
import { EtiquetaFormDialog } from '../components/EtiquetaFormDialog';
import { EtiquetaDeleteDialog } from '../components/EtiquetaDeleteDialog';
import { usePermissions } from '@/features/permissions/context';
import { AccessDeniedView } from '@/features/permissions/components/PermissionState';

const TIPOS: { value: TipoEtiqueta; label: string }[] = [
  { value: 'TRATO', label: 'Tratos' },
  { value: 'TAREA', label: 'Tareas' },
];

interface EtiquetasListPageProps {
  /** Renderiza solo el contenido cuando el encabezado vive en Configuración. */
  embedded?: boolean;
  /** Permite que Configuración controle la apertura del diálogo superior. */
  createOpen?: boolean;
  onCreateOpenChange?: (open: boolean) => void;
}

export function EtiquetasListPage({
  embedded = false,
  createOpen,
  onCreateOpenChange,
}: EtiquetasListPageProps = {}) {
  const [tipo, setTipo] = useState<TipoEtiqueta>('TRATO');
  const { data: etiquetas, isPending, isError, isFetching, refetch } = useEtiquetas(tipo);
  const permissions = usePermissions();
  const canRead = permissions.allows('ETIQUETA', 'LEER');
  const canCreate = permissions.allows('ETIQUETA', 'CREAR');
  const canEdit = permissions.allows('ETIQUETA', 'ACTUALIZAR');
  const canDelete = permissions.allows('ETIQUETA', 'ELIMINAR');

  const [internalCreateOpen, setInternalCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Etiqueta | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Etiqueta | null>(null);
  const isCreateControlled = createOpen !== undefined && onCreateOpenChange !== undefined;
  const effectiveCreateOpen = isCreateControlled ? createOpen : internalCreateOpen;

  const total = useMemo(() => etiquetas?.length ?? 0, [etiquetas]);

  if (!canRead) return <AccessDeniedView resource="ETIQUETA" />;

  function openCreate() {
    if (!canCreate) return;
    setCreateDialogOpen(true);
  }

  function setCreateDialogOpen(open: boolean) {
    if (isCreateControlled) {
      onCreateOpenChange(open);
    } else {
      setInternalCreateOpen(open);
    }
  }

  function openEdit(etiqueta: Etiqueta) {
    if (!canEdit) return;
    setEditTarget(etiqueta);
  }

  function openDelete(etiqueta: Etiqueta) {
    if (!canDelete) return;
    setDeleteTarget(etiqueta);
  }

  return (
    <div className={embedded ? 'space-y-6' : 'flex flex-col gap-6 p-4 sm:p-6'}>
      {!embedded && (
        <header className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Etiquetas</h1>
            <p className="text-sm text-muted-foreground">
              Gestiona las etiquetas que clasifican los tratos y las tareas en los tableros.
            </p>
          </div>
          {canCreate && (
            <Button className="w-full sm:w-auto" onClick={openCreate}>
              <Plus data-icon="inline-start" aria-hidden="true" />
              Nueva etiqueta
            </Button>
          )}
        </header>
      )}

      {/* Filtro segmentado por tipo */}
      <div className="mx-auto w-full max-w-[1400px]">
        <div
          className="inline-flex rounded-md border border-border bg-muted/40 p-1"
          role="tablist"
          aria-label="Filtrar por tipo"
        >
          {TIPOS.map((t) => (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={tipo === t.value}
              onClick={() => setTipo(t.value)}
              className={cn(
                'rounded px-3 py-1.5 text-sm font-medium transition-colors',
                tipo === t.value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {!isError && (
        <div className="mx-auto w-full max-w-[1400px]">
          <EtiquetasKpiCard
            label={`Etiquetas de ${tipo === 'TRATO' ? 'tratos' : 'tareas'}`}
            value={String(total)}
            icon={Tags}
            loading={isPending}
          />
        </div>
      )}

      {isPending && (
        <Card className="mx-auto w-full max-w-[1400px] rounded-lg p-0 shadow-none">
          <TableSkeleton columns={4} rows={5} />
        </Card>
      )}

      {isError && (
        <div className="mx-auto w-full max-w-[1400px] space-y-3 py-16 text-center">
          <p className="text-sm text-destructive">No fue posible cargar las etiquetas.</p>
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

      {!isPending && !isError && etiquetas && etiquetas.length === 0 && (
        <Card className="mx-auto w-full max-w-[1400px] rounded-lg p-0 shadow-none">
          <EmptyState
            icon={Tag}
            title="Aún no hay etiquetas"
            description={`Crea tu primera etiqueta de ${tipo === 'TRATO' ? 'tratos' : 'tareas'} para empezar a clasificar las fichas en los tableros.`}
            action={
              canCreate ? (
                <Button onClick={openCreate}>
                  <Plus data-icon="inline-start" aria-hidden="true" />
                  Nueva etiqueta
                </Button>
              ) : undefined
            }
            className="rounded-none border-0"
          />
        </Card>
      )}

      {!isPending && !isError && etiquetas && etiquetas.length > 0 && (
        <Card className="mx-auto w-full max-w-[1400px] rounded-lg p-0 shadow-none">
          <EtiquetasTable
            etiquetas={etiquetas}
            onEdit={openEdit}
            onDelete={openDelete}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        </Card>
      )}

      {/* Crear — el tipo activo del filtro preselecciona el tipo del form */}
      {canCreate && (
        <EtiquetaFormDialog
          mode="create"
          open={effectiveCreateOpen}
          onOpenChange={setCreateDialogOpen}
          defaultTipo={tipo}
        />
      )}

      {editTarget && canEdit && (
        <EtiquetaFormDialog
          mode="edit"
          open={!!editTarget}
          onOpenChange={(v) => {
            if (!v) setEditTarget(null);
          }}
          etiqueta={editTarget}
        />
      )}

      {canDelete && (
        <EtiquetaDeleteDialog
          open={!!deleteTarget}
          onOpenChange={(v) => {
            if (!v) setDeleteTarget(null);
          }}
          etiqueta={deleteTarget}
        />
      )}
    </div>
  );
}

interface EtiquetasKpiCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  loading: boolean;
}

function EtiquetasKpiCard({ label, value, icon: Icon, loading }: EtiquetasKpiCardProps) {
  return (
    <Card className="rounded-lg shadow-none">
      <div className="flex items-start justify-between gap-3 p-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="mt-1 h-8 w-16" />
          ) : (
            <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
          )}
        </div>
        <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="size-5" aria-hidden="true" />
        </div>
      </div>
    </Card>
  );
}
