// UsuariosListPage — lista de usuarios con búsqueda/filtro client-side (en la tabla).
// KPIs derivados de la lista: Total, Activos. Se ocultan en isError para no mostrar
// ceros engañosos. TableSkeleton durante loading. EmptyState rico cuando vacío.

import type { LucideIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Plus, UserCheck, Users, UsersRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RefreshIcon } from '@/components/shared/RefreshButton';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import { Skeleton } from '@/components/ui/skeleton';
import type { Usuario } from '@/api/types';
import { useAuthStore } from '@/store/authStore';
import { useUsuarios } from '../hooks/useUsuarios';
import { useRoles } from '@/features/roles/hooks/useRoles';
import { UsuariosTable } from '../components/UsuariosTable';
import { UsuarioFormDialog } from '../components/UsuarioFormDialog';
import { UsuarioDeleteDialog } from '../components/UsuarioDeleteDialog';
import { usePermissions } from '@/features/permissions/context';
import { AccessDeniedView } from '@/features/permissions/components/PermissionState';

/** KPIs del directorio calculados sólo con la lista plana de usuarios. */
function computeKpis(usuarios: Usuario[]) {
  const total = usuarios.length;
  const activos = usuarios.filter((u) => u.activo === true).length;
  return { total, activos };
}

export function UsuariosListPage() {
  const { data: usuarios, isPending, isError, isFetching, refetch } = useUsuarios();
  const { data: roles = [] } = useRoles();
  const permissions = usePermissions();
  const canRead = permissions.allows('USUARIO', 'LEER');
  const canCreate = permissions.allows('USUARIO', 'CREAR');
  const canEdit = permissions.allows('USUARIO', 'ACTUALIZAR');
  const canDelete = permissions.allows('USUARIO', 'ADMINISTRAR');
  const sessionUserId = useAuthStore((s) => s.usuario?.usuario_id ?? '');

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Usuario | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Usuario | null>(null);

  const kpis = useMemo(() => computeKpis(usuarios ?? []), [usuarios]);

  if (!canRead) return <AccessDeniedView resource="USUARIO" />;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <header className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona los usuarios y sus permisos en el sistema.
          </p>
        </div>
        {canCreate && (
          <Button className="w-full sm:w-auto" onClick={() => setCreateOpen(true)}>
            <Plus data-icon="inline-start" aria-hidden="true" />
            Nuevo usuario
          </Button>
        )}
      </header>

      {!isError && (
        <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 gap-3 sm:grid-cols-2">
          <UsuariosKpiCard
            label="Total de usuarios"
            value={String(kpis.total)}
            icon={UsersRound}
            loading={isPending}
          />
          <UsuariosKpiCard
            label="Activos"
            value={String(kpis.activos)}
            hint="Con cuenta activa"
            icon={UserCheck}
            loading={isPending}
          />
        </div>
      )}

      {isPending && (
        <Card className="mx-auto w-full max-w-[1400px] rounded-lg p-0 shadow-none">
          <TableSkeleton columns={6} rows={5} />
        </Card>
      )}

      {isError && (
        <div className="mx-auto w-full max-w-[1400px] space-y-3 py-16 text-center">
          <p className="text-sm text-destructive">No fue posible cargar los usuarios.</p>
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

      {!isPending && !isError && usuarios && usuarios.length === 0 && (
        <Card className="mx-auto w-full max-w-[1400px] rounded-lg p-0 shadow-none">
          <EmptyState
            icon={Users}
            title="Aún no hay usuarios"
            description="Aún no hay usuarios registrados."
            action={
              canCreate ? (
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus data-icon="inline-start" aria-hidden="true" />
                  Crear primer usuario
                </Button>
              ) : undefined
            }
            className="rounded-none border-0"
          />
        </Card>
      )}

      {!isPending && !isError && usuarios && usuarios.length > 0 && (
        <Card className="mx-auto w-full max-w-[1400px] rounded-lg p-0 shadow-none">
          <UsuariosTable
            usuarios={usuarios}
            roles={roles}
            sessionUserId={sessionUserId}
            onEdit={(usuario) => setEditTarget(usuario)}
            onDelete={(usuario) => setDeleteTarget(usuario)}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        </Card>
      )}

      {/* Dialog: Crear usuario */}
      {canCreate && (
        <UsuarioFormDialog mode="create" open={createOpen} onOpenChange={setCreateOpen} />
      )}

      {/* Dialog: Editar usuario */}
      {editTarget && canEdit && (
        <UsuarioFormDialog
          mode="edit"
          open={!!editTarget}
          onOpenChange={(v) => {
            if (!v) setEditTarget(null);
          }}
          usuario={editTarget}
        />
      )}

      {/* Dialog: Eliminar usuario */}
      {canDelete && (
        <UsuarioDeleteDialog
          open={!!deleteTarget}
          onOpenChange={(v) => {
            if (!v) setDeleteTarget(null);
          }}
          usuario={deleteTarget}
          isOwnAccount={(deleteTarget?.id ?? '') === sessionUserId}
        />
      )}
    </div>
  );
}

interface UsuariosKpiCardProps {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  loading: boolean;
}

function UsuariosKpiCard({ label, value, hint, icon: Icon, loading }: UsuariosKpiCardProps) {
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
