// ADR-042 D2: Form presentational shared create/edit con toggle Cliente/Prospecto.
// El toggle controla cuál Select aparece. Zod superRefine valida XOR a nivel schema.
// Patrón homologado con ClienteForm (ADR-035).

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
import { useClientes } from '@/features/clientes/hooks/useClientes';
import { useProspectos } from '@/features/prospectos/hooks/useProspectos';
import { useUsuarios } from '@/features/usuarios/hooks/useUsuarios';
import {
  tratoCreateSchema,
  TRATO_EMPTY_DEFAULTS,
  type TratoCreateInput,
} from '../schemas/trato.schema';

const TIPO_CONTRATO_OPTIONS: Array<{ value: 'precio_fijo' | 'tiempo_materiales' | 'retainer'; label: string }> = [
  { value: 'precio_fijo', label: 'Precio fijo' },
  { value: 'tiempo_materiales', label: 'Tiempo y materiales' },
  { value: 'retainer', label: 'Retainer' },
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
  const { data: clientes, isLoading: clientesLoading } = useClientes();
  const { data: prospectosAll, isLoading: prospectosLoading } = useProspectos();
  const { data: usuarios, isLoading: usuariosLoading } = useUsuarios();

  // Lote F (post-smoke fix #1): solo prospectos NO convertidos pueden recibir tratos
  // nuevos. Los convertidos ya pasaron a cliente; sus tratos nuevos van al cliente derivado.
  const prospectos = prospectosAll?.filter((p) => p.estado_posible_cliente !== 'convertido');

  const resolvedDefaults: TratoCreateInput = {
    ...TRATO_EMPTY_DEFAULTS,
    ...(defaultValues ?? {}),
  };

  const form = useForm<TratoCreateInput>({
    resolver: zodResolver(tratoCreateSchema),
    defaultValues: resolvedDefaults,
  });

  const asociacion = form.watch('asociacion');

  // Cuando el toggle cambia, limpiar el campo opuesto para que la validación XOR pase.
  useEffect(() => {
    if (asociacion === 'cliente') {
      form.setValue('prospecto_id', '');
    } else {
      form.setValue('cliente_id', '');
    }
  }, [asociacion, form]);

  useEffect(() => {
    if (!serverErrors?.length) return;
    for (const { field, message } of serverErrors) {
      form.setError(field as keyof TratoCreateInput, { message });
    }
  }, [serverErrors, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Toggle Cliente | Prospecto */}
        <FormField
          control={form.control}
          name="asociacion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Asociar a{' '}
                <span aria-hidden="true" className="text-destructive">*</span>
              </FormLabel>
              <div className="flex gap-2" role="radiogroup" aria-label="Asociar a">
                <Button
                  type="button"
                  variant={field.value === 'cliente' ? 'default' : 'outline'}
                  onClick={() => field.onChange('cliente')}
                  className="flex-1"
                  role="radio"
                  aria-checked={field.value === 'cliente'}
                >
                  Cliente
                </Button>
                <Button
                  type="button"
                  variant={field.value === 'prospecto' ? 'default' : 'outline'}
                  onClick={() => field.onChange('prospecto')}
                  className="flex-1"
                  role="radio"
                  aria-checked={field.value === 'prospecto'}
                >
                  Prospecto
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Select dependiente: cliente_id O prospecto_id */}
        {asociacion === 'cliente' ? (
          <FormField
            control={form.control}
            name="cliente_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Cliente{' '}
                  <span aria-hidden="true" className="text-destructive">*</span>
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ''}
                  disabled={clientesLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={clientesLoading ? 'Cargando clientes...' : 'Selecciona un cliente'}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(clientes ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nombre_contacto}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <FormField
            control={form.control}
            name="prospecto_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Prospecto{' '}
                  <span aria-hidden="true" className="text-destructive">*</span>
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ''}
                  disabled={prospectosLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={prospectosLoading ? 'Cargando prospectos...' : 'Selecciona un prospecto'}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(prospectos ?? []).map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nombre_contacto}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

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

        {/* Valor estimado */}
        <FormField
          control={form.control}
          name="valor_estimado"
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
          name="fecha_cierre_esperada"
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

        {/* Tipo de contrato */}
        <FormField
          control={form.control}
          name="tipo_contrato"
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
