import { useRef, useState } from 'react';
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
  existingEmpresas?: Empresa[];
};

type EditProps = {
  mode: 'edit';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresa: Empresa;
  existingEmpresas?: Empresa[];
};

type EmpresaFormDialogProps = CreateProps | EditProps;

function getServerErrors(error: unknown): Array<{ field: string; message: string }> | undefined {
  if (!isHttpError(error) || error.status !== 422) return undefined;
  if (error.details?.length) return error.details;
  return [{ field: '', message: error.message }];
}

function CreateDialog({
  open,
  onOpenChange,
  existingEmpresas,
}: Pick<CreateProps, 'open' | 'onOpenChange' | 'existingEmpresas'>) {
  const mutation = useCreateEmpresa();
  const submissionLock = useRef(false);
  const [isSubmitLocked, setIsSubmitLocked] = useState(false);

  const serverErrors = getServerErrors(mutation.error);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && submissionLock.current) return;
    onOpenChange(nextOpen);
  }

  function handleSubmit(values: EmpresaCreateInput) {
    if (submissionLock.current) return;

    submissionLock.current = true;
    setIsSubmitLocked(true);
    mutation.mutate(values, {
      onSettled: (_data, error) => {
        submissionLock.current = false;
        setIsSubmitLocked(false);
        if (!error) handleOpenChange(false);
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
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
          onCancel={() => handleOpenChange(false)}
          isSubmitting={mutation.isPending || isSubmitLocked}
          serverErrors={serverErrors}
          existingEmpresas={existingEmpresas}
        />
      </DialogContent>
    </Dialog>
  );
}

function EditDialog({
  open,
  onOpenChange,
  empresa,
  existingEmpresas,
}: Pick<EditProps, 'open' | 'onOpenChange' | 'empresa' | 'existingEmpresas'>) {
  const mutation = useUpdateEmpresa(empresa.id);
  const submissionLock = useRef(false);
  const [isSubmitLocked, setIsSubmitLocked] = useState(false);

  const serverErrors = getServerErrors(mutation.error);

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

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && submissionLock.current) return;
    onOpenChange(nextOpen);
  }

  function handleSubmit(values: EmpresaCreateInput) {
    if (submissionLock.current) return;

    submissionLock.current = true;
    setIsSubmitLocked(true);
    mutation.mutate(values, {
      onSettled: (_data, error) => {
        submissionLock.current = false;
        setIsSubmitLocked(false);
        if (!error) handleOpenChange(false);
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
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
          onCancel={() => handleOpenChange(false)}
          isSubmitting={mutation.isPending || isSubmitLocked}
          serverErrors={serverErrors}
          existingEmpresas={existingEmpresas}
          currentEmpresaId={empresa.id}
        />
      </DialogContent>
    </Dialog>
  );
}

export function EmpresaFormDialog(props: EmpresaFormDialogProps) {
  if (props.mode === 'create') {
    return (
      <CreateDialog
        open={props.open}
        onOpenChange={props.onOpenChange}
        existingEmpresas={props.existingEmpresas}
      />
    );
  }
  return (
    <EditDialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      empresa={props.empresa}
      existingEmpresas={props.existingEmpresas}
    />
  );
}
