// TareaCreateDialog — wrapper sobre TareaForm + useCrearTareaConFicha.
// Acepta tratoIdFijo? para pre-cargar el trato cuando se crea desde el tab de un trato.
// Homologa TratoCreateDialog.
// Al crear una tarea se crea automáticamente una ficha TAREA en el tablero de tareas
// (primera columna), usando useCrearTareaConFicha. Si no hay tablero TAREAS, la ficha
// se omite y la tarea se crea igual (degradación elegante).

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
import { useCrearTareaConFicha } from '../hooks/useCrearTareaConFicha';
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
  const { crear, isPending, error } = useCrearTareaConFicha();

  const serverErrors =
    isHttpError(error) && error.status === 422 && error.details
      ? error.details
      : undefined;

  function handleSubmit(values: TareaCreateInput) {
    void crear(values).then(() => onOpenChange(false)).catch(() => {
      // El error queda en `error` del hook; el form mostrará serverErrors si aplica
    });
  }

  const initial: Partial<TareaCreateInput> = {
    ...TAREA_EMPTY_DEFAULTS,
    ...(tratoIdFijo ? { tratoId: tratoIdFijo } : {}),
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
          isSubmitting={isPending}
          serverErrors={serverErrors}
          tratoIdFijo={tratoIdFijo}
        />
      </DialogContent>
    </Dialog>
  );
}
