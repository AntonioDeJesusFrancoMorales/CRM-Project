// La ficha TRATO la crea el BACK automáticamente (CreateTratoService.java); el front
// NO la crea para evitar duplicados. useCreateTrato invalida ['fichas'] tras crear.

import { isHttpError } from '@/api/http-error';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { TratoCreatePayload } from '@/api/types';
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
    // Normaliza opcionales del form (undefined/'' ) a null para el contrato del back.
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
    mutation.mutate(payload, { onSuccess: () => onOpenChange(false) });
  }

  const initial: Partial<TratoCreateInput> = {
    ...TRATO_EMPTY_DEFAULTS,
    ...(defaultValues ?? {}),
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Nuevo trato</DialogTitle>
          <DialogDescription>
            Registra una nueva oportunidad en tu pipeline comercial.
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
