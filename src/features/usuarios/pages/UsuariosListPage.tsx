import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type { Usuario } from '@/api/types';
import { apiClient } from '@/api/client';
import { isHttpError } from '@/api/http-error';
import { useAuthStore } from '@/store/authStore';
import { useUsuarios } from '../hooks/useUsuarios';
import { useDesactivarUsuario } from '../hooks/useDesactivarUsuario';
import { usuariosKeys } from '../hooks/useUsuarios';
import { UsuariosTable } from '../components/UsuariosTable';
import { UsuarioFormDialog } from '../components/UsuarioFormDialog';
import { UsuarioDeleteDialog } from '../components/UsuarioDeleteDialog';

export function UsuariosListPage() {
  const { data: usuarios, isPending, isError, refetch } = useUsuarios();
  const sessionUserId = useAuthStore((s) => s.usuario?.id ?? '');

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Usuario | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Usuario | null>(null);

  const queryClient = useQueryClient();
  const desactivarMutation = useDesactivarUsuario();

  /**
   * Reactivación imperativa vía PATCH /usuarios/:id con { activo: true }.
   * No existe endpoint dedicado (asimetría intencional, ADR-018).
   * Se usa useMutation aquí para acceder al queryClient y manejar toasts.
   */
  const reactivarMutation = useMutation<Usuario, Error, string>({
    mutationFn: (id) =>
      apiClient.patch<Usuario>(`/usuarios/${id}`, { activo: true }),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: usuariosKeys.list() });
      toast.success(`Usuario "${updated.nombre}" reactivado`);
    },
    onError: (error) => {
      if (isHttpError(error)) {
        toast.error(error.message);
      } else {
        toast.error('No fue posible reactivar el usuario');
      }
    },
  });

  function handleDesactivar(usuario: Usuario) {
    desactivarMutation.mutate(usuario.id);
  }

  function handleReactivar(usuario: Usuario) {
    reactivarMutation.mutate(usuario.id);
  }

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
            sessionUserId={sessionUserId}
            onEdit={(usuario) => setEditTarget(usuario)}
            onDelete={(usuario) => setDeleteTarget(usuario)}
            onDesactivar={handleDesactivar}
            onReactivar={handleReactivar}
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
          isOwnAccount={editTarget.id === sessionUserId}
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
