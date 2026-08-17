// TareaForm — presentational compartido para create/edit.
// Prop tratoIdFijo?: cuando viene, el Select de trato viene PRECARGADO y disabled.
// Cuando no viene (creación global desde /tareas), el Select de trato es requerido y editable.
// Campo estado ausente: el estado se modifica solo con TareaEstadoMenu.
// Las opciones de tipo/prioridad usan enums del back (GENERAL/SEGUIMIENTO/… y BAJA/MEDIA/…).
// Homologa TratoForm (ADR-042).

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
import { DateTimePicker } from '@/components/ui/date-time-field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTratos } from '@/features/tratos/hooks/useTratos';
import { useUsuarios } from '@/features/usuarios/hooks/useUsuarios';
import {
  tareaCreateSchema,
  TAREA_EMPTY_DEFAULTS,
  TIPO_TAREA_OPTIONS,
  PRIORIDAD_OPTIONS,
  type TareaCreateInput,
} from '../schemas/tarea.schema';

const dialogInputClass =
  'no-spinner h-9 rounded-lg px-2.5 text-sm tabular-nums focus-visible:ring-3 focus-visible:ring-ring/50';

interface TareaFormProps {
  mode: 'create' | 'edit';
  defaultValues?: Partial<TareaCreateInput>;
  onSubmit: (values: TareaCreateInput) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  serverErrors?: Array<{ field: string; message: string }>;
  tratoIdFijo?: string;
}

export function TareaForm({
  mode,
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  serverErrors,
  tratoIdFijo,
}: TareaFormProps) {
  const { data: tratos, isLoading: tratosLoading } = useTratos();
  const { data: usuarios, isLoading: usuariosLoading } = useUsuarios();

  const resolvedDefaults: TareaCreateInput = {
    ...TAREA_EMPTY_DEFAULTS,
    ...(defaultValues ?? {}),
    // Si viene tratoIdFijo, lo fuerza en defaultValues
    ...(tratoIdFijo ? { tratoId: tratoIdFijo } : {}),
  };

  const form = useForm<TareaCreateInput>({
    resolver: zodResolver(tareaCreateSchema),
    defaultValues: resolvedDefaults,
  });

  useEffect(() => {
    if (!serverErrors?.length) return;
    for (const { field, message } of serverErrors) {
      form.setError(field as keyof TareaCreateInput, { message });
    }
  }, [serverErrors, form]);

  // Si tratoIdFijo viene fijo, asegura que el valor en el form esté seteado
  useEffect(() => {
    if (tratoIdFijo) {
      form.setValue('tratoId', tratoIdFijo);
    }
  }, [tratoIdFijo, form]);

  const tratoSeleccionado = tratos?.find((t) => t.id === (tratoIdFijo ?? form.watch('tratoId')));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3.5" noValidate autoComplete="off">

        {/* Select de Trato */}
        <FormField
          control={form.control}
          name="tratoId"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-1.5 space-y-0">
              <FormLabel>
                Trato{' '}
                <span aria-hidden="true" className="text-destructive">*</span>
              </FormLabel>
              {tratoIdFijo ? (
                // Modo fijo: select disabled con el trato prefijado
                <Select
                  value={tratoIdFijo}
                  disabled
                >
                  <FormControl>
                    <SelectTrigger className="h-9 w-full" aria-label="Trato">
                      <SelectValue>
                        {tratoSeleccionado?.nombre ?? tratoIdFijo}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {tratoSeleccionado && (
                      <SelectItem value={tratoIdFijo}>
                        {tratoSeleccionado.nombre}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              ) : (
                // Modo global: select editable y requerido
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ''}
                  disabled={tratosLoading}
                >
                  <FormControl>
                    <SelectTrigger className="h-9 w-full" aria-label="Trato">
                      <SelectValue
                        placeholder={tratosLoading ? 'Cargando tratos...' : 'Selecciona un trato'}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(tratos ?? []).map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Título */}
        <FormField
          control={form.control}
          name="titulo"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-1.5 space-y-0">
              <FormLabel>
                Título{' '}
                <span aria-hidden="true" className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  className={dialogInputClass}
                  placeholder="Ej: Llamada de seguimiento"
                  aria-label="Título"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Descripción */}
        <FormField
          control={form.control}
          name="descripcion"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-1.5 space-y-0">
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Input
                  className={dialogInputClass}
                  placeholder="Opcional"
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value || null)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          {/* Tipo */}
          <FormField
            control={form.control}
            name="tipo"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-1.5 space-y-0">
                <FormLabel>
                  Tipo <span aria-hidden="true" className="text-destructive">*</span>
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-9 w-full" aria-label="Tipo">
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TIPO_TAREA_OPTIONS.map((opt) => (
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

          {/* Prioridad */}
          <FormField
            control={form.control}
            name="prioridad"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-1.5 space-y-0">
                <FormLabel>
                  Prioridad <span aria-hidden="true" className="text-destructive">*</span>
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="h-9 w-full" aria-label="Prioridad">
                      <SelectValue placeholder="Selecciona la prioridad" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PRIORIDAD_OPTIONS.map((opt) => (
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
        </div>

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
                value={field.value}
                disabled={usuariosLoading}
              >
                <FormControl>
                  <SelectTrigger className="h-9 w-full" aria-label="Responsable">
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

        {/* Fecha límite */}
        <FormField
          control={form.control}
          name="fechaLimite"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-1.5 space-y-0">
              <FormLabel>
                Fecha límite{' '}
                <span aria-hidden="true" className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <DateTimePicker
                  value={field.value ?? null}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
                ? 'Crear tarea'
                : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
