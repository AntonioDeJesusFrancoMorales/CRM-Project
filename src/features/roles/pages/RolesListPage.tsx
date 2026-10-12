// RolesListPage — lista de roles del CRM (CRUD admin-only).
// KPIs derivados de la lista: Total y Activos. Se ocultan en isError para no mostrar ceros engañosos.
// TableSkeleton durante loading. EmptyState rico cuando vacío.
// La búsqueda vive dentro de RolesTable (no en la página).

import type { LucideIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CheckCircle2, Plus, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RefreshIcon } from '@/components/shared/RefreshButton';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import { Skeleton } from '@/components/ui/skeleton';
import type { Rol } from '@/api/types';
import { CambiarPasswordCard } from '@/features/usuarios/components/CambiarPasswordCard';
import { useRoles } from '../hooks/useRoles';
import { RolesTable } from '../components/RolesTable';
import { RolFormDialog } from '../components/RolFormDialog';
import { RolDeleteDialog } from '../components/RolDeleteDialog';
import { usePermissions } from '@/features/permissions/context';
import { AccessDeniedView } from '@/features/permissions/components/PermissionState';

/** KPIs simples calculados con la lista plana de roles. */
function computeKpis(roles: Rol[]) {
  const total = roles.length;
  const activos = roles.filter((r) => r.activo === true).length;
  return { total, activos };
}

interface RolesListPageProps {
  /** Renderiza solo el contenido cuando el encabezado vive en Configuración. */
  embedded?: boolean;
  /** Permite que Configuración controle la apertura del diálogo superior. */
  createOpen?: boolean;
  onCreateOpenChange?: (open: boolean) => void;
}

export function RolesListPage({
  embedded = false,
  createOpen,
  onCreateOpenChange,
}: RolesListPageProps = {}) {
  const { data: roles, isPending, isError, isFetching, refetch } = useRoles();
  const permissions = usePermissions();
  const canRead = permissions.allows('ROL', 'LEER');
  const canAdminister = permissions.allows('ROL', 'ADMINISTRAR');

  const [internalCreateOpen, setInternalCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Rol | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Rol | null>(null);
  const isCreateControlled = createOpen !== undefined && onCreateOpenChange !== undefined;
  const effectiveCreateOpen = isCreateControlled ? createOpen : internalCreateOpen;

  const kpis = useMemo(() => computeKpis(roles ?? []), [roles]);

  if (!canRead) return <AccessDeniedView resource="ROL" />;

  function setCreateDialogOpen(open: boolean) {
    if (isCreateControlled) {
      onCreateOpenChange(open);
    } else {
      setInternalCreateOpen(open);
    }
  }

  function openCreateDialog() {
    if (canAdminister) setCreateDialogOpen(true);
  }

  return (
    <div className={embedded ? 'space-y-6' : 'flex flex-col gap-6 p-4 sm:p-6'}>
      {!embedded && (
        <header className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Roles</h1>
            <p className="text-sm text-muted-foreground">
              Gestiona los roles del CRM y sus descripciones.
            </p>
          </div>
          {canAdminister && (
            <Button className="w-full sm:w-auto" onClick={openCreateDialog}>
              <Plus data-icon="inline-start" aria-hidden="true" />
              Nuevo rol
            </Button>
          )}
        </header>
      )}

      {/* Fila de KPIs (oculta en error de carga) */}
      {!isError && (
        <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 gap-3 sm:grid-cols-2">
          <RolesKpiCard
            label="Total de roles"
            value={String(kpis.total)}
            icon={ShieldCheck}
            loading={isPending}
          />
          <RolesKpiCard
            label="Activos"
            value={String(kpis.activos)}
            hint="Con estado activo"
            icon={CheckCircle2}
            loading={isPending}
          />
        </div>
      )}

      {/* Loading: esqueleto de tabla en vez de texto plano */}
      {isPending && (
        <Card className="mx-auto w-full max-w-[1400px] rounded-lg p-0 shadow-none">
          <TableSkeleton columns={4} rows={5} />
        </Card>
      )}

      {/* Error */}
      {isError && (
        <div className="mx-auto w-full max-w-[1400px] space-y-3 py-16 text-center">
          <p className="text-sm text-destructive">
            No fue posible cargar los roles.
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

      {/* Empty state rico: no hay roles registrados */}
      {!isPending && !isError && roles && roles.length === 0 && (
        <Card className="mx-auto w-full max-w-[1400px] rounded-lg p-0 shadow-none">
          <EmptyState
            icon={ShieldCheck}
            title="Aún no hay roles"
            description="Crea tu primer rol para empezar a organizar los permisos y responsabilidades del CRM."
            action={
              canAdminister ? (
                <Button onClick={openCreateDialog}>
                  <Plus data-icon="inline-start" aria-hidden="true" />
                  Nuevo rol
                </Button>
              ) : undefined
            }
            className="rounded-none border-0"
          />
        </Card>
      )}

      {/* Tabla */}
      {!isPending && !isError && roles && roles.length > 0 && (
        <Card className="mx-auto w-full max-w-[1400px] rounded-lg p-0 shadow-none">
          <RolesTable
            roles={roles}
            onEdit={(rol) => setEditTarget(rol)}
            onDelete={(rol) => setDeleteTarget(rol)}
            canEdit={canAdminister}
            canDelete={canAdminister}
          />
        </Card>
      )}

      {/* Sección de seguridad de la cuenta — cambio de contraseña (flujo Keycloak) */}
      <div className="mx-auto w-full max-w-[1400px]">
        <CambiarPasswordCard />
      </div>

      {/* Dialog crear rol */}
      {canAdminister && (
        <RolFormDialog
          mode="create"
          open={effectiveCreateOpen}
          onOpenChange={setCreateDialogOpen}
        />
      )}

      {/* Dialog editar rol */}
      {editTarget && canAdminister && (
        <RolFormDialog
          mode="edit"
          open={!!editTarget}
          onOpenChange={(v) => {
            if (!v) setEditTarget(null);
          }}
          rol={editTarget}
        />
      )}

      {/* Dialog eliminar rol */}
      {canAdminister && (
        <RolDeleteDialog
          open={!!deleteTarget}
          onOpenChange={(v) => {
            if (!v) setDeleteTarget(null);
          }}
          rol={deleteTarget}
        />
      )}
    </div>
  );
}

interface RolesKpiCardProps {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  loading: boolean;
}

function RolesKpiCard({ label, value, hint, icon: Icon, loading }: RolesKpiCardProps) {
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
          {hint && !loading && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="size-5" aria-hidden="true" />
        </div>
      </div>
    </Card>
  );
}
