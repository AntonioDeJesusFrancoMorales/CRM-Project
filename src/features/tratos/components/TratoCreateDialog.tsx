// La ficha TRATO la crea el BACK automáticamente (CreateTratoService.java); el front
// NO la crea para evitar duplicados. useCreateTrato invalida ['fichas'] tras crear.

import { isHttpError } from '@/api/http-error';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useSynchronousMutationLock } from '@/components/shared/useSynchronousMutationLock';
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
import { moveCreatedEntityFicha } from '@/features/kanban/lib/moveCreatedEntityFicha';
import { fichasKeys } from '@/features/kanban/hooks/useFichas';

interface TratoCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<TratoCreateInput>;
  targetColumnId?: string;
  targetColumnName?: string;
}

export function TratoCreateDialog({
  open,
  onOpenChange,
  defaultValues,
  targetColumnId,
  targetColumnName,
}: TratoCreateDialogProps) {
  const mutation = useCreateTrato();
  const queryClient = useQueryClient();
  const { acquire, release, isLocked, lockRef: submissionLock } = useSynchronousMutationLock();

  useEffect(() => {
    if (open && submissionLock.current) release();
  }, [open, release, submissionLock]);

  const serverErrors =
    isHttpError(mutation.error) &&
    (mutation.error.status === 400 || mutation.error.status === 422) &&
    mutation.error.details
      ? mutation.error.details
      : undefined;

  async function handleSubmit(values: TratoCreateInput) {
    const mutationPending = mutation.isPending;
    const localLockRejected = mutationPending ? false : !acquire();

    if (mutationPending || localLockRejected) return;
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
    try {
      const created = await mutation.mutateAsync(payload);
      if (targetColumnId) {
        try {
          await moveCreatedEntityFicha('TRATO', created.id, targetColumnId);
          await queryClient.invalidateQueries({ queryKey: fichasKeys.all });
        } catch {
          toast.error('El trato se creó, pero no fue posible colocarlo en la columna seleccionada');
        }
      }
      onOpenChange(false);
    } catch {
      // The mutation hook owns API error toasts and inline 422 errors.
      release();
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && submissionLock.current) return;
    onOpenChange(nextOpen);
  }

  const initial: Partial<TratoCreateInput> = {
    ...TRATO_EMPTY_DEFAULTS,
    ...(defaultValues ?? {}),
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Nuevo trato</DialogTitle>
          <DialogDescription>
            Registra una nueva oportunidad en tu pipeline comercial.
            {targetColumnName && ` Se agregará en la columna «${targetColumnName}».`}
          </DialogDescription>
        </DialogHeader>
        <TratoForm
          mode="create"
          defaultValues={initial}
          onSubmit={handleSubmit}
           onCancel={() => handleOpenChange(false)}
           isSubmitting={mutation.isPending || isLocked}
          serverErrors={serverErrors}
        />
      </DialogContent>
    </Dialog>
  );
}
