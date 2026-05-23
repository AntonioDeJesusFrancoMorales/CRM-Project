import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Empresa, Usuario } from '@/api/types';
import { isHttpError } from '@/api/http-error';
import { useCliente } from '../hooks/useCliente';
import { useDeleteCliente } from '../hooks/useDeleteCliente';
import { useEmpresas } from '@/features/empresas/hooks/useEmpresas';
import { useUsuarios } from '@/features/usuarios/hooks/useUsuarios';
import { ClienteOrigenBadge } from '../components/ClienteOrigenBadge';
import { ClienteInfoTab } from '../components/ClienteInfoTab';
import { ClienteTratosTab } from '../components/ClienteTratosTab';
import { ClienteEditDialog } from '../components/ClienteEditDialog';
import { ClienteDeleteDialog } from '../components/ClienteDeleteDialog';

// REQ-05: detalle con tabs Información + Tratos
// REQ-06: badge de origen (prospecto/manual)
// REQ-07: lazy load del tab Tratos por montaje (ADR-036)
// ADR-037: estructura plana del header — ClienteOrigenBadge fuera de buttons
// ADR-039 T_D.4: lógica DELETE (204 navigate + 409 toast) vive aquí, no en el dialog

const NOT_FOUND_REDIRECT_DELAY = 1500;

export function ClienteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: cliente, isLoading, error } = useCliente(id);
  const { data: empresas = [] } = useEmpresas();
  const { data: usuarios = [] } = useUsuarios();

  const deleteMutation = useDeleteCliente();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const is404 = isHttpError(error) && error.status === 404;

  // Redirect automático en 404
  useEffect(() => {
    if (!is404) return;
    toast.message('Este cliente no existe');
    const timeoutId = window.setTimeout(() => {
      navigate('/clientes', { replace: true });
    }, NOT_FOUND_REDIRECT_DELAY);
    return () => window.clearTimeout(timeoutId);
  }, [is404, navigate]);

  // Resolver empresa y responsable para tabs presentacionales
  const empresasById = Object.fromEntries(empresas.map((e: Empresa) => [e.id, e]));
  const usuariosById = Object.fromEntries(usuarios.map((u: Usuario) => [u.id, u]));
  const empresaNombre = cliente ? empresasById[cliente.empresa_id]?.nombre : undefined;
  const responsableNombre = cliente ? usuariosById[cliente.responsable_id]?.nombre : undefined;

  function handleConfirmDelete() {
    if (!id) return;
    deleteMutation.mutate(id, {
      onSuccess: () => {
        // toast.success ya lo muestra el hook useDeleteCliente internamente
        setDeleteOpen(false);
        navigate('/clientes', { replace: true });
      },
      onError: (err) => {
        if (isHttpError(err) && err.status === 409) {
          toast.error(err.message);
        }
        setDeleteOpen(false);
      },
    });
  }

  if (isLoading) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Cargando cliente...
      </p>
    );
  }

  if (is404) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Este cliente no existe. Volviendo al listado...
      </p>
    );
  }

  if (error || !cliente || !id) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-sm text-destructive">
          No fue posible cargar el cliente.
        </p>
        <Button variant="outline" onClick={() => navigate('/clientes')}>
          Volver al listado
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con nombre, empresa, badge de origen y botones de acción */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/clientes')}
            aria-label="Volver al listado"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              {cliente.nombre_contacto}
            </h1>
            {/* Empresa como texto con link (ADR-037: fuera de buttons) */}
            {empresaNombre && (
              <p className="text-sm text-muted-foreground">{empresaNombre}</p>
            )}
            {/* ADR-037: ClienteOrigenBadge NO anidado dentro de <button> */}
            <ClienteOrigenBadge prospectoOrigenId={cliente.prospecto_origen_id} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
            Editar
          </Button>
          <Button
            variant="outline"
            onClick={() => setDeleteOpen(true)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
            Eliminar
          </Button>
        </div>
      </header>

      {/* Tabs: Información y Tratos (ADR-036 — lazy load de Tratos por montaje) */}
      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="tratos">Tratos</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-4">
          <ClienteInfoTab
            cliente={cliente}
            empresaNombre={empresaNombre}
            responsableNombre={responsableNombre}
          />
        </TabsContent>

        {/* ADR-036: ClienteTratosTab se monta solo cuando el tab está activo */}
        <TabsContent value="tratos" className="mt-4">
          <ClienteTratosTab clienteId={id} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {cliente && (
        <ClienteEditDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          cliente={cliente}
        />
      )}

      <ClienteDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        nombreContacto={cliente.nombre_contacto}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}
