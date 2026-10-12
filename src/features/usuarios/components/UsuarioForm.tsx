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
import { useRoles } from '@/features/roles/hooks/useRoles';
import { SensitiveWriteNotice } from '@/features/permissions/components/PermissionState';
import {
  usuarioCreateSchema,
  usuarioUpdateSchema,
  type UsuarioCreateInput,
  type UsuarioUpdateInput,
} from '../schemas/usuario.schema';

// ─── Tipos de props ───────────────────────────────────────────────────────────

type CreateModeProps = {
  mode: 'create';
  defaultValues?: Partial<UsuarioCreateInput>;
  onSubmit: (values: UsuarioCreateInput) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  serverErrors?: Array<{ field: string; message: string }>;
};

type EditModeProps = {
  mode: 'edit';
  defaultValues?: Partial<UsuarioUpdateInput>;
  onSubmit: (values: UsuarioUpdateInput) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  serverErrors?: Array<{ field: string; message: string }>;
};

export type UsuarioFormProps = CreateModeProps | EditModeProps;

// ─── CreateForm ───────────────────────────────────────────────────────────────

function CreateForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  serverErrors,
}: Omit<CreateModeProps, 'mode'>) {
  const { data: roles = [], isLoading: rolesLoading } = useRoles();

  const form = useForm<UsuarioCreateInput>({
    resolver: zodResolver(usuarioCreateSchema),
    defaultValues: {
      nombre: '',
      correo: '',
      rolId: '',
      initialPassword: '',
      ...(defaultValues ?? {}),
    },
  });

  useEffect(() => {
    if (!serverErrors?.length) return;
    for (const { field, message } of serverErrors) {
      form.setError(field as keyof UsuarioCreateInput, { message });
    }
  }, [serverErrors, form]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex min-h-0 flex-1 flex-col"
        noValidate
        autoComplete="off"
      >
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-1">
          {/* Nombre completo */}
          <FormField
            control={form.control}
            name="nombre"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel>
                  Nombre completo{' '}
                  <span aria-hidden="true" className="text-destructive">
                    *
                  </span>
                </FormLabel>
                <FormControl>
                  <Input className="h-9" placeholder="Nombre completo del usuario" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Correo electrónico */}
          <SensitiveWriteNotice resource="USUARIO" group="CONTACTO_PRIVADO">
            <FormField
              control={form.control}
              name="correo"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel>
                    Correo electrónico{' '}
                    <span aria-hidden="true" className="text-destructive">
                      *
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="h-9"
                      type="email"
                      placeholder="correo@ejemplo.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </SensitiveWriteNotice>

          {/* Rol — select dinámico */}
          <FormField
            control={form.control}
            name="rolId"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel>
                  Rol{' '}
                  <span aria-hidden="true" className="text-destructive">
                    *
                  </span>
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ''}
                  disabled={rolesLoading}
                >
                  <FormControl>
                    <SelectTrigger className="h-9" aria-label="Rol">
                      <SelectValue
                        placeholder={rolesLoading ? 'Cargando roles...' : 'Selecciona un rol'}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {roles.map((rol) => (
                      <SelectItem key={rol.id} value={rol.id}>
                        {rol.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Asignar un rol distinto puede requerir USUARIO.ADMINISTRAR y puede ser rechazado
                  por el backend con 403.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Contraseña inicial */}
          <FormField
            control={form.control}
            name="initialPassword"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel>
                  Contraseña inicial{' '}
                  <span aria-hidden="true" className="text-destructive">
                    *
                  </span>
                </FormLabel>
                <FormControl>
                  <Input
                    className="h-9"
                    type="password"
                    placeholder="Contraseña temporal del usuario"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="!mt-6 flex shrink-0 justify-end gap-2 border-t border-border pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Crear usuario'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// ─── EditForm ─────────────────────────────────────────────────────────────────

function EditForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  serverErrors,
}: Omit<EditModeProps, 'mode'>) {
  const { data: roles = [], isLoading: rolesLoading } = useRoles();

  const form = useForm<UsuarioUpdateInput>({
    resolver: zodResolver(usuarioUpdateSchema),
    defaultValues: {
      nombre: '',
      correo: '',
      rolId: '',
      ...(defaultValues ?? {}),
    },
  });

  useEffect(() => {
    if (!serverErrors?.length) return;
    for (const { field, message } of serverErrors) {
      form.setError(field as keyof UsuarioUpdateInput, { message });
    }
  }, [serverErrors, form]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex min-h-0 flex-1 flex-col"
        noValidate
        autoComplete="off"
      >
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-1">
          {/* Nombre completo */}
          <FormField
            control={form.control}
            name="nombre"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel>
                  Nombre completo{' '}
                  <span aria-hidden="true" className="text-destructive">
                    *
                  </span>
                </FormLabel>
                <FormControl>
                  <Input className="h-9" placeholder="Nombre completo del usuario" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Correo electrónico */}
          <SensitiveWriteNotice resource="USUARIO" group="CONTACTO_PRIVADO">
            <FormField
              control={form.control}
              name="correo"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel>
                    Correo electrónico{' '}
                    <span aria-hidden="true" className="text-destructive">
                      *
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="h-9"
                      type="email"
                      placeholder="correo@ejemplo.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </SensitiveWriteNotice>

          {/* Rol — select dinámico */}
          <FormField
            control={form.control}
            name="rolId"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel>
                  Rol{' '}
                  <span aria-hidden="true" className="text-destructive">
                    *
                  </span>
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ''}
                  disabled={rolesLoading}
                >
                  <FormControl>
                    <SelectTrigger className="h-9" aria-label="Rol">
                      <SelectValue
                        placeholder={rolesLoading ? 'Cargando roles...' : 'Selecciona un rol'}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {roles.map((rol) => (
                      <SelectItem key={rol.id} value={rol.id}>
                        {rol.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Asignar un rol distinto puede requerir USUARIO.ADMINISTRAR y puede ser rechazado
                  por el backend con 403.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="!mt-6 flex shrink-0 justify-end gap-2 border-t border-border pt-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// ─── Componente público ───────────────────────────────────────────────────────

export function UsuarioForm(props: UsuarioFormProps) {
  if (props.mode === 'create') {
    return (
      <CreateForm
        defaultValues={props.defaultValues}
        onSubmit={props.onSubmit}
        onCancel={props.onCancel}
        isSubmitting={props.isSubmitting}
        serverErrors={props.serverErrors}
      />
    );
  }
  return (
    <EditForm
      defaultValues={props.defaultValues}
      onSubmit={props.onSubmit}
      onCancel={props.onCancel}
      isSubmitting={props.isSubmitting}
      serverErrors={props.serverErrors}
    />
  );
}
