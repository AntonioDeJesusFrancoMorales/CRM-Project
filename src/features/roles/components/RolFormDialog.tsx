import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isHttpError } from '@/api/http-error';
import type { Rol } from '@/api/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { rolCreateSchema, type RolCreateInput } from '../schemas/rol.schema';
import { useCreateRol } from '../hooks/useCreateRol';
import { useEditRol } from '../hooks/useEditRol';

type CreateProps = {
  mode: 'create';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rol?: never;
};

type EditProps = {
  mode: 'edit';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rol: Rol;
};

export type RolFormDialogProps = CreateProps | EditProps;

// ─── Formulario compartido (create + edit comparten los mismos campos) ──────────

interface RolFormProps {
  defaultValues?: Partial<RolCreateInput>;
  onSubmit: (values: RolCreateInput) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  serverErrors?: Array<{ field: string; message: string }>;
  submitLabel: string;
}

function RolForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  serverErrors,
  submitLabel,
}: RolFormProps) {
  const form = useForm<RolCreateInput>({
    resolver: zodResolver(rolCreateSchema),
    defaultValues: {
      nombre: '',
      descripcion: '',
      ...(defaultValues ?? {}),
    },
  });

  useEffect(() => {
    if (!serverErrors?.length) return;
    for (const { field, message } of serverErrors) {
      form.setError(field as keyof RolCreateInput, { message });
    }
  }, [serverErrors, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Nombre{' '}
                <span aria-hidden="true" className="text-destructive">
                  *
                </span>
              </FormLabel>
              <FormControl>
                <Input placeholder="Nombre del rol" maxLength={80} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="descripcion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Input
                  placeholder="Descripción opcional del rol"
                  maxLength={255}
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function serverErrorsFromMutation(error: unknown): Array<{ field: string; message: string }> | undefined {
  return isHttpError(error) && error.status === 422 && error.details ? error.details : undefined;
}

// ─── Create ─────────────────────────────────────────────────────────────────────

function CreateDialog({ open, onOpenChange }: Pick<CreateProps, 'open' | 'onOpenChange'>) {
  const mutation = useCreateRol();

  function handleSubmit(values: RolCreateInput) {
    mutation.mutate(values, { onSuccess: () => onOpenChange(false) });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo rol</DialogTitle>
          <DialogDescription>
            Completa los datos para registrar un nuevo rol en el CRM.
          </DialogDescription>
        </DialogHeader>
        <RolForm
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isSubmitting={mutation.isPending}
          serverErrors={serverErrorsFromMutation(mutation.error)}
          submitLabel="Crear rol"
        />
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit ─────────────────────────────────────────────────────────────────────

function EditDialog({ open, onOpenChange, rol }: Pick<EditProps, 'open' | 'onOpenChange' | 'rol'>) {
  const mutation = useEditRol(rol.id);

  function handleSubmit(values: RolCreateInput) {
    mutation.mutate(values, { onSuccess: () => onOpenChange(false) });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar rol</DialogTitle>
          <DialogDescription>
            Modifica los datos de <strong>{rol.nombre}</strong>.
          </DialogDescription>
        </DialogHeader>
        <RolForm
          defaultValues={{ nombre: rol.nombre, descripcion: rol.descripcion ?? '' }}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isSubmitting={mutation.isPending}
          serverErrors={serverErrorsFromMutation(mutation.error)}
          submitLabel="Guardar cambios"
        />
      </DialogContent>
    </Dialog>
  );
}

// ─── Componente público ───────────────────────────────────────────────────────

export function RolFormDialog(props: RolFormDialogProps) {
  if (props.mode === 'create') {
    return <CreateDialog open={props.open} onOpenChange={props.onOpenChange} />;
  }
  return <EditDialog open={props.open} onOpenChange={props.onOpenChange} rol={props.rol} />;
}
