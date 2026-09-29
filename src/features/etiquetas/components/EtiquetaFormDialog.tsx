import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isHttpError } from '@/api/http-error';
import type { Etiqueta, TipoEtiqueta } from '@/api/types';
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

// Paleta curada de colores para etiquetas (hex #RRGGBB MAYÚS, como normaliza el back).
// DEFAULT_COLOR debe estar en la paleta para que arranque preseleccionado.
const PALETTE = [
  '#EF4444', '#F59E0B', '#EAB308', '#22C55E',
  '#10B981', '#06B6D4', '#3B82F6', '#6366F1',
  '#8B5CF6', '#EC4899', '#64748B', '#78716C',
] as const;

const DEFAULT_COLOR = '#3B82F6';
const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

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

// ─── Campo de color: paleta de swatches + hex opcional para custom ──────────────
// Reemplaza el <input type="color"> nativo (UI inconsistente entre SO/navegadores)
// por una paleta curada on-brand. El hex de abajo permite un color fuera de la paleta.

function ColorField({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const normalized = (value ?? '').toUpperCase();
  const validHex = HEX_RE.test(normalized);

  return (
    <div className="space-y-3">
      {/* Paleta de swatches */}
      <div className="flex flex-wrap gap-2">
        {PALETTE.map((c) => {
          const selected = normalized === c;
          return (
            <button
              key={c}
              type="button"
              onClick={() => onChange(c)}
              aria-label={`Color ${c}`}
              aria-pressed={selected}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full ring-offset-2 ring-offset-background transition',
                selected ? 'ring-2 ring-ring' : 'hover:scale-110',
              )}
              style={{ backgroundColor: c }}
            >
              {selected && <Check className="h-4 w-4 text-white drop-shadow" aria-hidden="true" />}
            </button>
          );
        })}
      </div>

      {/* Hex personalizado (color fuera de la paleta) */}
      <div className="flex items-center gap-2">
        <span
          className="h-7 w-7 shrink-0 rounded-md border"
          style={validHex ? { backgroundColor: normalized } : undefined}
          aria-hidden="true"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          placeholder="#RRGGBB"
          maxLength={7}
          className="font-mono"
          aria-label="Color personalizado (hex)"
        />
      </div>
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
  const { acquire, release, isLocked, lockRef: submissionLock } = useSynchronousMutationLock();
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
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={mutation.isPending || isLocked}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending || isLocked}>
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
  const { acquire, release, isLocked, lockRef: submissionLock } = useSynchronousMutationLock();
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
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={mutation.isPending || isLocked}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending || isLocked}>
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
