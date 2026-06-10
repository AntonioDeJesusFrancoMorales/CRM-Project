// TareaDetailPage — homologa TratoDetailPage (plano, sin tabs).
// Muestra datos de la tarea, permite editar (TareaEditDialog),
// cambiar estado (TareaEstadoMenu) y eliminar (TareaDeleteDialog + redirect).
// 404 → toast + redirect a /tareas.

import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { isHttpError } from '@/api/http-error';
import { formatDate } from '@/lib/format';
import { useTarea } from '../hooks/useTarea';
import { useDeleteTarea } from '../hooks/useDeleteTarea';
import { prioridadBadgeClass, prioridadLabels, tipoLabels } from '../lib/tareaBadges';
import { useTrato } from '@/features/tratos/hooks/useTrato';
import { useUsuarios } from '@/features/usuarios/hooks/useUsuarios';
import { TareaEditDialog } from '../components/TareaEditDialog';
import { TareaDeleteDialog } from '../components/TareaDeleteDialog';
import { TareaEstadoMenu } from '../components/TareaEstadoMenu';
import { TareaEstadoBadge } from '../components/TareaEstadoBadge';
import { FichaEtiquetasPanel } from '@/features/etiquetas/components/FichaEtiquetasPanel';

const NOT_FOUND_REDIRECT_DELAY = 1500;

interface FieldProps {
  label: string;
  children: React.ReactNode;
}

function Field({ label, children }: FieldProps) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="text-sm">{children}</div>
    </div>
  );
}

export function TareaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: tarea, isLoading, error } = useTarea(id);
  const { data: trato } = useTrato(tarea?.tratoId);
  const { data: usuarios = [] } = useUsuarios();

  const deleteMutation = useDeleteTarea();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const is404 = isHttpError(error) && error.status === 404;

  useEffect(() => {
    if (!is404) return;
    toast.message('Esta tarea no existe');
    const timeoutId = window.setTimeout(() => {
      navigate('/tareas', { replace: true });
    }, NOT_FOUND_REDIRECT_DELAY);
    return () => window.clearTimeout(timeoutId);
  }, [is404, navigate]);

  function handleConfirmDelete() {
    if (!id) return;
    deleteMutation.mutate(id, {
      onSuccess: () => {
        setDeleteOpen(false);
        navigate('/tareas', { replace: true });
      },
      onError: () => {
        setDeleteOpen(false);
      },
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Cargando tarea">
        <div className="flex items-start gap-3">
          <Skeleton className="h-9 w-9 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-64" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-40" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (is404) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Esta tarea no existe. Volviendo al listado...
      </p>
    );
  }

  if (error || !tarea || !id) {
    return (
      <Card>
        <CardContent className="space-y-4 py-12 text-center">
          <p className="text-sm text-destructive">No fue posible cargar la tarea.</p>
          <Button variant="outline" onClick={() => navigate('/tareas')}>
            Volver al listado
          </Button>
        </CardContent>
      </Card>
    );
  }

  const responsable = usuarios.find((u) => u.id === tarea.responsableId);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/tareas')}
            aria-label="Volver al listado"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">{tarea.titulo}</h1>
            <div className="flex flex-wrap gap-2">
              <TareaEstadoBadge tareaId={tarea.id} />
              <Badge className={cn(prioridadBadgeClass[tarea.prioridad])}>
                {prioridadLabels[tarea.prioridad]}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <TareaEstadoMenu tarea={tarea} />
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

      <Card>
        <CardContent className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2">
          <Field label="Trato vinculado">
            {trato ? (
              <Link
                to={`/tratos/${trato.id}`}
                className="text-primary hover:underline"
              >
                {trato.nombre}
              </Link>
            ) : (
              '—'
            )}
          </Field>

          <Field label="Responsable">{responsable?.nombre ?? '—'}</Field>

          <Field label="Tipo">{tipoLabels[tarea.tipo]}</Field>

          <Field label="Prioridad">
            <Badge className={cn(prioridadBadgeClass[tarea.prioridad])}>
              {prioridadLabels[tarea.prioridad]}
            </Badge>
          </Field>

          <Field label="Fecha límite">{formatDate(tarea.fechaLimite)}</Field>

          {tarea.fechaCompletada && (
            <Field label="Fecha completada">{formatDate(tarea.fechaCompletada)}</Field>
          )}

          {tarea.descripcion && (
            <div className="space-y-1 sm:col-span-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Descripción
              </p>
              <p className="whitespace-pre-wrap text-sm">{tarea.descripcion}</p>
            </div>
          )}

          <Field label="Creado">{formatDate(tarea.creadoEn)}</Field>
          <Field label="Última actualización">{formatDate(tarea.actualizadoEn)}</Field>
        </CardContent>
      </Card>

      {/* Etiquetas — asigna sobre la ficha de la tarea (catálogo de tipo TAREA). */}
      <FichaEtiquetasPanel tipoFicha="TAREA" entidadId={id} />

      {/* Dialogs */}
      <TareaEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        tarea={tarea}
      />

      <TareaDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        titulo={tarea.titulo}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}
