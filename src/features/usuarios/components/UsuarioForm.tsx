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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { nullsToStrings, stringsToNulls } from '@/lib/form-utils';
import {
  usuarioCreateSchema,
  usuarioUpdateSchema,
  type UsuarioCreateInput,
} from '../schemas/usuario.schema';

interface UsuarioFormProps {
  mode: 'create' | 'edit';
  defaultValues?: Partial<UsuarioCreateInput>;
  onSubmit: (values: UsuarioCreateInput) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  serverErrors?: Array<{ field: string; message: string }>;
  /**
   * Cuando true, el Select de rol_sistema se renderiza deshabilitado con Tooltip.
   * Solo aplica en mode='edit' (ADR-013, ADR-017).
   */
  isOwnAccount?: boolean;
}

const EMPTY_DEFAULTS: UsuarioCreateInput = {
  nombre: '',
  correo: '',
  rol_sistema: 'usuario',
  rol_empresa: '',
};

export function UsuarioForm({
  mode,
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  serverErrors,
  isOwnAccount = false,
}: UsuarioFormProps) {
  const resolvedDefaults =
    mode === 'edit' && defaultValues
      ? (nullsToStrings(defaultValues as Record<string, unknown>) as Partial<UsuarioCreateInput>)
      : EMPTY_DEFAULTS;

  const form = useForm<UsuarioCreateInput, unknown, UsuarioCreateInput>({
    resolver: zodResolver(mode === 'create' ? usuarioCreateSchema : usuarioUpdateSchema),
    defaultValues: resolvedDefaults,
  });

  useEffect(() => {
    if (!serverErrors?.length) return;
    for (const { field, message } of serverErrors) {
      form.setError(field as keyof UsuarioCreateInput, { message });
    }
  }, [serverErrors, form]);

  function handleSubmit(values: UsuarioCreateInput) {
    onSubmit(stringsToNulls(values as Record<string, unknown>) as UsuarioCreateInput);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-4"
        noValidate
      >
        {/* Nombre completo */}
        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Nombre completo{' '}
                <span aria-hidden="true" className="text-destructive">
                  *
                </span>
              </FormLabel>
              <FormControl>
                <Input placeholder="Nombre completo del usuario" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Correo electrónico */}
        <FormField
          control={form.control}
          name="correo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Correo electrónico{' '}
                <span aria-hidden="true" className="text-destructive">
                  *
                </span>
              </FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Rol del sistema — ADR-015: Select via FormField + Controller */}
        <FormField
          control={form.control}
          name="rol_sistema"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Rol del sistema{' '}
                <span aria-hidden="true" className="text-destructive">
                  *
                </span>
              </FormLabel>
              {isOwnAccount && mode === 'edit' ? (
                // ADR-017: bloqueo inline, no extraído a helper
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un rol" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="usuario">Usuario</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>No puedes cambiar tu propio rol</TooltipContent>
                </Tooltip>
              ) : (
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un rol" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="usuario">Usuario</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Rol en la empresa */}
        <FormField
          control={form.control}
          name="rol_empresa"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rol en la empresa</FormLabel>
              <FormControl>
                <Input
                  placeholder="Vendedor, gerente, soporte, etc."
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
                ? 'Crear usuario'
                : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
