// TratoForm — modelo unificado al contrato del back.
// Un único select Contacto (contactoId), select responsable (responsableId),
// select tipoContrato con 5 valores del back. Sin toggle XOR, sin campo estado.

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
import { useContactos } from '@/features/contactos/hooks/useContactos';
import { useUsuarios } from '@/features/usuarios/hooks/useUsuarios';
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Contacto (único select unificado) */}
        <FormField
          control={form.control}
          name="contactoId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Contacto{' '}
                <span aria-hidden="true" className="text-destructive">*</span>
              </FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value ?? ''}
                disabled={contactosLoading}
              >
                <FormControl>
                  <SelectTrigger>
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
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Nombre */}
        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Nombre del trato{' '}
                <span aria-hidden="true" className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="Ej: Demo CTO Acme" {...field} />
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
            <FormItem>
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
                  <SelectTrigger>
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

        {/* Tipo de contrato */}
        <FormField
          control={form.control}
          name="tipoContrato"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de contrato</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value ?? ''}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tipo" />
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
        <FormField
          control={form.control}
          name="valorEstimado"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor estimado (MXN)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  step={1000}
                  placeholder="50000"
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

        {/* Probabilidad */}
        <FormField
          control={form.control}
          name="probabilidad"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Probabilidad (%)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={5}
                  placeholder="70"
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

        {/* Fecha cierre esperada */}
        <FormField
          control={form.control}
          name="fechaCierreEsperada"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha de cierre esperada</FormLabel>
              <FormControl>
                <Input
                  type="date"
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
                ? 'Crear trato'
                : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
