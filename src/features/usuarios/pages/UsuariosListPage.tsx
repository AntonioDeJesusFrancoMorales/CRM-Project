// UsuariosListPage — lista de usuarios con búsqueda/filtro client-side (en la tabla).
// KPIs derivados de la lista: Total, Activos. Se ocultan en isError para no mostrar
// ceros engañosos. TableSkeleton durante loading. EmptyState rico cuando vacío.

import { useMemo, useState } from 'react';
import { Plus, UserCheck, Users, UsersRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { RefreshIcon } from '@/components/shared/RefreshButton';
import { StatCard } from '@/components/shared/StatCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
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
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Usuarios"
        description="Gestiona los usuarios y sus permisos en el sistema."
        actions={canCreate ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              Nuevo usuario
            </Button>
          ) : undefined}
      />

      {/* Fila de KPIs del directorio (oculta en error de carga) */}
      {!isError && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard
            label="Total de usuarios"
            value={String(kpis.total)}
            icon={UsersRound}
            loading={isPending}
          />
          <StatCard
            label="Activos"
            value={String(kpis.activos)}
            hint="Con cuenta activa"
            icon={UserCheck}
            loading={isPending}
          />
        </div>
      )}

      {/* Loading: esqueleto de tabla en vez de texto plano */}
      {isPending && (
        <div className="rounded-md border">
          <TableSkeleton columns={6} rows={5} />
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="py-12 text-center space-y-3">
          <p className="text-sm text-destructive">
            No fue posible cargar los usuarios.
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

      {/* Empty state rico: no hay usuarios registrados */}
      {!isPending && !isError && usuarios && usuarios.length === 0 && (
        <EmptyState
          icon={Users}
          title="Aún no hay usuarios"
          description="Aún no hay usuarios registrados."
           action={canCreate ? (
             <Button onClick={() => setCreateOpen(true)}>
               <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
               Crear primer usuario
             </Button>
           ) : undefined}
        />
      )}

      {/* Tabla con datos */}
      {!isPending && !isError && usuarios && usuarios.length > 0 && (
        <div className="rounded-md border">
          <UsuariosTable
            usuarios={usuarios}
            roles={roles}
            sessionUserId={sessionUserId}
            onEdit={(usuario) => setEditTarget(usuario)}
            onDelete={(usuario) => setDeleteTarget(usuario)}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        </div>
      )}

      {/* Dialog: Crear usuario */}
      {canCreate && (
        <UsuarioFormDialog
          mode="create"
          open={createOpen}
          onOpenChange={setCreateOpen}
        />
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
