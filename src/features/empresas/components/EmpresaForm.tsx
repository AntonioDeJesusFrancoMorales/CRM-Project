import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Empresa } from '@/api/types';
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
import { useSynchronousMutationLock } from '@/components/shared/useSynchronousMutationLock';
import { normalizeEmpresaValues } from '../lib/empresaValues';
import {
  DUPLICATE_EMPRESA_NAME_MESSAGE,
  hasDuplicateEmpresaName,
  mapEmpresaServerError,
} from '../lib/empresaValidation';
import { empresaCreateSchema, type EmpresaCreateInput } from '../schemas/empresa.schema';
import { SensitiveWriteNotice } from '@/features/permissions/components/PermissionState';

interface EmpresaFormProps {
  mode: 'create' | 'edit';
  defaultValues?: Partial<EmpresaCreateInput>;
  onSubmit: (values: EmpresaCreateInput) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  serverErrors?: Array<{ field: string; message: string }>;
  existingEmpresas?: Empresa[];
  currentEmpresaId?: string;
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
  existingEmpresas,
  currentEmpresaId,
}: EmpresaFormProps) {
  const { acquire, release } = useSynchronousMutationLock();
  const previousIsSubmitting = useRef(isSubmitting);
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
    for (const serverError of serverErrors) {
      const mappedError = mapEmpresaServerError(serverError);
      if (mappedError.field) {
        form.setError(mappedError.field, { type: 'server', message: mappedError.message });
      }
    }
  }, [serverErrors, form]);

  useEffect(() => {
    if (previousIsSubmitting.current && !isSubmitting) {
      release();
    }
    previousIsSubmitting.current = isSubmitting;
  }, [isSubmitting, release]);

  function handleValidSubmit(values: EmpresaCreateInput) {
    if (isSubmitting || !acquire()) return;

    const normalizedValues = normalizeEmpresaValues(values) as EmpresaCreateInput;
    if (hasDuplicateEmpresaName(existingEmpresas, normalizedValues.nombre, currentEmpresaId)) {
      release();
      form.setError('nombre', {
        type: 'validate',
        message: DUPLICATE_EMPRESA_NAME_MESSAGE,
      });
      return;
    }

    onSubmit(normalizedValues);
  }

  const unmappedServerErrors = (serverErrors ?? [])
    .map(mapEmpresaServerError)
    .filter((serverError) => !serverError.field);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleValidSubmit)}
        className="space-y-5"
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

          <SensitiveWriteNotice resource="EMPRESA" group="CONTACTO_PRIVADO">
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
          </SensitiveWriteNotice>

          <SensitiveWriteNotice resource="EMPRESA" group="CONTACTO_PRIVADO">
            <FormField
              control={form.control}
              name="paginaWeb"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="empresa-pagina-web">
                    Página web <span className="font-normal text-muted-foreground">(opcional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      id="empresa-pagina-web"
                      type="url"
                      placeholder="www.ejemplo.com o https://ejemplo.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </SensitiveWriteNotice>

          <SensitiveWriteNotice resource="EMPRESA" group="CONTACTO_PRIVADO">
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
                      placeholder="https://facebook.com/empresa o @empresa"
                      maxLength={150}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </SensitiveWriteNotice>

          <SensitiveWriteNotice resource="EMPRESA" group="CONTACTO_PRIVADO">
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
                      placeholder="https://instagram.com/empresa o @empresa"
                      maxLength={150}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </SensitiveWriteNotice>

          <SensitiveWriteNotice resource="EMPRESA" group="CONTACTO_PRIVADO">
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
                      placeholder="https://x.com/empresa o @empresa"
                      maxLength={150}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </SensitiveWriteNotice>
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

        <SensitiveWriteNotice resource="EMPRESA" group="CONTACTO_PRIVADO">
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
        </SensitiveWriteNotice>

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
