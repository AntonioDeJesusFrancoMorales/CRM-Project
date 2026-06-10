import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isHttpError } from '@/api/http-error';
import type { Etiqueta, TipoEtiqueta } from '@/api/types';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  etiquetaCreateSchema,
  type EtiquetaCreateInput,
} from '../schemas/etiqueta.schema';
import { useCreateEtiqueta } from '../hooks/useCreateEtiqueta';
import { useEditEtiqueta } from '../hooks/useEditEtiqueta';

const DEFAULT_COLOR = '#3B82F6';

const tipoLabel: Record<TipoEtiqueta, string> = {
  TRATO: 'Trato',
  TAREA: 'Tarea',
};

type CreateProps = {
  mode: 'create';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Tipo preseleccionado (deriva del tab activo de la pantalla). */
  defaultTipo: TipoEtiqueta;
  etiqueta?: never;
};

type EditProps = {
  mode: 'edit';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  etiqueta: Etiqueta;
  defaultTipo?: never;
};

export type EtiquetaFormDialogProps = CreateProps | EditProps;

// ─── Campo de color reutilizable: swatch nativo + hex sincronizados ─────────────

function ColorField({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        aria-label="Selector de color"
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        className="h-9 w-12 shrink-0 cursor-pointer rounded border bg-transparent p-0.5"
      />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#RRGGBB"
        maxLength={7}
        className="font-mono"
      />
    </div>
  );
}

function serverErrorsFromMutation(error: unknown): Array<{ field: string; message: string }> | undefined {
  return isHttpError(error) && error.status === 422 && error.details ? error.details : undefined;
}

// ─── Create ─────────────────────────────────────────────────────────────────────

function CreateDialog({
  open,
  onOpenChange,
  defaultTipo,
}: Pick<CreateProps, 'open' | 'onOpenChange' | 'defaultTipo'>) {
  const mutation = useCreateEtiqueta();
  const form = useForm<EtiquetaCreateInput>({
    resolver: zodResolver(etiquetaCreateSchema),
    defaultValues: { nombre: '', tipoEtiqueta: defaultTipo, color: DEFAULT_COLOR },
  });

  // Re-sincroniza el tipo por defecto cuando cambia el tab y se reabre el diálogo.
  useEffect(() => {
    if (open) form.reset({ nombre: '', tipoEtiqueta: defaultTipo, color: DEFAULT_COLOR });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultTipo]);

  const serverErrors = serverErrorsFromMutation(mutation.error);
  useEffect(() => {
    if (!serverErrors?.length) return;
    for (const { field, message } of serverErrors) {
      form.setError(field as keyof EtiquetaCreateInput, { message });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverErrors]);

  function handleSubmit(values: EtiquetaCreateInput) {
    mutation.mutate(values, { onSuccess: () => onOpenChange(false) });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva etiqueta</DialogTitle>
          <DialogDescription>
            Creá una etiqueta de {tipoLabel[defaultTipo].toLowerCase()} para clasificar las fichas.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Nombre <span aria-hidden="true" className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre de la etiqueta" maxLength={50} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tipoEtiqueta"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Tipo <span aria-hidden="true" className="text-destructive">*</span>
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Elegí un tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="TRATO">Trato</SelectItem>
                      <SelectItem value="TAREA">Tarea</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Color <span aria-hidden="true" className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <ColorField value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Guardando...' : 'Crear etiqueta'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit ─────────────────────────────────────────────────────────────────────
// El tipo es INMUTABLE: se muestra como badge de solo lectura, no como campo editable.

function EditDialog({ open, onOpenChange, etiqueta }: Pick<EditProps, 'open' | 'onOpenChange' | 'etiqueta'>) {
  const mutation = useEditEtiqueta(etiqueta.id);
  // El edit solo manda nombre + color; reutilizamos el create schema sin el tipo.
  const form = useForm<{ nombre: string; color: string }>({
    resolver: zodResolver(etiquetaCreateSchema.pick({ nombre: true, color: true })),
    defaultValues: { nombre: etiqueta.nombre, color: etiqueta.color },
  });

  useEffect(() => {
    if (open) form.reset({ nombre: etiqueta.nombre, color: etiqueta.color });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, etiqueta.id]);

  const serverErrors = serverErrorsFromMutation(mutation.error);
  useEffect(() => {
    if (!serverErrors?.length) return;
    for (const { field, message } of serverErrors) {
      form.setError(field as 'nombre' | 'color', { message });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverErrors]);

  function handleSubmit(values: { nombre: string; color: string }) {
    mutation.mutate(values, { onSuccess: () => onOpenChange(false) });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar etiqueta</DialogTitle>
          <DialogDescription>
            Modificá <strong>{etiqueta.nombre}</strong>. El cambio se refleja en todas las fichas que la usan.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Nombre <span aria-hidden="true" className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre de la etiqueta" maxLength={50} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tipo inmutable — solo lectura. NO usa Form*: no está atado a un FormField
                (FormLabel/FormItem requieren contexto de FormField y romperían acá). */}
            <div className="space-y-2">
              <Label>Tipo</Label>
              <div>
                <Badge variant="outline">{tipoLabel[etiqueta.tipoEtiqueta]}</Badge>
                <p className="mt-1 text-xs text-muted-foreground">El tipo no se puede cambiar.</p>
              </div>
            </div>

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Color <span aria-hidden="true" className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <ColorField value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Componente público ───────────────────────────────────────────────────────

export function EtiquetaFormDialog(props: EtiquetaFormDialogProps) {
  if (props.mode === 'create') {
    return <CreateDialog open={props.open} onOpenChange={props.onOpenChange} defaultTipo={props.defaultTipo} />;
  }
  return <EditDialog open={props.open} onOpenChange={props.onOpenChange} etiqueta={props.etiqueta} />;
}
