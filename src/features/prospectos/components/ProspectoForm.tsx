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
  prospectoCreateSchema,
  type ProspectoCreateInput,
} from '../schemas/prospecto.schema';

// ADR-026: isLocked = true cuando el prospecto es 'convertido'.
// Todos los campos quedan disabled salvo 'notas'. Bloqueo exclusivamente client-side.
// ADR-029: useEmpresas() y useUsuarios() para los Selects.

interface ProspectoFormProps {
  mode: 'create' | 'edit';
  defaultValues?: Partial<ProspectoCreateInput>;
  isLocked?: boolean;
  onSubmit: (values: ProspectoCreateInput) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  serverErrors?: Array<{ field: string; message: string }>;
}

const EMPTY_DEFAULTS: ProspectoCreateInput = {
  nombre_contacto: '',
  empresa_id: '',
  responsable_id: '',
  correo_contacto: '',
  telefono_contacto: '',
  cargo_contacto: '',
  como_nos_conocio: undefined,
  estado_posible_cliente: 'frio',
  notas: '',
};

const COMO_NOS_CONOCIO_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'referido', label: 'Referido' },
  { value: 'redes_sociales', label: 'Redes sociales' },
  { value: 'busqueda', label: 'Búsqueda' },
  { value: 'evento', label: 'Evento' },
  { value: 'otro', label: 'Otro' },
];

export function ProspectoForm({
  mode,
  defaultValues,
  isLocked = false,
  onSubmit,
  onCancel,
  isSubmitting = false,
  serverErrors,
}: ProspectoFormProps) {
  const { data: empresas, isLoading: empresasLoading } = useEmpresas();
  const { data: usuarios, isLoading: usuariosLoading } = useUsuarios();

  const resolvedDefaults =
    mode === 'edit' && defaultValues
      ? (nullsToStrings(defaultValues as Record<string, unknown>) as Partial<ProspectoCreateInput>)
      : EMPTY_DEFAULTS;

  const form = useForm<ProspectoCreateInput, unknown, ProspectoCreateInput>({
    resolver: zodResolver(prospectoCreateSchema),
    defaultValues: resolvedDefaults,
  });

  useEffect(() => {
    if (!serverErrors?.length) return;
    for (const { field, message } of serverErrors) {
      form.setError(field as keyof ProspectoCreateInput, { message });
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
                <Input
                  placeholder="Nombre completo"
                  disabled={isLocked}
                  {...field}
                />
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
                disabled={isLocked || empresasLoading}
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
                disabled={isLocked || usuariosLoading}
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

        {/* estado_posible_cliente */}
        <FormField
          control={form.control}
          name="estado_posible_cliente"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estado</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isLocked}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un estado" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="frio">Frío</SelectItem>
                  <SelectItem value="tibio">Tibio</SelectItem>
                  <SelectItem value="caliente">Caliente</SelectItem>
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
                  disabled={isLocked}
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
                  disabled={isLocked}
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
                  disabled={isLocked}
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
                disabled={isLocked}
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

        {/* notas — SIEMPRE habilitado aunque isLocked (ADR-026) */}
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
                ? 'Crear prospecto'
                : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
