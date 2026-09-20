// AgendaCreateDialog — wrapper sobre AgendaForm + useCreateAgenda.
// Acepta defaultValues? para precargar (p.ej. crear desde el detalle de un trato con tratoId fijo).
// Homologa TareaCreateDialog.

import { isHttpError } from '@/api/http-error';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AGENDA_EMPTY_DEFAULTS, type AgendaCreateInput } from '../schemas/agenda.schema';
import { useCreateAgenda } from '../hooks/useCreateAgenda';
import { AgendaForm } from './AgendaForm';

interface AgendaCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<AgendaCreateInput>;
}

export function AgendaCreateDialog({ open, onOpenChange, defaultValues }: AgendaCreateDialogProps) {
  const mutation = useCreateAgenda();

  const serverErrors =
    isHttpError(mutation.error) && mutation.error.status === 422 && mutation.error.details
      ? mutation.error.details
      : undefined;

  function handleSubmit(values: AgendaCreateInput) {
    mutation.mutate(values, { onSuccess: () => onOpenChange(false) });
  }

  const initial: Partial<AgendaCreateInput> = {
    ...AGENDA_EMPTY_DEFAULTS,
    ...(defaultValues ?? {}),
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Nuevo evento</DialogTitle>
          <DialogDescription>
            Programa una llamada o reunión en tu agenda.
          </DialogDescription>
        </DialogHeader>
        <AgendaForm
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
