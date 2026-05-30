// TareaEditDialog — wrapper sobre TareaForm + useUpdateTarea.
// Precarga los valores de la tarea existente (defaultValues).
// Homologa TratoEditDialog.

import { isHttpError } from '@/api/http-error';
import type { Tarea } from '@/api/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { TareaCreateInput, TareaUpdateInput } from '../schemas/tarea.schema';
import { useUpdateTarea } from '../hooks/useUpdateTarea';
import { TareaForm } from './TareaForm';

interface TareaEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tarea: Tarea;
}

export function TareaEditDialog({ open, onOpenChange, tarea }: TareaEditDialogProps) {
  const mutation = useUpdateTarea();

  const serverErrors =
    isHttpError(mutation.error) &&
    mutation.error.status === 422 &&
    mutation.error.details
      ? mutation.error.details
      : undefined;

  // Precarga los valores del form a partir de la tarea existente.
  // tratoId no es editable en edit — se pasa como tratoIdFijo para que quede disabled.
  const defaultValues: Partial<TareaCreateInput> = {
    tratoId: tarea.tratoId,
    responsableId: tarea.responsableId,
    titulo: tarea.titulo,
    descripcion: tarea.descripcion,
    tipo: tarea.tipo,
    prioridad: tarea.prioridad,
    fechaLimite: tarea.fechaLimite,
  };

  function handleSubmit(values: TareaCreateInput) {
    // En edit, tratoId y responsableId no se incluyen en el update (solo campos editables).
    const updateData: TareaUpdateInput = {
      titulo: values.titulo,
      descripcion: values.descripcion,
      tipo: values.tipo,
      prioridad: values.prioridad,
      fechaLimite: values.fechaLimite,
    };
    mutation.mutate(
      { id: tarea.id, data: updateData },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar tarea</DialogTitle>
          <DialogDescription>
            Modifica los datos de <strong>{tarea.titulo}</strong>.
          </DialogDescription>
        </DialogHeader>
        <TareaForm
          mode="edit"
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isSubmitting={mutation.isPending}
          serverErrors={serverErrors}
          tratoIdFijo={tarea.tratoId}
        />
      </DialogContent>
    </Dialog>
  );
}
