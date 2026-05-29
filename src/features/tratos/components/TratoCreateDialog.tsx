import { isHttpError } from '@/api/http-error';
import type { TratoCreatePayload } from '@/api/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  TRATO_EMPTY_DEFAULTS,
  type TratoCreateInput,
} from '../schemas/trato.schema';
import { useCreateTrato } from '../hooks/useCreateTrato';
import { TratoForm } from './TratoForm';

interface TratoCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<TratoCreateInput>;
}

export function TratoCreateDialog({
  open,
  onOpenChange,
  defaultValues,
}: TratoCreateDialogProps) {
  const mutation = useCreateTrato();

  const serverErrors =
    isHttpError(mutation.error) &&
    mutation.error.status === 422 &&
    mutation.error.details
      ? mutation.error.details
      : undefined;

  function handleSubmit(values: TratoCreateInput) {
    // Normaliza opcionales del form (undefined) a null para el contrato del back.
    const payload: TratoCreatePayload = {
      contactoId: values.contactoId,
      responsableId: values.responsableId,
      nombre: values.nombre,
      tipoContrato: values.tipoContrato,
      valorEstimado: values.valorEstimado ?? null,
      probabilidad: values.probabilidad ?? null,
      fechaCierreEsperada: values.fechaCierreEsperada?.trim()
        ? values.fechaCierreEsperada
        : null,
    };
    mutation.mutate(payload, {
      onSuccess: () => onOpenChange(false),
    });
  }

  const initial: Partial<TratoCreateInput> = {
    ...TRATO_EMPTY_DEFAULTS,
    ...(defaultValues ?? {}),
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo trato</DialogTitle>
          <DialogDescription>
            Completa los datos para registrar un nuevo trato.
          </DialogDescription>
        </DialogHeader>
        <TratoForm
          mode="create"
          defaultValues={initial}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isSubmitting={mutation.isPending}
          serverErrors={serverErrors}
        />
      </DialogContent>
    </Dialog>
  );
}
