// RolesListPage — lista de roles del CRM (CRUD admin-only).
// KPIs derivados de la lista: Total y Activos. Se ocultan en isError para no mostrar ceros engañosos.
// TableSkeleton durante loading. EmptyState rico cuando vacío.
// La búsqueda vive dentro de RolesTable (no en la página).

import { useMemo, useState } from 'react';
import { CheckCircle2, Plus, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import type { Rol } from '@/api/types';
import { useRoles } from '../hooks/useRoles';
import { RolesTable } from '../components/RolesTable';
import { RolFormDialog } from '../components/RolFormDialog';
import { RolDeleteDialog } from '../components/RolDeleteDialog';

/** KPIs simples calculados con la lista plana de roles. */
function computeKpis(roles: Rol[]) {
  const total = roles.length;
  const activos = roles.filter((r) => r.activo === true).length;
  return { total, activos };
}

export function RolesListPage() {
  const { data: roles, isPending, isError, refetch } = useRoles();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Rol | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Rol | null>(null);

  const kpis = useMemo(() => computeKpis(roles ?? []), [roles]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Roles"
        description="Gestiona los roles del CRM y sus descripciones."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Nuevo rol
          </Button>
        }
      />

      {/* Fila de KPIs (oculta en error de carga) */}
      {!isError && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard
            label="Total de roles"
            value={String(kpis.total)}
            icon={ShieldCheck}
            loading={isPending}
          />
          <StatCard
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
        <div className="rounded-md border">
          <TableSkeleton columns={4} rows={5} />
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="py-12 text-center space-y-3">
          <p className="text-sm text-destructive">
            No fue posible cargar los roles.
          </p>
          <Button variant="outline" onClick={() => void refetch()}>
            Reintentar
          </Button>
        </div>
      )}

      {/* Empty state rico: no hay roles registrados */}
      {!isPending && !isError && roles && roles.length === 0 && (
        <EmptyState
          icon={ShieldCheck}
          title="Aún no hay roles"
          description="Creá tu primer rol para empezar a organizar los permisos y responsabilidades del CRM."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              Nuevo rol
            </Button>
          }
        />
      )}

      {/* Tabla */}
      {!isPending && !isError && roles && roles.length > 0 && (
        <div className="rounded-md border">
          <RolesTable
            roles={roles}
            onEdit={(rol) => setEditTarget(rol)}
            onDelete={(rol) => setDeleteTarget(rol)}
          />
        </div>
      )}

      {/* Dialog crear rol */}
      <RolFormDialog mode="create" open={createOpen} onOpenChange={setCreateOpen} />

      {/* Dialog editar rol */}
      {editTarget && (
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
      <RolDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => {
          if (!v) setDeleteTarget(null);
        }}
        rol={deleteTarget}
      />
    </div>
  );
}
