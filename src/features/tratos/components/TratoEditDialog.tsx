import { isHttpError } from '@/api/http-error';
import type { Trato } from '@/api/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { TratoCreateInput } from '../schemas/trato.schema';
import { useUpdateTrato } from '../hooks/useUpdateTrato';
import { TratoForm } from './TratoForm';

interface TratoEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trato: Trato;
}

export function TratoEditDialog({ open, onOpenChange, trato }: TratoEditDialogProps) {
  const mutation = useUpdateTrato();

  const serverErrors =
    isHttpError(mutation.error) &&
    mutation.error.status === 422 &&
    mutation.error.details
      ? mutation.error.details
      : undefined;

  // Inicializa el toggle según el campo poblado del trato (cliente_id XOR prospecto_id).
  const defaultValues: Partial<TratoCreateInput> = {
    asociacion: trato.cliente_id ? 'cliente' : 'prospecto',
    cliente_id: trato.cliente_id ?? '',
    prospecto_id: trato.prospecto_id ?? '',
    nombre: trato.nombre,
    responsable_id: trato.responsable_id,
    valor_estimado: trato.valor_estimado,
    probabilidad: trato.probabilidad,
    fecha_cierre_esperada: trato.fecha_cierre_esperada ?? '',
    tipo_contrato: trato.tipo_contrato,
  };

  function handleSubmit(values: TratoCreateInput) {
    // Transformar payload del form (igual que useCreateTrato): quitar asociacion, forzar opuesto a null.
    const isCliente = values.asociacion === 'cliente';
    const data = {
      cliente_id: isCliente ? (values.cliente_id ?? '') || null : null,
      prospecto_id: !isCliente ? (values.prospecto_id ?? '') || null : null,
      nombre: values.nombre,
      responsable_id: values.responsable_id,
      valor_estimado: values.valor_estimado ?? null,
      probabilidad: values.probabilidad ?? null,
      fecha_cierre_esperada: values.fecha_cierre_esperada?.trim() ? values.fecha_cierre_esperada : null,
      tipo_contrato: values.tipo_contrato ?? null,
    };
    mutation.mutate(
      { id: trato.id, data: data as never },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar trato</DialogTitle>
          <DialogDescription>
            Modifica los datos de <strong>{trato.nombre}</strong>.
          </DialogDescription>
        </DialogHeader>
        <TratoForm
          mode="edit"
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isSubmitting={mutation.isPending}
          serverErrors={serverErrors}
        />
      </DialogContent>
    </Dialog>
  );
}
