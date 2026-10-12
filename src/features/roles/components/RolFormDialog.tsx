import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isHttpError } from '@/api/http-error';
import type { Rol } from '@/api/types';
import { useSynchronousMutationLock } from '@/components/shared/useSynchronousMutationLock';
import { Button } from '@/components/ui/button';
import { useTableros } from '@/features/kanban/hooks/useTableros';
import type { Tablero } from '@/features/kanban/schemas/tablero.schema';
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
import { DEFAULT_PERMISSION_MATRIX, PermissionMatrix } from './PermissionMatrix';

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
  tablerosQuery: TablerosQueryState;
}

interface TablerosQueryState {
  tableros: Tablero[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => Promise<unknown>;
}

function RolForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  serverErrors,
  submitLabel,
  tablerosQuery,
}: RolFormProps) {
  const permissionDefaults = defaultValues?.permisos ?? DEFAULT_PERMISSION_MATRIX;
  const form = useForm<RolCreateInput>({
    resolver: zodResolver(rolCreateSchema),
    defaultValues: {
      nombre: '',
      descripcion: '',
      permisos: permissionDefaults.map((permission) => ({
        ...permission,
        acciones: [...permission.acciones],
        idsPermitidos: permission.idsPermitidos ? [...permission.idsPermitidos] : permission.idsPermitidos,
        gruposLectura: permission.gruposLectura ? [...permission.gruposLectura] : permission.gruposLectura,
        gruposEscritura: permission.gruposEscritura ? [...permission.gruposEscritura] : permission.gruposEscritura,
      })),
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
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
        noValidate
        autoComplete="off"
      >
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
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
            name="permisos"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <PermissionMatrix
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isSubmitting}
                    {...tablerosQuery}
                  />
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
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-border pt-4">
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
  return isHttpError(error) && [400, 422].includes(error.status) && error.details ? error.details : undefined;
}

// ─── Create ─────────────────────────────────────────────────────────────────────

function CreateDialog({
  open,
  onOpenChange,
  tablerosQuery,
}: Pick<CreateProps, 'open' | 'onOpenChange'> & { tablerosQuery: TablerosQueryState }) {
  const mutation = useCreateRol();
  const { acquire, release, isLocked, lockRef: submissionLock } = useSynchronousMutationLock();

  function handleSubmit(values: RolCreateInput) {
    if (!acquire()) return;
    mutation.mutate(values, {
      onSettled: (_data, error) => {
        release();
        if (!error) onOpenChange(false);
      },
    });
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && submissionLock.current) return;
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        overlayClassName="bg-black/50 backdrop-blur-none supports-[backdrop-filter]:backdrop-blur-none"
        className="flex min-h-0 max-h-[min(760px,calc(100dvh-2rem))] w-[calc(100%-1rem)] flex-col gap-5 overflow-hidden rounded-xl border bg-card p-5 text-card-foreground shadow-xl sm:w-[calc(100%-2rem)] sm:max-w-6xl"
      >
        <DialogHeader className="shrink-0">
          <DialogTitle>Nuevo rol</DialogTitle>
          <DialogDescription>
            Completa los datos para registrar un nuevo rol en el CRM.
          </DialogDescription>
        </DialogHeader>
        <RolForm
          onSubmit={handleSubmit}
          onCancel={() => handleOpenChange(false)}
          isSubmitting={mutation.isPending || isLocked}
          serverErrors={serverErrorsFromMutation(mutation.error)}
          submitLabel="Crear rol"
          tablerosQuery={tablerosQuery}
        />
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit ─────────────────────────────────────────────────────────────────────

function EditDialog({
  open,
  onOpenChange,
  rol,
  tablerosQuery,
}: Pick<EditProps, 'open' | 'onOpenChange' | 'rol'> & { tablerosQuery: TablerosQueryState }) {
  const mutation = useEditRol(rol.id);
  const { acquire, release, isLocked, lockRef: submissionLock } = useSynchronousMutationLock();

  function handleSubmit(values: RolCreateInput) {
    if (!acquire()) return;
    mutation.mutate(values, {
      onSettled: (_data, error) => {
        release();
        if (!error) onOpenChange(false);
      },
    });
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && submissionLock.current) return;
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        overlayClassName="bg-black/50 backdrop-blur-none supports-[backdrop-filter]:backdrop-blur-none"
        className="flex min-h-0 max-h-[min(760px,calc(100dvh-2rem))] w-[calc(100%-1rem)] flex-col gap-5 overflow-hidden rounded-xl border bg-card p-5 text-card-foreground shadow-xl sm:w-[calc(100%-2rem)] sm:max-w-6xl"
      >
        <DialogHeader className="shrink-0">
          <DialogTitle>Editar rol</DialogTitle>
          <DialogDescription>
            Modifica los datos de <strong>{rol.nombre}</strong>.
          </DialogDescription>
        </DialogHeader>
        <RolForm
          defaultValues={{ nombre: rol.nombre, descripcion: rol.descripcion ?? '', permisos: rol.permisos }}
          onSubmit={handleSubmit}
          onCancel={() => handleOpenChange(false)}
          isSubmitting={mutation.isPending || isLocked}
          serverErrors={serverErrorsFromMutation(mutation.error)}
          submitLabel="Guardar cambios"
          tablerosQuery={tablerosQuery}
        />
      </DialogContent>
    </Dialog>
  );
}

// ─── Componente público ───────────────────────────────────────────────────────

export function RolFormDialog(props: RolFormDialogProps) {
  const tablerosQueryResult = useTableros();
  const tablerosQuery: TablerosQueryState = {
    tableros: tablerosQueryResult.data ?? [],
    isLoading: tablerosQueryResult.isLoading,
    isError: tablerosQueryResult.isError,
    refetch: () => tablerosQueryResult.refetch(),
  };

  if (props.mode === 'create') {
    return <CreateDialog open={props.open} onOpenChange={props.onOpenChange} tablerosQuery={tablerosQuery} />;
  }
  return (
    <EditDialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      rol={props.rol}
      tablerosQuery={tablerosQuery}
    />
  );
}
