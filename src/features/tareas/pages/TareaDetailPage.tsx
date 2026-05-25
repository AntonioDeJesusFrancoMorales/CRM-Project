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
import { isHttpError } from '@/api/http-error';
import { formatDate } from '@/lib/format';
import type { TipoTarea } from '@/api/types';
import { useTarea } from '../hooks/useTarea';
import { useDeleteTarea } from '../hooks/useDeleteTarea';
import { useTrato } from '@/features/tratos/hooks/useTrato';
import { useUsuarios } from '@/features/usuarios/hooks/useUsuarios';
import { TareaEditDialog } from '../components/TareaEditDialog';
import { TareaDeleteDialog } from '../components/TareaDeleteDialog';
import { TareaEstadoMenu } from '../components/TareaEstadoMenu';

const NOT_FOUND_REDIRECT_DELAY = 1500;

const tipoLabels: Record<TipoTarea, string> = {
  llamada: 'Llamada',
  reunion: 'Reunión',
  email: 'Email',
  demo: 'Demo',
  seguimiento: 'Seguimiento',
};

const prioridadLabels: Record<1 | 2 | 3, string> = {
  1: 'Alta',
  2: 'Media',
  3: 'Baja',
};

const estadoLabels: Record<string, string> = {
  pendiente: 'Pendiente',
  en_progreso: 'En progreso',
  completada: 'Completada',
};

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
  const { data: trato } = useTrato(tarea?.trato_id);
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
      <p className="py-12 text-center text-sm text-muted-foreground">
        Cargando tarea...
      </p>
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
      <div className="space-y-4 py-12 text-center">
        <p className="text-sm text-destructive">No fue posible cargar la tarea.</p>
        <Button variant="outline" onClick={() => navigate('/tareas')}>
          Volver al listado
        </Button>
      </div>
    );
  }

  const responsable = usuarios.find((u) => u.id === tarea.responsable_id);

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
              <Badge variant="secondary">
                {estadoLabels[tarea.estado] ?? tarea.estado}
              </Badge>
              <Badge variant="outline">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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

        <Field label="Prioridad">{prioridadLabels[tarea.prioridad]}</Field>

        <Field label="Fecha límite">{formatDate(tarea.fecha_limite)}</Field>

        {tarea.estado === 'completada' && (
          <Field label="Fecha completada">{formatDate(tarea.fecha_completada)}</Field>
        )}

        {tarea.descripcion && (
          <div className="sm:col-span-2 space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Descripción
            </p>
            <p className="text-sm whitespace-pre-wrap">{tarea.descripcion}</p>
          </div>
        )}

        <Field label="Creado">{formatDate(tarea.creado_en)}</Field>
        <Field label="Última actualización">{formatDate(tarea.actualizado_en)}</Field>
      </div>

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
