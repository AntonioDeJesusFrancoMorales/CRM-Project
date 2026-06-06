// FichaForm — formulario presentacional para crear una ficha (TRATO o TAREA).
// Generalizado en Batch 4: tipoFicha discrimina el label/placeholder del selector.
// El campo se llama 'entidadId' (genérico); el padre (FichaCreateDialog) mapea
// entidadId → tratoId / tareaId según tipoFicha al enviar al back.
// Items (tratos o tareas sin ficha, ya mapeados a {id,label}) son pasados por el padre.
// FichaForm ya NO importa useTratosSinFicha directamente.
// responsableId NO existe en CreateFichaRequest — el back infiere el actor del JWT (ActorContext).
// Homologa el patrón de TratoForm: rhf + zodResolver + serverErrors 422 via setError.

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TipoFicha } from '@/features/kanban/schemas/ficha.schema';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type ItemSinFicha = { id: string; label: string };

// ---------------------------------------------------------------------------
// Schema — campo genérico 'entidadId' (tratoId o tareaId según tipoFicha)
// ---------------------------------------------------------------------------

export const fichaFormSchema = z.object({
  entidadId: z.string().min(1, 'Selecciona un trato'),
});

export type FichaFormValues = z.infer<typeof fichaFormSchema>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface FichaFormProps {
  columnaId: string;
  tipoFicha: TipoFicha;
  items: ItemSinFicha[];
  itemsLoading?: boolean;
  onSubmit: (values: FichaFormValues) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  serverErrors?: Array<{ field: string; message: string }>;
}

// ---------------------------------------------------------------------------
// Helpers — label y placeholder dinámicos por tipoFicha
// ---------------------------------------------------------------------------

function resolveEntityLabel(tipoFicha: TipoFicha): string {
  return tipoFicha === 'TAREA' ? 'Tarea' : 'Trato';
}

function resolveEntityPlaceholder(tipoFicha: TipoFicha, loading: boolean): string {
  if (loading) return tipoFicha === 'TAREA' ? 'Cargando tareas...' : 'Cargando tratos...';
  return tipoFicha === 'TAREA' ? 'Selecciona una tarea' : 'Selecciona un trato';
}

// Error message for the entidadId field also needs to reflect the type
function resolveEntitySchema(tipoFicha: TipoFicha) {
  const msg = tipoFicha === 'TAREA' ? 'Selecciona una tarea' : 'Selecciona un trato';
  return z.object({
    entidadId: z.string().min(1, msg),
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FichaForm({
  columnaId,
  tipoFicha,
  items,
  itemsLoading = false,
  onSubmit,
  onCancel,
  isSubmitting = false,
  serverErrors,
}: FichaFormProps) {
  const schema = resolveEntitySchema(tipoFicha);

  const form = useForm<FichaFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      entidadId: '',
    },
  });

  // Map 422 server errors to form fields — same pattern as TratoForm
  useEffect(() => {
    if (!serverErrors?.length) return;
    for (const { field, message } of serverErrors) {
      form.setError(field as keyof FichaFormValues, { message });
    }
  }, [serverErrors, form]);

  const entityLabel = resolveEntityLabel(tipoFicha);
  const entityPlaceholder = resolveEntityPlaceholder(tipoFicha, itemsLoading);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* columnaId — read-only display (not editable by user) */}
        <div>
          <p className="text-sm font-medium text-muted-foreground">Columna</p>
          <p className="text-sm">{columnaId}</p>
        </div>

        {/* entidadId — selector de tratos o tareas sin ficha */}
        <FormField
          control={form.control}
          name="entidadId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {entityLabel}{' '}
                <span aria-hidden="true" className="text-destructive">*</span>
              </FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value ?? ''}
                disabled={itemsLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={entityPlaceholder} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {items.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Crear ficha'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
