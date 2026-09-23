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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { nullsToStrings } from '@/lib/form-utils';
import { empresaCreateSchema, type EmpresaCreateInput } from '../schemas/empresa.schema';

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
  paginaWeb: '',
  facebook: '',
  instagram: '',
  twitter: '',
  estadoRelacion: 'PROSPECTO',
  notas: '',
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
      ? (nullsToStrings(defaultValues as Record<string, unknown>) as Partial<EmpresaCreateInput>)
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
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-5"
        noValidate
        autoComplete="off"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="nombre"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="empresa-nombre">
                  Nombre{' '}
                  <span aria-hidden="true" className="text-destructive">
                    *
                  </span>
                </FormLabel>
                <FormControl>
                  <Input
                    id="empresa-nombre"
                    placeholder="Nombre de la empresa"
                    maxLength={150}
                    {...field}
                  />
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
                <FormLabel htmlFor="empresa-sector">
                  Sector <span className="font-normal text-muted-foreground">(opcional)</span>
                </FormLabel>
                <FormControl>
                  <Input
                    id="empresa-sector"
                    placeholder="Ej. Tecnología, Salud..."
                    maxLength={80}
                    {...field}
                  />
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
                <FormLabel htmlFor="empresa-telefono">
                  Teléfono <span className="font-normal text-muted-foreground">(opcional)</span>
                </FormLabel>
                <FormControl>
                  <Input
                    id="empresa-telefono"
                    placeholder="+52 55 1234 5678"
                    maxLength={20}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="paginaWeb"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="empresa-pagina-web">
                  Sitio web <span className="font-normal text-muted-foreground">(opcional)</span>
                </FormLabel>
                <FormControl>
                  <Input
                    id="empresa-pagina-web"
                    type="url"
                    placeholder="https://ejemplo.com"
                    {...field}
                  />
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
                <FormLabel htmlFor="empresa-facebook">
                  Facebook <span className="font-normal text-muted-foreground">(opcional)</span>
                </FormLabel>
                <FormControl>
                  <Input
                    id="empresa-facebook"
                    placeholder="https://facebook.com/empresa"
                    maxLength={150}
                    {...field}
                  />
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
                <FormLabel htmlFor="empresa-instagram">
                  Instagram <span className="font-normal text-muted-foreground">(opcional)</span>
                </FormLabel>
                <FormControl>
                  <Input
                    id="empresa-instagram"
                    placeholder="https://instagram.com/empresa"
                    maxLength={150}
                    {...field}
                  />
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
                <FormLabel htmlFor="empresa-twitter">
                  Twitter / X <span className="font-normal text-muted-foreground">(opcional)</span>
                </FormLabel>
                <FormControl>
                  <Input
                    id="empresa-twitter"
                    placeholder="https://twitter.com/empresa"
                    maxLength={150}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="estadoRelacion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estado de relación</FormLabel>
              <Select value={field.value ?? 'PROSPECTO'} onValueChange={field.onChange}>
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

        <FormField
          control={form.control}
          name="notas"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="empresa-notas">
                Notas <span className="font-normal text-muted-foreground">(opcional)</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  id="empresa-notas"
                  placeholder="Notas internas sobre la empresa..."
                  maxLength={2000}
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-1">
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
