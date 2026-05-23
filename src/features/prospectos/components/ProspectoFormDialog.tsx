import { isHttpError } from '@/api/http-error';
import type { Prospecto } from '@/api/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ProspectoCreateInput } from '../schemas/prospecto.schema';
import { useCreateProspecto } from '../hooks/useCreateProspecto';
import { useUpdateProspecto } from '../hooks/useUpdateProspecto';
import { ProspectoForm } from './ProspectoForm';

// Design sección 5: ProspectoFormDialog es Container del Dialog (create/edit)
// ADR-026: isLocked se deriva de estado_posible_cliente === 'convertido'

type CreateProps = {
  mode: 'create';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prospecto?: never;
};

type EditProps = {
  mode: 'edit';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prospecto: Prospecto;
};

type ProspectoFormDialogProps = CreateProps | EditProps;

function CreateDialog({
  open,
  onOpenChange,
}: Pick<CreateProps, 'open' | 'onOpenChange'>) {
  const mutation = useCreateProspecto();

  const serverErrors =
    isHttpError(mutation.error) &&
    mutation.error.status === 422 &&
    mutation.error.details
      ? mutation.error.details
      : undefined;

  function handleSubmit(values: ProspectoCreateInput) {
    mutation.mutate(values, { onSuccess: () => onOpenChange(false) });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo prospecto</DialogTitle>
          <DialogDescription>
            Completa los datos para registrar un nuevo prospecto.
          </DialogDescription>
        </DialogHeader>
        <ProspectoForm
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
  prospecto,
}: Pick<EditProps, 'open' | 'onOpenChange' | 'prospecto'>) {
  const mutation = useUpdateProspecto(prospecto.id);

  // ADR-026: bloqueo post-conversión derivado del estado del prospecto
  const isLocked = prospecto.estado_posible_cliente === 'convertido';

  const serverErrors =
    isHttpError(mutation.error) &&
    mutation.error.status === 422 &&
    mutation.error.details
      ? mutation.error.details
      : undefined;

  const defaultValues: Partial<ProspectoCreateInput> = {
    nombre_contacto: prospecto.nombre_contacto,
    empresa_id: prospecto.empresa_id,
    responsable_id: prospecto.responsable_id,
    correo_contacto: prospecto.correo_contacto ?? '',
    telefono_contacto: prospecto.telefono_contacto ?? '',
    cargo_contacto: prospecto.cargo_contacto ?? '',
    como_nos_conocio: prospecto.como_nos_conocio ?? undefined,
    estado_posible_cliente:
      prospecto.estado_posible_cliente === 'convertido'
        ? 'frio'
        : prospecto.estado_posible_cliente,
    notas: prospecto.notas ?? '',
  };

  function handleSubmit(values: ProspectoCreateInput) {
    mutation.mutate(values, { onSuccess: () => onOpenChange(false) });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar prospecto</DialogTitle>
          <DialogDescription>
            {isLocked
              ? 'Este prospecto fue convertido a cliente. Solo puedes editar las notas.'
              : `Modifica los datos de ${prospecto.nombre_contacto}.`}
          </DialogDescription>
        </DialogHeader>
        <ProspectoForm
          mode="edit"
          defaultValues={defaultValues}
          isLocked={isLocked}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isSubmitting={mutation.isPending}
          serverErrors={serverErrors}
        />
      </DialogContent>
    </Dialog>
  );
}

export function ProspectoFormDialog(props: ProspectoFormDialogProps) {
  if (props.mode === 'create') {
    return <CreateDialog open={props.open} onOpenChange={props.onOpenChange} />;
  }
  return (
    <EditDialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      prospecto={props.prospecto}
    />
  );
}
