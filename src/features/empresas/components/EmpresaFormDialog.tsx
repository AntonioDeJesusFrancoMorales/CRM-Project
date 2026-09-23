import { isHttpError } from '@/api/http-error';
import type { Empresa } from '@/api/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { EmpresaCreateInput } from '../schemas/empresa.schema';
import { useCreateEmpresa } from '../hooks/useCreateEmpresa';
import { useUpdateEmpresa } from '../hooks/useUpdateEmpresa';
import { EmpresaForm } from './EmpresaForm';

type CreateProps = {
  mode: 'create';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresa?: never;
};

type EditProps = {
  mode: 'edit';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresa: Empresa;
};

type EmpresaFormDialogProps = CreateProps | EditProps;

function CreateDialog({ open, onOpenChange }: Pick<CreateProps, 'open' | 'onOpenChange'>) {
  const mutation = useCreateEmpresa();

  const serverErrors =
    isHttpError(mutation.error) && mutation.error.status === 422 && mutation.error.details
      ? mutation.error.details
      : undefined;

  function handleSubmit(values: EmpresaCreateInput) {
    mutation.mutate(values, { onSuccess: () => onOpenChange(false) });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nueva empresa</DialogTitle>
          <DialogDescription>
            Completa los datos para registrar una nueva empresa. Las nuevas empresas comienzan como
            prospectos.
          </DialogDescription>
        </DialogHeader>
        <EmpresaForm
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
  empresa,
}: Pick<EditProps, 'open' | 'onOpenChange' | 'empresa'>) {
  const mutation = useUpdateEmpresa(empresa.id);

  const serverErrors =
    isHttpError(mutation.error) && mutation.error.status === 422 && mutation.error.details
      ? mutation.error.details
      : undefined;

  const defaultValues: Partial<EmpresaCreateInput> = {
    nombre: empresa.nombre,
    sector: empresa.sector ?? '',
    telefono: empresa.telefono ?? '',
    paginaWeb: empresa.paginaWeb ?? '',
    facebook: empresa.facebook ?? '',
    instagram: empresa.instagram ?? '',
    twitter: empresa.twitter ?? '',
    estadoRelacion: empresa.estadoRelacion,
    notas: empresa.notas ?? '',
  };

  function handleSubmit(values: EmpresaCreateInput) {
    mutation.mutate(values, { onSuccess: () => onOpenChange(false) });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar empresa</DialogTitle>
          <DialogDescription>
            Modifica los datos de <strong>{empresa.nombre}</strong>.
          </DialogDescription>
        </DialogHeader>
        <EmpresaForm
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

export function EmpresaFormDialog(props: EmpresaFormDialogProps) {
  if (props.mode === 'create') {
    return <CreateDialog open={props.open} onOpenChange={props.onOpenChange} />;
  }
  return <EditDialog open={props.open} onOpenChange={props.onOpenChange} empresa={props.empresa} />;
}
