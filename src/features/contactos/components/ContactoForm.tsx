import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
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
import { nullsToStrings } from '@/lib/form-utils';
import { useEmpresas } from '@/features/empresas/hooks/useEmpresas';
import {
  contactoCreateSchema,
  CONTACTO_EMPTY_DEFAULTS,
  type ContactoCreateInput,
} from '../schemas/contacto.schema';
import { ComoNosConocioInput } from './ComoNosConocioInput';

interface ContactoFormProps {
  mode: 'create' | 'edit';
  defaultValues?: Partial<ContactoCreateInput>;
  onSubmit: (values: ContactoCreateInput) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  serverErrors?: Array<{ field: string; message: string }>;
}

export function ContactoForm({
  mode,
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  serverErrors,
}: ContactoFormProps) {
  const { data: empresas, isLoading: empresasLoading } = useEmpresas();

  const resolvedDefaults =
    mode === 'edit' && defaultValues
      ? (nullsToStrings(defaultValues as Record<string, unknown>) as Partial<ContactoCreateInput>)
      : CONTACTO_EMPTY_DEFAULTS;

  const form = useForm<ContactoCreateInput, unknown, ContactoCreateInput>({
    resolver: zodResolver(contactoCreateSchema),
    defaultValues: resolvedDefaults,
  });

  useEffect(() => {
    if (!serverErrors?.length) return;
    for (const { field, message } of serverErrors) {
      form.setError(field as keyof ContactoCreateInput, { message });
    }
  }, [serverErrors, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>

        {/* nombre */}
        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="contacto-nombre">
                Nombre <span aria-hidden="true" className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input id="contacto-nombre" placeholder="Nombre" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* correo */}
        <FormField
          control={form.control}
          name="correo"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="contacto-correo">Correo</FormLabel>
              <FormControl>
                <Input
                  id="contacto-correo"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* telefono */}
        <FormField
          control={form.control}
          name="telefono"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="contacto-telefono">Teléfono</FormLabel>
              <FormControl>
                <Input
                  id="contacto-telefono"
                  placeholder="+52 55 1234 5678"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* cargo */}
        <FormField
          control={form.control}
          name="cargo"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="contacto-cargo">Cargo</FormLabel>
              <FormControl>
                <Input
                  id="contacto-cargo"
                  placeholder="Ej. Gerente de Compras"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* empresaId — requerido (@NotNull en el back) */}
        <FormField
          control={form.control}
          name="empresaId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Empresa <span aria-hidden="true" className="text-destructive">*</span>
              </FormLabel>
              <Select
                value={field.value ?? ''}
                onValueChange={(v) => field.onChange(v)}
                disabled={empresasLoading}
              >
                <FormControl>
                  <SelectTrigger aria-label="Empresa">
                    <SelectValue placeholder="Seleccionar empresa" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(empresas ?? []).map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* estadoRelacion — select básico en modo create (siempre PROSPECTO por defecto) */}
        <FormField
          control={form.control}
          name="estadoRelacion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estado</FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={mode === 'create'}
              >
                <FormControl>
                  <SelectTrigger aria-label="Estado de relación">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="PROSPECTO">Prospecto</SelectItem>
                  <SelectItem value="ACTIVO">Activo</SelectItem>
                  <SelectItem value="INACTIVO">Inactivo</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* comoNosConocio */}
        <FormField
          control={form.control}
          name="comoNosConocio"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="contacto-como-nos-conocio">¿Cómo nos conoció?</FormLabel>
              <FormControl>
                <ComoNosConocioInput
                  value={field.value}
                  onChange={(v) => field.onChange(v === '' ? null : v)}
                  onBlur={field.onBlur}
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
            {isSubmitting
              ? 'Guardando...'
              : mode === 'create'
                ? 'Crear contacto'
                : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
