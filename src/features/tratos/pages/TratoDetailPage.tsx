// TratoDetailPage — detalle de un trato con layout tabbed.
// Modelo unificado (Change 3): contactoId único, sin estado, sin ganar/perder/reabrir.
// Tabs: Información (TratoInfoTab) + Tareas (TratoTareasTab).
// useTabSync(['info','tareas'], 'info') sincroniza el tab activo con ?tab= en la URL.
// Badge de pendientes derivado del query de tareas, OCULTO cuando count = 0.
// Header: solo acciones Editar y Eliminar (el ciclo de vida del trato vuelve en Change 4).

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { ArrowLeft, Pencil, Trash2, Trophy, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { isHttpError } from '@/api/http-error';
import { useTabSync } from '@/lib/useTabSync';
import { useTrato } from '../hooks/useTrato';
import { useDeleteTrato } from '../hooks/useDeleteTrato';
import { useGanarTrato, usePerderTrato } from '../hooks/useCambiarEstadoTrato';
import { useContactos } from '@/features/contactos/hooks/useContactos';
import { useUsuarios } from '@/features/usuarios/hooks/useUsuarios';
import { useTareas } from '@/features/tareas/hooks/useTareas';
import { getTareaEstado } from '@/features/tareas/hooks/useTareaEstado';
import { FichaEtiquetasPanel } from '@/features/etiquetas/components/FichaEtiquetasPanel';
import { TratoInfoTab } from '../components/TratoInfoTab';
import { TratoTareasTab } from '../components/TratoTareasTab';
import { TratoEditDialog } from '../components/TratoEditDialog';
import { TratoDeleteDialog } from '../components/TratoDeleteDialog';

const NOT_FOUND_REDIRECT_DELAY = 1500;

export function TratoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: trato, isLoading, error } = useTrato(id);
  const { data: contactos = [] } = useContactos();
  const { data: usuarios = [] } = useUsuarios();

  // Badge de pendientes: estado client-only (localStorage), traemos todas las
  // tareas y filtramos client-side por tratoId + estado 'pendiente'.
  const { data: todasLasTareas = [] } = useTareas();
  const tareasPendientes = todasLasTareas
    .filter((t) => t.tratoId === id)
    .filter((t) => getTareaEstado(t.id) === 'pendiente');

  const deleteMutation = useDeleteTrato();
  const ganarMutation = useGanarTrato();
  const perderMutation = usePerderTrato();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [perderOpen, setPerderOpen] = useState(false);
  const [motivo, setMotivo] = useState('');

  function handlePerder() {
    if (!id || !motivo.trim()) return;
    perderMutation.mutate(
      { id, motivo: motivo.trim() },
      { onSuccess: () => { setPerderOpen(false); setMotivo(''); } },
    );
  }

  // Sincroniza el tab activo con ?tab= en la URL.
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

  if (isLoading) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Cargando trato">
        <div className="flex items-start gap-3">
          <Skeleton className="h-9 w-9 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-5 w-10 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-9 w-48 rounded-md" />
        <Card>
          <CardContent className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-40" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
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
      <Card>
        <CardContent className="space-y-4 py-12 text-center">
          <p className="text-sm text-destructive">No fue posible cargar el trato.</p>
          <Button variant="outline" onClick={() => navigate('/tratos')}>
            Volver al listado
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Resolución client-side de entidades relacionadas (modelo unificado: un solo contacto).
  const contacto = contactos.find((c) => c.id === trato.contactoId);
  const responsable = usuarios.find((u) => u.id === trato.responsableId);

  const pendientesCount = tareasPendientes.length;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Lado izquierdo: volver + título + badge de pendientes */}
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
              {trato.estado === 'GANADO' && (
                <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white">Ganado</Badge>
              )}
              {trato.estado === 'PERDIDO' && (
                <Badge variant="destructive" title={trato.motivoPerdida ?? undefined}>Perdido</Badge>
              )}
              {/* badge OCULTO cuando count = 0 (solo visible si hay >= 1 tarea pendiente) */}
              {pendientesCount > 0 && (
                <Badge data-testid="badge-pendientes">{pendientesCount}</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Lado derecho: cerrar (ganar/perder, si está abierto) + editar y eliminar */}
        <div className="flex flex-wrap gap-2">
          {trato.estado === 'ABIERTO' && (
            <>
              <Button
                variant="outline"
                className="text-emerald-700 hover:text-emerald-700"
                disabled={ganarMutation.isPending}
                onClick={() => id && ganarMutation.mutate(id)}
              >
                <Trophy className="mr-2 h-4 w-4" aria-hidden="true" />
                Ganar
              </Button>
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => setPerderOpen(true)}
              >
                <XCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                Perder
              </Button>
            </>
          )}
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

      {/* Tabs: Información y Tareas. Tab activo sincronizado con ?tab= via useTabSync. */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="tareas">Tareas</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-4 space-y-4">
          <Card>
            <CardContent className="p-6">
              <TratoInfoTab
                trato={trato}
                contactoNombre={contacto?.nombre}
                contactoId={contacto?.id}
                responsableNombre={responsable?.nombre}
              />
            </CardContent>
          </Card>

          {/* Etiquetas — asigna sobre la ficha del trato (catálogo de tipo TRATO). */}
          <FichaEtiquetasPanel tipoFicha="TRATO" entidadId={id} />
        </TabsContent>

        {/* TratoTareasTab se monta solo cuando el tab está activo — lazy load por montaje */}
        <TabsContent value="tareas" className="mt-4">
          <TratoTareasTab tratoId={id} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <TratoEditDialog open={editOpen} onOpenChange={setEditOpen} trato={trato} />

      <TratoDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        nombre={trato.nombre}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteMutation.isPending}
      />

      <Dialog open={perderOpen} onOpenChange={(o) => { setPerderOpen(o); if (!o) setMotivo(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar como perdido</DialogTitle>
            <DialogDescription>¿Por qué se perdió esta oportunidad? Queda registrado.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Motivo de la pérdida..."
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setPerderOpen(false)}>Cancelar</Button>
            <Button
              variant="destructive"
              disabled={!motivo.trim() || perderMutation.isPending}
              onClick={handlePerder}
            >
              Marcar como perdido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
