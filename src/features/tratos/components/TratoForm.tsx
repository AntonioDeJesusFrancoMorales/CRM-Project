// TratoForm — modelo unificado al contrato del back.
// Un único select Contacto (contactoId), select responsable (responsableId),
// select tipoContrato con 5 valores del back. Sin toggle XOR, sin campo estado.

import { useEffect, useRef } from 'react';
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
import { DatePicker } from '@/components/ui/date-time-field';
import { getMexicoCityToday } from '@/lib/date';
import { useSynchronousMutationLock } from '@/components/shared/useSynchronousMutationLock';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useContactos } from '@/features/contactos/hooks/useContactos';
import { useUsuarios } from '@/features/usuarios/hooks/useUsuarios';
import { SensitiveWriteNotice } from '@/features/permissions/components/PermissionState';
import {
  tratoSchema,
  TRATO_EMPTY_DEFAULTS,
  type TratoCreateInput,
} from '../schemas/trato.schema';

const TIPO_CONTRATO_OPTIONS: Array<{ value: 'SERVICIO' | 'LICENCIA' | 'SUSCRIPCION' | 'PERMANENTE' | 'OTRO'; label: string }> = [
  { value: 'SERVICIO', label: 'Servicio' },
  { value: 'LICENCIA', label: 'Licencia' },
  { value: 'SUSCRIPCION', label: 'Suscripción' },
  { value: 'PERMANENTE', label: 'Permanente' },
  { value: 'OTRO', label: 'Otro' },
];

const dialogInputClass =
  'no-spinner h-9 rounded-lg px-2.5 text-sm tabular-nums focus-visible:ring-3 focus-visible:ring-ring/50';

interface TratoFormProps {
  mode: 'create' | 'edit';
  defaultValues?: Partial<TratoCreateInput>;
  onSubmit: (values: TratoCreateInput) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  serverErrors?: Array<{ field: string; message: string }>;
}

export function TratoForm({
  mode,
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  serverErrors,
}: TratoFormProps) {
  const { acquire, release } = useSynchronousMutationLock();
  const previousIsSubmitting = useRef(isSubmitting);
  const { data: contactos = [], isLoading: contactosLoading } = useContactos();
  const { data: usuarios = [], isLoading: usuariosLoading } = useUsuarios();

  const resolvedDefaults: TratoCreateInput = {
    ...TRATO_EMPTY_DEFAULTS,
    ...(defaultValues ?? {}),
  };

  const form = useForm<TratoCreateInput>({
    resolver: zodResolver(tratoSchema),
    defaultValues: resolvedDefaults,
  });

  useEffect(() => {
    if (!serverErrors?.length) return;
    for (const { field, message } of serverErrors) {
      form.setError(field as keyof TratoCreateInput, { message });
    }
  }, [serverErrors, form]);

  useEffect(() => {
    if (previousIsSubmitting.current && !isSubmitting) {
      release();
    }
    previousIsSubmitting.current = isSubmitting;
  }, [isSubmitting, release]);

  function handleValidSubmit(values: TratoCreateInput) {
    const wasSubmitting = isSubmitting;
    const acquireRejected = wasSubmitting ? false : !acquire();
    const onSubmitForwarded = !wasSubmitting && !acquireRejected;

    if (!onSubmitForwarded) return;
    onSubmit(values);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleValidSubmit)}
        className="flex flex-col gap-3.5"
        noValidate
        autoComplete="off"
      >
        {/* Contacto (único select unificado) */}
        <FormField
          control={form.control}
          name="contactoId"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-1.5 space-y-0">
              <FormLabel>
                Contacto{' '}
                <span aria-hidden="true" className="text-destructive">*</span>
              </FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value ?? ''}
                disabled={contactosLoading || mode === 'edit'}
              >
                <FormControl>
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue
                      placeholder={contactosLoading ? 'Cargando contactos...' : 'Selecciona un contacto'}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {contactos.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {mode === 'edit' && (
                <p className="text-xs text-muted-foreground">
                  El contacto no se puede cambiar después de crear el trato.
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Nombre */}
        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-1.5 space-y-0">
              <FormLabel>
                Nombre del trato{' '}
                <span aria-hidden="true" className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input className={dialogInputClass} placeholder="Ej: Implementación CRM Innovatech" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Responsable */}
        <FormField
          control={form.control}
          name="responsableId"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-1.5 space-y-0">
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
                  <SelectTrigger className="h-9 w-full">
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

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          {/* Tipo de contrato */}
          <FormField
            control={form.control}
            name="tipoContrato"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-1.5 space-y-0">
                <FormLabel>Tipo de contrato <span className="text-muted-foreground font-normal">(opcional)</span></FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ''}
                >
                  <FormControl>
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TIPO_CONTRATO_OPTIONS.map((opt) => (
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

          {/* Valor estimado */}
          <SensitiveWriteNotice resource="TRATO" group="FINANCIERO">
            <FormField
              control={form.control}
              name="valorEstimado"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-1.5 space-y-0">
                  <FormLabel>
                    Valor estimado (MXN) <span className="text-muted-foreground font-normal">(opcional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      className={dialogInputClass}
                      type="number"
                      min={0}
                      step={1000}
                      placeholder="0"
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(e.target.value === '' ? null : Number(e.target.value))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </SensitiveWriteNotice>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          {/* Probabilidad */}
          <SensitiveWriteNotice resource="TRATO" group="FINANCIERO">
            <FormField
              control={form.control}
              name="probabilidad"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-1.5 space-y-0">
                  <FormLabel>
                    Probabilidad (%) <span className="text-muted-foreground font-normal">(opcional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      className={dialogInputClass}
                      type="number"
                      min={0}
                      max={100}
                      step={5}
                      placeholder="0 - 100"
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(e.target.value === '' ? null : Number(e.target.value))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </SensitiveWriteNotice>

          {/* Fecha cierre esperada */}
          <SensitiveWriteNotice resource="TRATO" group="FINANCIERO">
            <FormField
              control={form.control}
              name="fechaCierreEsperada"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-1.5 space-y-0">
                  <FormLabel>
                    Cierre esperado <span className="text-muted-foreground font-normal">(opcional)</span>
                  </FormLabel>
                  <FormControl>
                    <DatePicker
                      value={field.value ?? null}
                      onChange={field.onChange}
                      minDate={getMexicoCityToday()}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </SensitiveWriteNotice>
        </div>

        <div className="-mx-4 -mb-4 mt-1 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end">
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
                ? 'Crear trato'
                : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
