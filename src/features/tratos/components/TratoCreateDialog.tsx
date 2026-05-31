import { isHttpError } from '@/api/http-error';
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
import { useCrearTratoConFicha } from '../hooks/useCrearTratoConFicha';
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
  const { crear, isPending, error } = useCrearTratoConFicha();

  const serverErrors =
    isHttpError(error) &&
    error.status === 422 &&
    error.details
      ? error.details
      : undefined;

  function handleSubmit(values: TratoCreateInput) {
    crear(values)
      .then(() => onOpenChange(false))
      .catch(() => {
        // El error ya queda en `error` del hook; serverErrors lo mapea si es 422
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
          isSubmitting={isPending}
          serverErrors={serverErrors}
        />
      </DialogContent>
    </Dialog>
  );
}
