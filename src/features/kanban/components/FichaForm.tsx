// FichaForm — formulario presentacional para crear una ficha de tipo TRATO.
// Expone solo los campos editables por el usuario: tratoId (selector de tratos sin ficha)
// y responsableId (selector de usuarios activos). El columnaId se muestra como dato
// read-only (lo inyecta el dialog — no es editable por el usuario).
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
import { useTratosSinFicha } from '../lib/useTratosSinFicha';
import type { Trato } from '@/api/types';
import { useUsuarios } from '@/features/usuarios/hooks/useUsuarios';

// ---------------------------------------------------------------------------
// Schema — solo campos que el usuario ingresa
// ---------------------------------------------------------------------------

export const fichaFormSchema = z.object({
  tratoId: z.string().min(1, 'Selecciona un trato'),
  responsableId: z.string().min(1, 'Selecciona un responsable'),
});

export type FichaFormValues = z.infer<typeof fichaFormSchema>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface FichaFormProps {
  columnaId: string;
  onSubmit: (values: FichaFormValues) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  serverErrors?: Array<{ field: string; message: string }>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FichaForm({
  columnaId,
  onSubmit,
  onCancel,
  isSubmitting = false,
  serverErrors,
}: FichaFormProps) {
  const { data: tratosSinFichaRaw, isLoading: tratosLoading } = useTratosSinFicha();
  const tratosSinFicha: Trato[] = tratosSinFichaRaw ?? [];
  const { data: usuarios = [], isLoading: usuariosLoading } = useUsuarios();

  const form = useForm<FichaFormValues>({
    resolver: zodResolver(fichaFormSchema),
    defaultValues: {
      tratoId: '',
      responsableId: '',
    },
  });

  // Map 422 server errors to form fields — same pattern as TratoForm
  useEffect(() => {
    if (!serverErrors?.length) return;
    for (const { field, message } of serverErrors) {
      form.setError(field as keyof FichaFormValues, { message });
    }
  }, [serverErrors, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* columnaId — read-only display (not editable by user) */}
        <div>
          <p className="text-sm font-medium text-muted-foreground">Columna</p>
          <p className="text-sm">{columnaId}</p>
        </div>

        {/* Trato — selector de tratos sin ficha */}
        <FormField
          control={form.control}
          name="tratoId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Trato{' '}
                <span aria-hidden="true" className="text-destructive">*</span>
              </FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value ?? ''}
                disabled={tratosLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={tratosLoading ? 'Cargando tratos...' : 'Selecciona un trato'}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {tratosSinFicha.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Responsable — selector de usuarios activos */}
        <FormField
          control={form.control}
          name="responsableId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Responsable{' '}
                <span aria-hidden="true" className="text-destructive">*</span>
              </FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value ?? ''}
                disabled={usuariosLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={usuariosLoading ? 'Cargando responsables...' : 'Selecciona un responsable'}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {usuarios
                    .filter((u) => u.activo)
                    .map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.nombre}
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
