import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Usuario } from '@/api/types';
import { useAuthStore } from '@/store/authStore';
import { useUsuarios } from '../hooks/useUsuarios';
import { useRoles } from '../hooks/useRoles';
import { UsuariosTable } from '../components/UsuariosTable';
import { UsuarioFormDialog } from '../components/UsuarioFormDialog';
import { UsuarioDeleteDialog } from '../components/UsuarioDeleteDialog';

export function UsuariosListPage() {
  const { data: usuarios, isPending, isError, refetch } = useUsuarios();
  const { data: roles = [] } = useRoles();
  const sessionUserId = useAuthStore((s) => s.usuario?.id ?? '');

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Usuario | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Usuario | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona los usuarios y sus permisos en el sistema.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          Nuevo usuario
        </Button>
      </header>

      {/* Loading state */}
      {isPending && (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Cargando usuarios...
        </p>
      )}

      {/* Error state */}
      {isError && (
        <div className="py-12 text-center">
          <p className="mb-4 text-sm text-destructive">
            No fue posible cargar los usuarios.
          </p>
          <Button variant="outline" onClick={() => void refetch()}>
            Reintentar
          </Button>
        </div>
      )}

      {/* Empty state */}
      {!isPending && !isError && usuarios && usuarios.length === 0 && (
        <div className="py-12 text-center">
          <p className="mb-4 text-sm text-muted-foreground">
            Aún no hay usuarios registrados.
          </p>
          <Button onClick={() => setCreateOpen(true)}>
            Crear primer usuario
          </Button>
        </div>
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
          />
        </div>
      )}

      {/* Dialog: Crear usuario */}
      <UsuarioFormDialog
        mode="create"
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      {/* Dialog: Editar usuario */}
      {editTarget && (
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
      <UsuarioDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => {
          if (!v) setDeleteTarget(null);
        }}
        usuario={deleteTarget}
        isOwnAccount={(deleteTarget?.id ?? '') === sessionUserId}
      />
    </div>
  );
}
