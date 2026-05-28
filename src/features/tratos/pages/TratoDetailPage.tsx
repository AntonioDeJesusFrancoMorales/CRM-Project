// ADR-051: TratoDetailPage refactorizado a layout tabbed (homologa ClienteDetailPage).
// Tabs: Información (TratoInfoTab) + Tareas (TratoTareasTab).
// useTabSync(['info','tareas'], 'info') sincroniza el tab activo con ?tab= en la URL.
// ADR-052: badge de pendientes derivado del mismo query del tab, levantado a nivel página.
// badge-zero: badge OCULTO cuando count = 0 (solo visible si hay >= 1 tarea pendiente).
// Las 5 acciones (Ganar/Perder/Reabrir/Editar/Eliminar) permanecen en el header.

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { ArrowLeft, Pencil, Trash2, Check, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { isHttpError } from '@/api/http-error';
import type { Trato } from '@/api/types';
import { useTabSync } from '@/lib/useTabSync';
import { useTrato } from '../hooks/useTrato';
import { useDeleteTrato } from '../hooks/useDeleteTrato';
import { useGanarTrato } from '../hooks/useGanarTrato';
import { useUpdateTrato } from '../hooks/useUpdateTrato';
import { useClientes } from '@/features/clientes/hooks/useClientes';
import { useProspectos } from '@/features/prospectos/hooks/useProspectos';
import { useUsuarios } from '@/features/usuarios/hooks/useUsuarios';
import { useTareas } from '@/features/tareas/hooks/useTareas';
import { getTareaEstado } from '@/features/tareas/hooks/useTareaEstado';
import { TratoEstadoBadge } from '../components/TratoEstadoBadge';
import { TratoInfoTab } from '../components/TratoInfoTab';
import { TratoTareasTab } from '../components/TratoTareasTab';
import { TratoEditDialog } from '../components/TratoEditDialog';
import { TratoDeleteDialog } from '../components/TratoDeleteDialog';
import { TratoPerderDialog } from '../components/TratoPerderDialog';

const NOT_FOUND_REDIRECT_DELAY = 1500;

export function TratoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: trato, isLoading, error } = useTrato(id);
  const { data: clientes = [] } = useClientes();
  const { data: prospectos = [] } = useProspectos();
  const { data: usuarios = [] } = useUsuarios();

  // ADR-052: query de pendientes levantado a nivel página.
  // Estado es client-only (localStorage), así que traemos todas las tareas
  // y filtramos client-side por tratoId + estado 'pendiente'.
  const { data: todasLasTareas = [] } = useTareas();
  const tareasTrato = todasLasTareas.filter((t) => t.tratoId === id);
  const tareasPendientes = tareasTrato
    .filter((t) => getTareaEstado(t.id) === 'pendiente');

  const deleteMutation = useDeleteTrato();
  const ganarMutation = useGanarTrato();
  const updateMutation = useUpdateTrato();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [perderOpen, setPerderOpen] = useState(false);

  // ADR-045: sincroniza el tab activo con ?tab= en la URL.
  const [tab, setTab] = useTabSync(['info', 'tareas'], 'info');

  const is404 = isHttpError(error) && error.status === 404;

  useEffect(() => {
    if (!is404) return;
    toast.message('Este trato no existe');
    const timeoutId = window.setTimeout(() => {
      navigate('/tratos', { replace: true });
    }, NOT_FOUND_REDIRECT_DELAY);
    return () => window.clearTimeout(timeoutId);
  }, [is404, navigate]);

  function handleConfirmDelete() {
    if (!id) return;
    deleteMutation.mutate(id, {
      onSuccess: () => {
        setDeleteOpen(false);
        navigate('/tratos', { replace: true });
      },
      onError: (err) => {
        if (isHttpError(err) && err.status === 409) {
          toast.error(err.message);
        }
        setDeleteOpen(false);
      },
    });
  }

  function handleGanar() {
    if (!id) return;
    ganarMutation.mutate(id);
  }

  function handleReabrir() {
    if (!id) return;
    updateMutation.mutate({
      id,
      data: { estado: 'abierto', motivo_perdida: null },
    });
  }

  if (isLoading) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Cargando trato...
      </p>
    );
  }

  if (is404) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Este trato no existe. Volviendo al listado...
      </p>
    );
  }

  if (error || !trato || !id) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-sm text-destructive">No fue posible cargar el trato.</p>
        <Button variant="outline" onClick={() => navigate('/tratos')}>
          Volver al listado
        </Button>
      </div>
    );
  }

  // Resolver entidades relacionadas
  const responsable = usuarios.find((u) => u.id === trato.responsable_id);
  const cliente = trato.cliente_id ? clientes.find((c) => c.id === trato.cliente_id) : null;
  const prospecto = trato.prospecto_id
    ? prospectos.find((p) => p.id === trato.prospecto_id)
    : null;

  const isPending =
    deleteMutation.isPending || ganarMutation.isPending || updateMutation.isPending;

  // ADR-052 + badge-zero: badge OCULTO cuando count = 0
  const pendientesCount = tareasPendientes.length;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Lado izquierdo: volver + título + badge estado + badge pendientes */}
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/tratos')}
            aria-label="Volver al listado"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">{trato.nombre}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <TratoEstadoBadge estado={trato.estado} />
              {/* badge-zero: solo renderizado si hay >= 1 tarea pendiente */}
              {pendientesCount > 0 && (
                <Badge data-testid="badge-pendientes">
                  {pendientesCount}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Lado derecho: las 5 acciones permanecen en el header (ADR-051) */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={handleGanar}
            disabled={trato.estado === 'ganado' || isPending}
          >
            <Check className="mr-2 h-4 w-4" aria-hidden="true" />
            Marcar como ganado
          </Button>
          <Button
            variant="outline"
            onClick={() => setPerderOpen(true)}
            disabled={trato.estado === 'perdido' || isPending}
          >
            <X className="mr-2 h-4 w-4" aria-hidden="true" />
            Marcar como perdido…
          </Button>
          <Button
            variant="outline"
            onClick={handleReabrir}
            disabled={trato.estado === 'abierto' || isPending}
          >
            <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
            Reabrir
          </Button>
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

      {/* Tabs: Información y Tareas (ADR-051).
          ADR-045: tab activo sincronizado con ?tab= en la URL via useTabSync. */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="tareas">Tareas</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-4">
          <TratoInfoTab
            trato={trato}
            clienteNombre={cliente?.nombre_contacto}
            clienteId={cliente?.id}
            prospectoNombre={prospecto?.nombre_contacto}
            prospectoId={prospecto?.id}
            responsableNombre={responsable?.nombre}
          />
        </TabsContent>

        {/* TratoTareasTab se monta solo cuando el tab está activo — lazy load por montaje */}
        <TabsContent value="tareas" className="mt-4">
          <TratoTareasTab tratoId={id} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <TratoEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        trato={trato as Trato}
      />

      <TratoDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        nombre={trato.nombre}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteMutation.isPending}
      />

      <TratoPerderDialog
        open={perderOpen}
        onOpenChange={setPerderOpen}
        tratoId={trato.id}
        nombre={trato.nombre}
      />
    </div>
  );
}
