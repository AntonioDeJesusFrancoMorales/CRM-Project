import { useSynchronousMutationLock } from '@/components/shared/useSynchronousMutationLock';
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
  existingContactos?: Contacto[];
};

type EditProps = {
  mode: 'edit';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contacto: Contacto;
  existingContactos?: Contacto[];
};

type ContactoFormDialogProps = CreateProps | EditProps;

function getServerErrors(error: unknown): Array<{ field: string; message: string }> | undefined {
  if (!isHttpError(error) || error.status !== 422) return undefined;
  if (error.details?.length) return error.details;
  return [{ field: '', message: error.message }];
}

function CreateDialog({
  open,
  onOpenChange,
  existingContactos,
}: Pick<CreateProps, 'open' | 'onOpenChange' | 'existingContactos'>) {
  const mutation = useCreateContacto();
  const { acquire, release, isLocked, lockRef: submissionLock } = useSynchronousMutationLock();

  const serverErrors = getServerErrors(mutation.error);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && submissionLock.current) return;
    onOpenChange(nextOpen);
  }

  function handleSubmit(values: ContactoCreateInput) {
    if (!acquire()) return;
    mutation.mutate(values, {
      onSettled: (_data, error) => {
        release();
        if (!error) handleOpenChange(false);
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
          onCancel={() => handleOpenChange(false)}
          isSubmitting={mutation.isPending || isLocked}
          serverErrors={serverErrors}
          existingContactos={existingContactos}
        />
      </DialogContent>
    </Dialog>
  );
}

function EditDialog({
  open,
  onOpenChange,
  contacto,
  existingContactos,
}: Pick<EditProps, 'open' | 'onOpenChange' | 'contacto' | 'existingContactos'>) {
  const mutation = useUpdateContacto();
  const { acquire, release, isLocked, lockRef: submissionLock } = useSynchronousMutationLock();

  const serverErrors = getServerErrors(mutation.error);

  const defaultValues: Partial<ContactoCreateInput> = {
    nombre: contacto.nombre,
    correo: contacto.correo,
    telefono: contacto.telefono,
    estadoRelacion: contacto.estadoRelacion,
    cargo: contacto.cargo,
    comoNosConocio: contacto.comoNosConocio,
    empresaId: contacto.empresaId,
  };

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && submissionLock.current) return;
    onOpenChange(nextOpen);
  }

  function handleSubmit(values: ContactoCreateInput) {
    if (!acquire()) return;
    const { empresaId: _empresaId, ...data } = values;
    mutation.mutate({ id: contacto.id, data }, {
      onSettled: (_data, error) => {
        release();
        if (!error) handleOpenChange(false);
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar contacto</DialogTitle>
          <DialogDescription>
            Modifica los datos de <strong>{contacto.nombre}</strong>.
          </DialogDescription>
        </DialogHeader>
        <ContactoForm
          mode="edit"
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          onCancel={() => handleOpenChange(false)}
          isSubmitting={mutation.isPending || isLocked}
          serverErrors={serverErrors}
          existingContactos={existingContactos}
          currentContactoId={contacto.id}
          estadoActual={contacto.estadoRelacion}
        />
      </DialogContent>
    </Dialog>
  );
}

export function ContactoFormDialog(props: ContactoFormDialogProps) {
  if (props.mode === 'create') {
    return (
      <CreateDialog
        open={props.open}
        onOpenChange={props.onOpenChange}
        existingContactos={props.existingContactos}
      />
    );
  }
  return (
    <EditDialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      contacto={props.contacto}
      existingContactos={props.existingContactos}
    />
  );
}
