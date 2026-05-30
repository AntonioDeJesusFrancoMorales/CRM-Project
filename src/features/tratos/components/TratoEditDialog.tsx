import { isHttpError } from '@/api/http-error';
import type { Trato, TratoUpdatePayload } from '@/api/types';
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

  // defaultValues para el form (incluye contactoId para pre-fill, aunque no va en el payload edit)
  const defaultValues: Partial<TratoCreateInput> = {
    contactoId: trato.contactoId,
    nombre: trato.nombre,
    responsableId: trato.responsableId,
    valorEstimado: trato.valorEstimado,
    probabilidad: trato.probabilidad,
    fechaCierreEsperada: trato.fechaCierreEsperada ?? '',
    tipoContrato: trato.tipoContrato,
  };

  function handleSubmit(values: TratoCreateInput) {
    // contactoId es inmutable — se omite del payload de edición (TratoUpdatePayload)
    const { contactoId: _contactoId, ...editData }: TratoCreateInput = values;
    const data: TratoUpdatePayload = {
      nombre: editData.nombre,
      responsableId: editData.responsableId,
      tipoContrato: editData.tipoContrato,
      valorEstimado: editData.valorEstimado ?? null,
      probabilidad: editData.probabilidad ?? null,
      fechaCierreEsperada: editData.fechaCierreEsperada?.trim()
        ? editData.fechaCierreEsperada
        : null,
    };
    mutation.mutate(
      { id: trato.id, data },
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
