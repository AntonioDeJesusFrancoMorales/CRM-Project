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
import { nullsToStrings } from '@/lib/form-utils';
import {
  empresaCreateSchema,
  type EmpresaCreateInput,
} from '../schemas/empresa.schema';

interface EmpresaFormProps {
  mode: 'create' | 'edit';
  defaultValues?: Partial<EmpresaCreateInput>;
  onSubmit: (values: EmpresaCreateInput) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  serverErrors?: Array<{ field: string; message: string }>;
}

const EMPTY_DEFAULTS: EmpresaCreateInput = {
  nombre: '',
  sector: '',
  telefono: '',
  pagina_web: '',
  facebook: '',
  instagram: '',
  twitter: '',
};

export function EmpresaForm({
  mode,
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  serverErrors,
}: EmpresaFormProps) {
  const resolvedDefaults =
    mode === 'edit' && defaultValues
      ? nullsToStrings(defaultValues as Record<string, unknown>) as Partial<EmpresaCreateInput>
      : EMPTY_DEFAULTS;

  const form = useForm<EmpresaCreateInput, unknown, EmpresaCreateInput>({
    resolver: zodResolver(empresaCreateSchema),
    defaultValues: resolvedDefaults,
  });

  useEffect(() => {
    if (!serverErrors?.length) return;
    for (const { field, message } of serverErrors) {
      form.setError(field as keyof EmpresaCreateInput, { message });
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
                Nombre <span aria-hidden="true" className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="Nombre de la empresa" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sector"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sector</FormLabel>
              <FormControl>
                <Input placeholder="Ej. Tecnología, Salud..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="telefono"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teléfono</FormLabel>
              <FormControl>
                <Input placeholder="+52 55 1234 5678" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="pagina_web"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sitio Web</FormLabel>
              <FormControl>
                <Input placeholder="https://ejemplo.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="facebook"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Facebook</FormLabel>
              <FormControl>
                <Input placeholder="https://facebook.com/empresa" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="instagram"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Instagram</FormLabel>
              <FormControl>
                <Input placeholder="https://instagram.com/empresa" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="twitter"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Twitter / X</FormLabel>
              <FormControl>
                <Input placeholder="https://twitter.com/empresa" {...field} />
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
                ? 'Crear empresa'
                : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
