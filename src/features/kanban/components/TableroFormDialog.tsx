import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isHttpError } from '@/api/http-error';
import { useSynchronousMutationLock } from '@/components/shared/useSynchronousMutationLock';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCreateTablero } from '../hooks/useCreateTablero';
import { useUpdateTablero } from '../hooks/useUpdateTablero';
import {
  tableroCreateSchema,
  tableroEditSchema,
  type Tablero,
  type TableroCreateInput,
  type TableroEditInput,
} from '../schemas/tablero.schema';

type CreateProps = {
  mode: 'create';
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type EditProps = {
  mode: 'edit';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tablero: Tablero;
};

export type TableroFormDialogProps = CreateProps | EditProps;

function ServerError({ error, fallback }: { error: unknown; fallback: string }) {
  if (!error) return null;

  return (
    <p role="alert" className="text-sm text-destructive">
      {isHttpError(error) ? error.message : fallback}
    </p>
  );
}

function CreateDialog({ open, onOpenChange }: Omit<CreateProps, 'mode'>) {
  const mutation = useCreateTablero();
  const { acquire, release, isLocked, lockRef: submissionLock } = useSynchronousMutationLock();
  const form = useForm<TableroCreateInput>({
    resolver: zodResolver(tableroCreateSchema),
    defaultValues: {
      nombre: '',
      descripcion: '',
      tipoTablero: 'TRATOS',
    },
  });

  useEffect(() => {
    if (!open) return;
    mutation.reset();
    form.reset({ nombre: '', descripcion: '', tipoTablero: 'TRATOS' });
  }, [form, mutation.reset, open]);

  useEffect(() => {
    const error = mutation.error;
    if (!isHttpError(error) || error.status !== 422) return;

    for (const detail of error.details ?? []) {
      if (
        detail.field === 'nombre' ||
        detail.field === 'descripcion' ||
        detail.field === 'tipoTablero'
      ) {
        form.setError(detail.field, { message: detail.message });
      }
    }
  }, [form, mutation.error]);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && submissionLock.current) return;
    onOpenChange(nextOpen);
  }

  function handleSubmit(values: TableroCreateInput) {
    if (!acquire()) return;

    mutation.mutate(values, {
      onSettled: (_data, error) => {
        release();
        if (!error) handleOpenChange(false);
      },
    });
  }

  const isSubmitting = mutation.isPending || isLocked;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo tablero</DialogTitle>
          <DialogDescription>
            Crea un tablero adicional para organizar tratos o tareas. El backend agregará sus
            columnas iniciales.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      aria-label="Nombre del tablero"
                      maxLength={100}
                      placeholder="Ej: Pipeline comercial"
                      disabled={isSubmitting}
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
                    <Textarea
                      {...field}
                      aria-label="Descripción del tablero"
                      placeholder="Describe el propósito de este tablero"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tipoTablero"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de tablero</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger aria-label="Tipo de tablero">
                        <SelectValue placeholder="Selecciona un tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="TRATOS">Tratos</SelectItem>
                      <SelectItem value="TAREAS">Tareas</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <ServerError error={mutation.error} fallback="No fue posible crear el tablero." />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} aria-busy={mutation.isPending}>
                {mutation.isPending ? 'Creando...' : 'Crear tablero'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function EditDialog({ open, onOpenChange, tablero }: Omit<EditProps, 'mode'>) {
  const mutation = useUpdateTablero();
  const { acquire, release, isLocked, lockRef: submissionLock } = useSynchronousMutationLock();
  const form = useForm<TableroEditInput>({
    resolver: zodResolver(tableroEditSchema),
    defaultValues: {
      nombre: tablero.nombre,
      descripcion: tablero.descripcion ?? '',
    },
  });

  useEffect(() => {
    if (!open) return;
    mutation.reset();
    form.reset({ nombre: tablero.nombre, descripcion: tablero.descripcion ?? '' });
  }, [form, mutation.reset, open, tablero]);

  useEffect(() => {
    const error = mutation.error;
    if (!isHttpError(error) || error.status !== 422) return;

    for (const detail of error.details ?? []) {
      if (detail.field === 'nombre' || detail.field === 'descripcion') {
        form.setError(detail.field, { message: detail.message });
      }
    }
  }, [form, mutation.error]);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && submissionLock.current) return;
    onOpenChange(nextOpen);
  }

  function handleSubmit(values: TableroEditInput) {
    if (!acquire()) return;

    mutation.mutate(
      {
        id: tablero.id,
        data: {
          nombre: values.nombre,
          descripcion: values.descripcion.trim(),
        },
      },
      {
        onSettled: (_data, error) => {
          release();
          if (!error) handleOpenChange(false);
        },
      },
    );
  }

  const isSubmitting = mutation.isPending || isLocked;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar tablero</DialogTitle>
          <DialogDescription>
            Modifica el nombre y la descripción de <strong>{tablero.nombre}</strong>. El tipo de
            tablero no se puede cambiar.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      aria-label="Nombre del tablero"
                      maxLength={100}
                      disabled={isSubmitting}
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
                    <Textarea
                      {...field}
                      value={field.value ?? ''}
                      aria-label="Descripción del tablero"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div aria-label="Tipo de tablero" className="rounded-md bg-muted px-3 py-2 text-sm">
              <span className="font-medium">Tipo:</span> {tablero.tipoTablero}
            </div>

            <ServerError error={mutation.error} fallback="No fue posible actualizar el tablero." />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} aria-busy={mutation.isPending}>
                {mutation.isPending ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function TableroFormDialog(props: TableroFormDialogProps) {
  if (props.mode === 'create') {
    return <CreateDialog open={props.open} onOpenChange={props.onOpenChange} />;
  }

  return <EditDialog open={props.open} onOpenChange={props.onOpenChange} tablero={props.tablero} />;
}
