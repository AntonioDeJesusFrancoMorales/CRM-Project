import { useEffect, useRef } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
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
import { useEmpresas } from '@/features/empresas/hooks/useEmpresas';
import type { Contacto, EstadoRelacion } from '@/api/types';
import { useSynchronousMutationLock } from '@/components/shared/useSynchronousMutationLock';
import {
  contactoCreateSchema,
  contactoUpdateSchema,
  CONTACTO_EMPTY_DEFAULTS,
  type ContactoCreateInput,
} from '../schemas/contacto.schema';
import { ComoNosConocioInput } from './ComoNosConocioInput';
import { EstadoRelacionSelect } from './EstadoRelacionSelect';
import {
  DUPLICATE_CONTACTO_NAME_MESSAGE,
  hasDuplicateContactoName,
  mapContactoServerError,
} from '../lib/contactoValidation';
import { normalizeContactoValues } from '../lib/contactoValues';
import { SensitiveWriteNotice } from '@/features/permissions/components/PermissionState';

interface ContactoFormProps {
  mode: 'create' | 'edit';
  defaultValues?: Partial<ContactoCreateInput>;
  onSubmit: (values: ContactoCreateInput) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  serverErrors?: Array<{ field: string; message: string }>;
  existingContactos?: Contacto[];
  currentContactoId?: string;
  estadoActual?: EstadoRelacion;
}

export function ContactoForm({
  mode,
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  serverErrors,
  existingContactos,
  currentContactoId,
  estadoActual,
}: ContactoFormProps) {
  const { data: empresas, isLoading: empresasLoading } = useEmpresas();
  const { acquire, release } = useSynchronousMutationLock();
  const previousIsSubmitting = useRef(isSubmitting);

  const resolvedDefaults =
    mode === 'edit' && defaultValues ? defaultValues : CONTACTO_EMPTY_DEFAULTS;

  const resolver = zodResolver(
    mode === 'create' ? contactoCreateSchema : contactoUpdateSchema,
  ) as unknown as Resolver<ContactoCreateInput>;

  const form = useForm<ContactoCreateInput, unknown, ContactoCreateInput>({
    resolver,
    defaultValues: resolvedDefaults,
  });

  useEffect(() => {
    if (!serverErrors?.length) return;
    for (const serverError of serverErrors) {
      const mappedError = mapContactoServerError(serverError);
      if (mappedError.field) {
        form.setError(mappedError.field, { type: 'server', message: mappedError.message });
      }
    }
  }, [serverErrors, form]);

  useEffect(() => {
    if (previousIsSubmitting.current && !isSubmitting) release();
    previousIsSubmitting.current = isSubmitting;
  }, [isSubmitting, release]);

  function handleValidSubmit(values: ContactoCreateInput) {
    if (isSubmitting || !acquire()) return;

    const normalizedValues = normalizeContactoValues(values) as ContactoCreateInput;
    if (hasDuplicateContactoName(existingContactos, normalizedValues.nombre, currentContactoId)) {
      release();
      form.setError('nombre', {
        type: 'validate',
        message: DUPLICATE_CONTACTO_NAME_MESSAGE,
      });
      return;
    }

    onSubmit(normalizedValues);
  }

  const unmappedServerErrors = (serverErrors ?? [])
    .map(mapContactoServerError)
    .filter((serverError) => !serverError.field);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleValidSubmit)}
        className="space-y-4"
        noValidate
        autoComplete="off"
      >
        {unmappedServerErrors.map((serverError, index) => (
          <p
            key={`${serverError.message}-${index}`}
            role="alert"
            className="text-sm text-destructive"
          >
            {serverError.message}
          </p>
        ))}

        {/* nombre */}
        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="contacto-nombre">
                Nombre{' '}
                <span aria-hidden="true" className="text-destructive">
                  *
                </span>
              </FormLabel>
              <FormControl>
                <Input id="contacto-nombre" placeholder="Nombre" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* correo */}
        <SensitiveWriteNotice resource="CONTACTO" group="CONTACTO_PRIVADO">
          <FormField
            control={form.control}
            name="correo"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="contacto-correo">
                  Correo <span className="text-muted-foreground font-normal">(opcional)</span>
                </FormLabel>
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
        </SensitiveWriteNotice>

        {/* telefono */}
        <SensitiveWriteNotice resource="CONTACTO" group="CONTACTO_PRIVADO">
          <FormField
            control={form.control}
            name="telefono"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="contacto-telefono">
                  Teléfono <span className="text-muted-foreground font-normal">(opcional)</span>
                </FormLabel>
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
        </SensitiveWriteNotice>

        {/* cargo */}
        <FormField
          control={form.control}
          name="cargo"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="contacto-cargo">
                Cargo <span className="text-muted-foreground font-normal">(opcional)</span>
              </FormLabel>
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
                Empresa{' '}
                <span aria-hidden="true" className="text-destructive">
                  *
                </span>
              </FormLabel>
              <Select
                value={field.value ?? ''}
                onValueChange={(v) => field.onChange(v)}
                disabled={empresasLoading || mode === 'edit'}
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
              {mode === 'edit' && (
                <p className="text-xs text-muted-foreground">
                  La empresa vinculada no puede modificarse.
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* estadoRelacion — comparte las mismas reglas de transición que el detalle */}
        <FormField
          control={form.control}
          name="estadoRelacion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estado</FormLabel>
              <EstadoRelacionSelect
                actual={estadoActual ?? field.value}
                tieneTratosActivos={false}
                value={field.value}
                onChange={field.onChange}
                disabled={mode === 'create' || isSubmitting}
                aria-label="Estado de relación"
              />
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
              <FormLabel htmlFor="contacto-como-nos-conocio">
                ¿Cómo nos conoció?{' '}
                <span className="text-muted-foreground font-normal">(opcional)</span>
              </FormLabel>
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
