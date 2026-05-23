import { isHttpError } from '@/api/http-error';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CLIENTE_EMPTY_DEFAULTS, type ClienteCreateInput } from '../schemas/cliente.schema';
import { useCreateCliente } from '../hooks/useCreateCliente';
import { ClienteForm } from './ClienteForm';

interface ClienteCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClienteCreateDialog({ open, onOpenChange }: ClienteCreateDialogProps) {
  const mutation = useCreateCliente();

  const serverErrors =
    isHttpError(mutation.error) &&
    mutation.error.status === 422 &&
    mutation.error.details
      ? mutation.error.details
      : undefined;

  function handleSubmit(values: ClienteCreateInput) {
    mutation.mutate(values, {
      onSuccess: () => onOpenChange(false),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo cliente</DialogTitle>
          <DialogDescription>
            Completa los datos para registrar un nuevo cliente.
          </DialogDescription>
        </DialogHeader>
        <ClienteForm
          mode="create"
          defaultValues={CLIENTE_EMPTY_DEFAULTS}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isSubmitting={mutation.isPending}
          serverErrors={serverErrors}
        />
      </DialogContent>
    </Dialog>
  );
}
