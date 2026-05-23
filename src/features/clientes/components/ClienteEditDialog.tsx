import { isHttpError } from '@/api/http-error';
import type { Cliente } from '@/api/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ClienteCreateInput } from '../schemas/cliente.schema';
import { useUpdateCliente } from '../hooks/useUpdateCliente';
import { ClienteForm } from './ClienteForm';

interface ClienteEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente: Cliente;
}

export function ClienteEditDialog({ open, onOpenChange, cliente }: ClienteEditDialogProps) {
  const mutation = useUpdateCliente();

  const serverErrors =
    isHttpError(mutation.error) &&
    mutation.error.status === 422 &&
    mutation.error.details
      ? mutation.error.details
      : undefined;

  // ADR-035: defaultValues toma los campos del cliente recibido por prop.
  // nullsToStrings se aplica dentro de ClienteForm (modo edit).
  const defaultValues: Partial<ClienteCreateInput> = {
    nombre_contacto: cliente.nombre_contacto,
    empresa_id: cliente.empresa_id,
    responsable_id: cliente.responsable_id,
    correo_contacto: cliente.correo_contacto ?? '',
    telefono_contacto: cliente.telefono_contacto ?? '',
    cargo_contacto: cliente.cargo_contacto ?? '',
    como_nos_conocio: cliente.como_nos_conocio ?? undefined,
    notas: cliente.notas ?? '',
  };

  function handleSubmit(values: ClienteCreateInput) {
    mutation.mutate(
      { id: cliente.id, data: values },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar cliente</DialogTitle>
          <DialogDescription>
            Modifica los datos de <strong>{cliente.nombre_contacto}</strong>.
          </DialogDescription>
        </DialogHeader>
        <ClienteForm
          mode="edit"
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isSubmitting={mutation.isPending}
          serverErrors={serverErrors}
        />
      </DialogContent>
    </Dialog>
  );
}
