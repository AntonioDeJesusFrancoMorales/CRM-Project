// TareaCreateDialog — wrapper sobre TareaForm + useCreateTarea.
// Acepta tratoIdFijo? para pre-cargar el trato cuando se crea desde el tab de un trato.
// Homologa TratoCreateDialog.

import { isHttpError } from '@/api/http-error';
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

interface TareaCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tratoIdFijo?: string;
  defaultValues?: Partial<TareaCreateInput>;
}

export function TareaCreateDialog({
  open,
  onOpenChange,
  tratoIdFijo,
  defaultValues,
}: TareaCreateDialogProps) {
  const mutation = useCreateTarea();

  const serverErrors =
    isHttpError(mutation.error) &&
    mutation.error.status === 422 &&
    mutation.error.details
      ? mutation.error.details
      : undefined;

  function handleSubmit(values: TareaCreateInput) {
    mutation.mutate(values, {
      onSuccess: () => onOpenChange(false),
    });
  }

  const initial: Partial<TareaCreateInput> = {
    ...TAREA_EMPTY_DEFAULTS,
    ...(tratoIdFijo ? { trato_id: tratoIdFijo } : {}),
    ...(defaultValues ?? {}),
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva tarea</DialogTitle>
          <DialogDescription>
            Completa los datos para registrar una nueva tarea.
          </DialogDescription>
        </DialogHeader>
        <TareaForm
          mode="create"
          defaultValues={initial}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isSubmitting={mutation.isPending}
          serverErrors={serverErrors}
          tratoIdFijo={tratoIdFijo}
        />
      </DialogContent>
    </Dialog>
  );
}
