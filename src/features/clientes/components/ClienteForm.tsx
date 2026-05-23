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
import { useUsuarios } from '@/features/usuarios/hooks/useUsuarios';
import {
  clienteCreateSchema,
  CLIENTE_EMPTY_DEFAULTS,
  type ClienteCreateInput,
} from '../schemas/cliente.schema';

// ADR-035: ClienteForm es presentational y compartido entre ClienteCreateDialog
// y ClienteEditDialog. Un único source of truth de campos.

const COMO_NOS_CONOCIO_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'referido', label: 'Referido' },
  { value: 'redes_sociales', label: 'Redes sociales' },
  { value: 'busqueda', label: 'Búsqueda' },
  { value: 'evento', label: 'Evento' },
  { value: 'otro', label: 'Otro' },
];

interface ClienteFormProps {
  mode: 'create' | 'edit';
  defaultValues?: Partial<ClienteCreateInput>;
  onSubmit: (values: ClienteCreateInput) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  serverErrors?: Array<{ field: string; message: string }>;
}

export function ClienteForm({
  mode,
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  serverErrors,
}: ClienteFormProps) {
  const { data: empresas, isLoading: empresasLoading } = useEmpresas();
  const { data: usuarios, isLoading: usuariosLoading } = useUsuarios();

  const resolvedDefaults =
    mode === 'edit' && defaultValues
      ? (nullsToStrings(defaultValues as Record<string, unknown>) as Partial<ClienteCreateInput>)
      : CLIENTE_EMPTY_DEFAULTS;

  const form = useForm<ClienteCreateInput, unknown, ClienteCreateInput>({
    resolver: zodResolver(clienteCreateSchema),
    defaultValues: resolvedDefaults,
  });

  useEffect(() => {
    if (!serverErrors?.length) return;
    for (const { field, message } of serverErrors) {
      form.setError(field as keyof ClienteCreateInput, { message });
    }
  }, [serverErrors, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* nombre_contacto */}
        <FormField
          control={form.control}
          name="nombre_contacto"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Nombre del contacto{' '}
                <span aria-hidden="true" className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="Nombre completo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* empresa_id */}
        <FormField
          control={form.control}
          name="empresa_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Empresa{' '}
                <span aria-hidden="true" className="text-destructive">*</span>
              </FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={empresasLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={empresasLoading ? 'Cargando empresas...' : 'Selecciona una empresa'}
                    />
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

        {/* responsable_id */}
        <FormField
          control={form.control}
          name="responsable_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Responsable{' '}
                <span aria-hidden="true" className="text-destructive">*</span>
              </FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
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
                  {(usuarios ?? [])
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

        {/* correo_contacto */}
        <FormField
          control={form.control}
          name="correo_contacto"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo electrónico</FormLabel>
              <FormControl>
                <Input
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

        {/* telefono_contacto */}
        <FormField
          control={form.control}
          name="telefono_contacto"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teléfono</FormLabel>
              <FormControl>
                <Input
                  placeholder="+52 55 1234 5678"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* cargo_contacto */}
        <FormField
          control={form.control}
          name="cargo_contacto"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cargo</FormLabel>
              <FormControl>
                <Input
                  placeholder="Gerente, director, etc."
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* como_nos_conocio */}
        <FormField
          control={form.control}
          name="como_nos_conocio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>¿Cómo nos conoció?</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value ?? ''}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una opción" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {COMO_NOS_CONOCIO_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* notas */}
        <FormField
          control={form.control}
          name="notas"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas</FormLabel>
              <FormControl>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                  placeholder="Notas adicionales..."
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
            {isSubmitting
              ? 'Guardando...'
              : mode === 'create'
                ? 'Crear cliente'
                : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
