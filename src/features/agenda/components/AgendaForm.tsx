// AgendaForm — presentational compartido para create/edit (CreateAgendaRequest === EditAgendaRequest).
// Campos: tipo (LLAMADA/REUNION), asunto, descripción, fecha, hora inicio/fin, ubicación,
// link de videollamada, vínculo opcional a trato/tarea, y recordatorio (toggle + minutos antes).
// El recordatorio lo DISPARA el back (scheduler); el front solo setea habilitado + minutosAntes.
// Homologa TareaForm.

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Bell, Phone, Video } from 'lucide-react';
import { cn } from '@/lib/utils';
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
import { DatePicker, TimeField } from '@/components/ui/date-time-field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTratos } from '@/features/tratos/hooks/useTratos';
import { useTareas } from '@/features/tareas/hooks/useTareas';
import {
  agendaCreateSchema,
  agendaEditSchema,
  AGENDA_EMPTY_DEFAULTS,
  TIPO_AGENDA_OPTIONS,
  type AgendaCreateInput,
} from '../schemas/agenda.schema';

interface AgendaFormProps {
  mode: 'create' | 'edit';
  defaultValues?: Partial<AgendaCreateInput>;
  onSubmit: (values: AgendaCreateInput) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  serverErrors?: Array<{ field: string; message: string }>;
}

const SIN_VINCULO = 'none';

