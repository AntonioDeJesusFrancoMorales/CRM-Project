// TareaCreateDialog — wrapper sobre TareaForm + useCreateTarea.
// Acepta tratoIdFijo? para pre-cargar el trato cuando se crea desde el tab de un trato.
// Homologa TratoCreateDialog.
// La ficha TAREA la crea el BACK automáticamente (CreateTareaService.java); el front
// NO la crea para evitar duplicados. useCreateTarea invalida ['fichas'] tras crear.

import { isHttpError } from '@/api/http-error';
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
import {
  TAREA_EMPTY_DEFAULTS,
  type TareaCreateInput,
} from '../schemas/tarea.schema';
import { useCreateTarea } from '../hooks/useCreateTarea';
import { TareaForm } from './TareaForm';
import { moveCreatedEntityFicha } from '@/features/kanban/lib/moveCreatedEntityFicha';
import { fichasKeys } from '@/features/kanban/hooks/useFichas';

interface TareaCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tratoIdFijo?: string;
  defaultValues?: Partial<TareaCreateInput>;
  targetColumnId?: string;
  targetColumnName?: string;
}

export function TareaCreateDialog({
  open,
  onOpenChange,
  tratoIdFijo,
  defaultValues,
  targetColumnId,
  targetColumnName,
}: TareaCreateDialogProps) {
  const mutation = useCreateTarea();
  const queryClient = useQueryClient();
  const { acquire, release, isLocked, lockRef: submissionLock } = useSynchronousMutationLock();

  const serverErrors =
    isHttpError(mutation.error) && (mutation.error.status === 400 || mutation.error.status === 422) && mutation.error.details
      ? mutation.error.details
      : undefined;

  async function handleSubmit(values: TareaCreateInput) {
    if (!acquire()) return;
    try {
      const created = await mutation.mutateAsync(values);
      if (targetColumnId) {
        try {
          await moveCreatedEntityFicha('TAREA', created.id, targetColumnId);
          await queryClient.invalidateQueries({ queryKey: fichasKeys.all });
        } catch {
          toast.error('La tarea se creó, pero no fue posible colocarla en la columna seleccionada');
        }
      }
      onOpenChange(false);
    } catch {
      // The mutation hook owns API error toasts and inline 422 errors.
    } finally {
        release();
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && submissionLock.current) return;
    onOpenChange(nextOpen);
  }

  const initial: Partial<TareaCreateInput> = {
    ...TAREA_EMPTY_DEFAULTS,
    ...(tratoIdFijo ? { tratoId: tratoIdFijo } : {}),
    ...(defaultValues ?? {}),
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Nueva tarea</DialogTitle>
          <DialogDescription>
            Registra una nueva actividad asociada a tu pipeline comercial.
            {targetColumnName && ` Se agregará en la columna «${targetColumnName}».`}
          </DialogDescription>
        </DialogHeader>
        <TareaForm
          mode="create"
          defaultValues={initial}
          onSubmit={handleSubmit}
           onCancel={() => handleOpenChange(false)}
           isSubmitting={mutation.isPending || isLocked}
          serverErrors={serverErrors}
          tratoIdFijo={tratoIdFijo}
        />
      </DialogContent>
    </Dialog>
  );
}
