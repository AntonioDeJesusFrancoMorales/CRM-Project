import { isHttpError } from '@/api/http-error';
import type { Contacto } from '@/api/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ContactoCreateInput } from '../schemas/contacto.schema';
import { useCreateContacto } from '../hooks/useCreateContacto';
import { useUpdateContacto } from '../hooks/useUpdateContacto';
import { ContactoForm } from './ContactoForm';

type CreateProps = {
  mode: 'create';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contacto?: never;
};

type EditProps = {
  mode: 'edit';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contacto: Contacto;
};

type ContactoFormDialogProps = CreateProps | EditProps;

function CreateDialog({
  open,
  onOpenChange,
}: Pick<CreateProps, 'open' | 'onOpenChange'>) {
  const mutation = useCreateContacto();

  const serverErrors =
    isHttpError(mutation.error) &&
    mutation.error.status === 422 &&
    mutation.error.details
      ? mutation.error.details
      : undefined;

  function handleSubmit(values: ContactoCreateInput) {
    mutation.mutate(values, { onSuccess: () => onOpenChange(false) });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo contacto</DialogTitle>
          <DialogDescription>
            Completa los datos para registrar un nuevo contacto.
          </DialogDescription>
        </DialogHeader>
        <ContactoForm
          mode="create"
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isSubmitting={mutation.isPending}
          serverErrors={serverErrors}
        />
      </DialogContent>
    </Dialog>
  );
}

function EditDialog({
  open,
  onOpenChange,
  contacto,
}: Pick<EditProps, 'open' | 'onOpenChange' | 'contacto'>) {
  const mutation = useUpdateContacto();

  const serverErrors =
    isHttpError(mutation.error) &&
    mutation.error.status === 422 &&
    mutation.error.details
      ? mutation.error.details
      : undefined;

  const defaultValues: Partial<ContactoCreateInput> = {
    nombre: contacto.nombre,
    correo: contacto.correo,
    telefono: contacto.telefono,
    estadoRelacion: contacto.estadoRelacion,
    comoNosConocio: contacto.comoNosConocio,
    empresaId: contacto.empresaId,
  };

  function handleSubmit(values: ContactoCreateInput) {
    mutation.mutate(
      { id: contacto.id, data: values },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar contacto</DialogTitle>
          <DialogDescription>
            Modifica los datos de{' '}
            <strong>{contacto.nombre}</strong>.
          </DialogDescription>
        </DialogHeader>
        <ContactoForm
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

export function ContactoFormDialog(props: ContactoFormDialogProps) {
  if (props.mode === 'create') {
    return <CreateDialog open={props.open} onOpenChange={props.onOpenChange} />;
  }
  return (
    <EditDialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      contacto={props.contacto}
    />
  );
}
