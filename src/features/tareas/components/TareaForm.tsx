// TareaForm — presentational compartido para create/edit.
// Prop tratoIdFijo?: cuando viene, el Select de trato viene PRECARGADO y disabled.
// Cuando no viene (creación global desde /tareas), el Select de trato es requerido y editable.
// Campo estado ausente: el estado se modifica solo con TareaEstadoMenu.
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
  type TareaCreateInput,
} from '../schemas/tarea.schema';

const TIPO_TAREA_OPTIONS: Array<{ value: TareaCreateInput['tipo']; label: string }> = [
  { value: 'llamada', label: 'Llamada' },
  { value: 'reunion', label: 'Reunión' },
  { value: 'email', label: 'Email' },
  { value: 'demo', label: 'Demo' },
  { value: 'seguimiento', label: 'Seguimiento' },
];

const PRIORIDAD_OPTIONS: Array<{ value: 1 | 2 | 3; label: string }> = [
  { value: 1, label: 'Alta' },
  { value: 2, label: 'Media' },
  { value: 3, label: 'Baja' },
];

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
    ...(tratoIdFijo ? { trato_id: tratoIdFijo } : {}),
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
      form.setValue('trato_id', tratoIdFijo);
    }
  }, [tratoIdFijo, form]);

  const tratoSeleccionado = tratos?.find((t) => t.id === (tratoIdFijo ?? form.watch('trato_id')));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>

        {/* Select de Trato */}
        <FormField
          control={form.control}
          name="trato_id"
          render={({ field }) => (
            <FormItem>
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
                    <SelectTrigger aria-label="Trato">
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
                    <SelectTrigger aria-label="Trato">
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
            <FormItem>
              <FormLabel>
                Título{' '}
                <span aria-hidden="true" className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
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
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Input
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

        {/* Tipo */}
        <FormField
          control={form.control}
          name="tipo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Tipo{' '}
                <span aria-hidden="true" className="text-destructive">*</span>
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger aria-label="Tipo">
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
            <FormItem>
              <FormLabel>
                Prioridad{' '}
                <span aria-hidden="true" className="text-destructive">*</span>
              </FormLabel>
              <Select
                onValueChange={(v) => field.onChange(Number(v) as 1 | 2 | 3)}
                value={String(field.value)}
              >
                <FormControl>
                  <SelectTrigger aria-label="Prioridad">
                    <SelectValue placeholder="Selecciona la prioridad" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PRIORIDAD_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Responsable */}
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
                  <SelectTrigger aria-label="Responsable">
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
          name="fecha_limite"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha límite</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value || null)}
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
                ? 'Crear tarea'
                : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
