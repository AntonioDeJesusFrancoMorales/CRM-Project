import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Rol } from '@/api/types';
import { useRoles } from '../hooks/useRoles';
import { RolesTable } from '../components/RolesTable';
import { RolFormDialog } from '../components/RolFormDialog';
import { RolDeleteDialog } from '../components/RolDeleteDialog';

export function RolesListPage() {
  const { data: roles, isPending, isError, refetch } = useRoles();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Rol | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Rol | null>(null);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Roles</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona los roles del CRM y sus descripciones.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          Nuevo rol
        </Button>
      </header>

      {isPending && (
        <p className="py-12 text-center text-sm text-muted-foreground">Cargando roles...</p>
      )}

      {isError && (
        <div className="py-12 text-center">
          <p className="mb-4 text-sm text-destructive">No fue posible cargar los roles.</p>
          <Button variant="outline" onClick={() => void refetch()}>
            Reintentar
          </Button>
        </div>
      )}

      {!isPending && !isError && roles && roles.length === 0 && (
        <div className="py-12 text-center">
          <p className="mb-4 text-sm text-muted-foreground">Aún no hay roles registrados.</p>
          <Button onClick={() => setCreateOpen(true)}>Crear primer rol</Button>
        </div>
      )}

      {!isPending && !isError && roles && roles.length > 0 && (
        <div className="rounded-md border">
          <RolesTable
            roles={roles}
            onEdit={(rol) => setEditTarget(rol)}
            onDelete={(rol) => setDeleteTarget(rol)}
          />
        </div>
      )}

      <RolFormDialog mode="create" open={createOpen} onOpenChange={setCreateOpen} />

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