export function AgendaForm({
  mode,
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  serverErrors,
}: AgendaFormProps) {
  const { data: tratos, isLoading: tratosLoading } = useTratos();
  const { data: tareas, isLoading: tareasLoading } = useTareas();

  const resolvedDefaults: AgendaCreateInput = {
    ...AGENDA_EMPTY_DEFAULTS,
    ...(defaultValues ?? {}),
  };

  const form = useForm<AgendaCreateInput>({
    resolver: zodResolver(mode === 'edit' ? agendaEditSchema : agendaCreateSchema),
    defaultValues: resolvedDefaults,
  });

  useEffect(() => {
    if (!serverErrors?.length) return;
    for (const { field, message } of serverErrors) {
      form.setError(field as keyof AgendaCreateInput, { message });
    }
  }, [serverErrors, form]);

  const tipo = form.watch('tipo');
  const recordatorioHabilitado = form.watch('recordatorioHabilitado');

  function handleValidSubmit(values: AgendaCreateInput) {
    onSubmit({
      ...values,
      asunto: values.asunto.trim(),
      ubicacion: values.tipo === 'REUNION' ? values.ubicacion : null,
      linkVideollamada:
        values.tipo === 'LLAMADA' ? values.linkVideollamada?.trim() ?? null : null,
      minutosAntes: values.recordatorioHabilitado ? values.minutosAntes : null,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleValidSubmit)} className="flex flex-col gap-3.5" noValidate autoComplete="off">
        {/* Tipo — dos cuadros seleccionables (uno u otro). Al cambiar de tipo se limpia
            el campo del otro (ubicación ↔ link) para no arrastrar datos del tipo anterior. */}
        <FormField
          control={form.control}
          name="tipo"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-1.5 space-y-0">
              <FormLabel>
                Tipo <span aria-hidden="true" className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Tipo">
                  {TIPO_AGENDA_OPTIONS.map((opt) => {
                    const selected = field.value === opt.value;
                    const Icono = opt.value === 'LLAMADA' ? Phone : Video;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        aria-label={opt.label}
                        onClick={() => {
                          field.onChange(opt.value);
                          // Limpia el campo que no aplica al nuevo tipo.
                          if (opt.value === 'LLAMADA') {
                            form.setValue('ubicacion', null);
                            form.clearErrors('ubicacion');
                          } else {
                            form.setValue('linkVideollamada', null);
                            form.clearErrors('linkVideollamada');
                          }
                        }}
                        className={cn(
                          'flex items-center justify-center gap-2 rounded-lg border p-3 text-sm outline-none transition-all focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
                          selected
                            ? 'border-primary bg-primary/10 font-medium text-primary ring-1 ring-primary/30'
                            : 'border-input bg-background text-muted-foreground hover:bg-muted hover:text-foreground dark:bg-input/30',
                        )}
                      >
                        <Icono className="h-5 w-5" aria-hidden="true" />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Asunto */}
        <FormField
          control={form.control}
          name="asunto"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-1.5 space-y-0">
              <FormLabel>
                Asunto <span aria-hidden="true" className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: Reunión de seguimiento"
                  aria-label="Asunto"
                  maxLength={200}
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
                <Textarea
                  placeholder="Opcional"
                  aria-label="Descripción"
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value || null)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Fecha */}
        <FormField
          control={form.control}
          name="fecha"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Fecha <span aria-hidden="true" className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <DatePicker value={field.value ?? null} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Horas inicio / fin */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="horaInicio"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-1.5 space-y-0">
                <FormLabel>
                  Inicio <span aria-hidden="true" className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <TimeField
                    label="Hora de inicio"
                    value={field.value ?? null}
                    onChange={(v) => field.onChange(v ?? '')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="horaFin"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-1.5 space-y-0">
                <FormLabel>Fin</FormLabel>
                <FormControl>
                  <TimeField
                    label="Hora de fin"
                    allowClear
                    value={field.value ?? null}
                    onChange={(v) => field.onChange(v || null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Ubicación — solo para REUNION (presencial), obligatoria. */}
        {tipo === 'REUNION' && (
          <FormField
            control={form.control}
            name="ubicacion"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-1.5 space-y-0">
                <FormLabel>
                  Ubicación <span aria-hidden="true" className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ej: Oficina central, sala 3"
                    aria-label="Ubicación"
                    maxLength={200}
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value || null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Link de videollamada — solo para LLAMADA (remota), obligatorio. */}
        {tipo === 'LLAMADA' && (
          <FormField
            control={form.control}
            name="linkVideollamada"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-1.5 space-y-0">
                <FormLabel>
                  Link de videollamada{' '}
                  <span aria-hidden="true" className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://..."
                    aria-label="Link de videollamada"
                    maxLength={500}
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value || null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Vínculo a trato (opcional) */}
        <FormField
          control={form.control}
          name="tratoId"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-1.5 space-y-0">
              <FormLabel>Trato relacionado <span className="font-normal text-muted-foreground">(opcional)</span></FormLabel>
              <Select
                onValueChange={(v) => field.onChange(v === SIN_VINCULO ? null : v)}
                value={field.value ?? SIN_VINCULO}
                disabled={tratosLoading}
              >
                <FormControl>
                  <SelectTrigger aria-label="Trato relacionado">
                    <SelectValue placeholder="Ninguno" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={SIN_VINCULO}>Ninguno</SelectItem>
                  {(tratos ?? []).map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Vínculo a tarea (opcional) */}
        <FormField
          control={form.control}
          name="tareaId"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-1.5 space-y-0">
              <FormLabel>Tarea relacionada <span className="font-normal text-muted-foreground">(opcional)</span></FormLabel>
              <Select
                onValueChange={(v) => field.onChange(v === SIN_VINCULO ? null : v)}
                value={field.value ?? SIN_VINCULO}
                disabled={tareasLoading}
              >
                <FormControl>
                  <SelectTrigger aria-label="Tarea relacionada">
                    <SelectValue placeholder="Ninguna" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={SIN_VINCULO}>Ninguna</SelectItem>
                  {(tareas ?? []).map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.titulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Recordatorio por email */}
        <FormField
          control={form.control}
          name="recordatorioHabilitado"
          render={({ field }) => (
            <FormItem className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Bell className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <FormLabel>Recordatorio por email</FormLabel>
                    <p className="text-xs text-muted-foreground">Recibe un aviso antes del evento.</p>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={field.value}
                  aria-label="Habilitar recordatorio por email"
                  onClick={() => {
                    const enabled = !field.value;
                    field.onChange(enabled);
                    if (!enabled) {
                      form.setValue('minutosAntes', null);
                      form.clearErrors('minutosAntes');
                    }
                  }}
                  className={cn(
                    'inline-flex h-6 w-11 shrink-0 items-center rounded-full border p-0.5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                    field.value
                      ? 'justify-end border-primary bg-primary'
                      : 'justify-start border-foreground/20 bg-foreground/30 dark:bg-foreground/35',
                  )}
                >
                  <span className="block h-5 w-5 rounded-full bg-white shadow-sm" />
                </button>
              </div>
              <FormField
                control={form.control}
                name="minutosAntes"
                render={({ field: minutesField }) => (
                  <FormItem className="flex flex-col gap-1.5 space-y-0">
                    <FormLabel>
                      Minutos antes <span aria-hidden="true" className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        className="no-spinner"
                        type="number"
                        min={1}
                        placeholder="Ej: 15"
                        aria-label="Minutos antes"
                        disabled={!recordatorioHabilitado}
                        value={minutesField.value ?? ''}
                        onChange={(e) =>
                          minutesField.onChange(e.target.value === '' ? null : Number(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="-mx-4 -mb-4 mt-1 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? 'Guardando...'
              : mode === 'create'
                ? 'Crear evento'
                : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
