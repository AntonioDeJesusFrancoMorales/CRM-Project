import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { ArrowLeft, Pencil, Trash2, Check, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isHttpError } from '@/api/http-error';
import { formatDate } from '@/lib/format';
import type { TipoContrato, Trato } from '@/api/types';
import { useTrato } from '../hooks/useTrato';
import { useDeleteTrato } from '../hooks/useDeleteTrato';
import { useGanarTrato } from '../hooks/useGanarTrato';
import { useUpdateTrato } from '../hooks/useUpdateTrato';
import { useClientes } from '@/features/clientes/hooks/useClientes';
import { useProspectos } from '@/features/prospectos/hooks/useProspectos';
import { useUsuarios } from '@/features/usuarios/hooks/useUsuarios';
import { TratoEstadoBadge } from '../components/TratoEstadoBadge';
import { TratoEditDialog } from '../components/TratoEditDialog';
import { TratoDeleteDialog } from '../components/TratoDeleteDialog';
import { TratoPerderDialog } from '../components/TratoPerderDialog';

const NOT_FOUND_REDIRECT_DELAY = 1500;

const tipoContratoLabels: Record<TipoContrato, string> = {
  precio_fijo: 'Precio fijo',
  tiempo_materiales: 'Tiempo y materiales',
  retainer: 'Retainer',
};

function formatCurrency(value: number | null): string {
  if (value === null) return '—';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(value);
}

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

export function TratoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: trato, isLoading, error } = useTrato(id);
  const { data: clientes = [] } = useClientes();
  const { data: prospectos = [] } = useProspectos();
  const { data: usuarios = [] } = useUsuarios();

  const deleteMutation = useDeleteTrato();
  const ganarMutation = useGanarTrato();
  const updateMutation = useUpdateTrato();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [perderOpen, setPerderOpen] = useState(false);

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

  const responsable = usuarios.find((u) => u.id === trato.responsable_id);
  const cliente = trato.cliente_id ? clientes.find((c) => c.id === trato.cliente_id) : null;
  const prospecto = trato.prospecto_id
    ? prospectos.find((p) => p.id === trato.prospecto_id)
    : null;

  const isPending =
    deleteMutation.isPending || ganarMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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
            <TratoEstadoBadge estado={trato.estado} />
          </div>
        </div>

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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Field label="Vinculado a">
          {cliente ? (
            <Link to={`/clientes/${cliente.id}`} className="text-primary hover:underline">
              {cliente.nombre_contacto} (cliente)
            </Link>
          ) : prospecto ? (
            <Link to={`/prospectos/${prospecto.id}`} className="text-primary hover:underline">
              {prospecto.nombre_contacto} (prospecto)
            </Link>
          ) : (
            '—'
          )}
        </Field>

        <Field label="Responsable">{responsable?.nombre ?? '—'}</Field>

        <Field label="Valor estimado">{formatCurrency(trato.valor_estimado)}</Field>

        <Field label="Probabilidad">
          {trato.probabilidad !== null ? `${trato.probabilidad}%` : '—'}
        </Field>

        <Field label="Fecha de cierre esperada">
          {formatDate(trato.fecha_cierre_esperada)}
        </Field>

        <Field label="Tipo de contrato">
          {trato.tipo_contrato ? tipoContratoLabels[trato.tipo_contrato] : '—'}
        </Field>

        {trato.estado === 'perdido' && (
          <div className="sm:col-span-2 space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Motivo de pérdida
            </p>
            <p className="text-sm whitespace-pre-wrap">{trato.motivo_perdida ?? '—'}</p>
          </div>
        )}

        <Field label="Creado">{formatDate(trato.creado_en)}</Field>
        <Field label="Última actualización">{formatDate(trato.actualizado_en)}</Field>
      </div>

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
