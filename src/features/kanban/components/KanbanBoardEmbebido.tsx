// KanbanBoardEmbebido — board autocontenido identificado por tableroId.
// Se embebe en cualquier página sin redirigir en errores (a diferencia de KanbanPage).
// Incluye loading/error propios, dialog "Asignar columna" y reutiliza KanbanBoard.

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { isHttpError } from '@/api/http-error';
import { useTablero } from '../hooks/useTablero';
import { useFichas } from '../hooks/useFichas';
import { useColumnas } from '../hooks/useColumnas';
import { useAsignarColumna } from '../hooks/useAsignarColumna';
import {
  asignarColumnaSchema,
  type AsignarColumnaFormValues,
} from '../schemas/columna.schema';
import { KanbanBoard } from './KanbanBoard';
import {
  estadoTrato as estadoTratoEnum,
  estadoTarea as estadoTareaEnum,
} from '../schemas/tablero.schema';
import type { TipoFicha } from '../schemas/ficha.schema';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface KanbanBoardEmbebidoProps {
  tableroId: string;
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function KanbanBoardEmbebido({ tableroId }: KanbanBoardEmbebidoProps) {
  const [asignarOpen, setAsignarOpen] = useState(false);
  const [columnaSeleccionada, setColumnaSeleccionada] = useState<string>('');

  const { data: tablero, isLoading, error } = useTablero(tableroId);
  const { data: fichas = [] } = useFichas();
  const { data: columnasCatalogo = [] } = useColumnas();
  const asignarMutation = useAsignarColumna();

  // Derivar tipoFicha desde tipoTablero del tablero
  const tipoTableroActual = tablero?.tipoTablero ?? 'TRATOS';
  const tipoFicha: TipoFicha = tipoTableroActual === 'TAREAS' ? 'TAREA' : 'TRATO';
  const esTareas = tipoTableroActual === 'TAREAS';

  const form = useForm<AsignarColumnaFormValues>({
    resolver: zodResolver(asignarColumnaSchema),
    defaultValues: {
      tipoTablero: 'TRATOS',
      limiteWip: 1,
      estadoTrato: undefined,
      estadoTarea: undefined,
      totalValorEstimado: 0,
    },
  });

  // Sincronizar tipoTablero en el form cuando el tablero carga
  useEffect(() => {
    if (!tablero) return;
    form.setValue('tipoTablero', tablero.tipoTablero);
    if (tablero.tipoTablero === 'TAREAS') {
      form.setValue('totalValorEstimado', 0);
    }
  }, [tablero, form]);

  // Fichas filtradas: por tipoFicha derivado del tipo de tablero + columnaId presente
  const columnaIds = new Set(tablero?.columnas.map((c) => c.id) ?? []);
  const fichasFiltradas = fichas.filter(
    (f) => f.tipoFicha === tipoFicha && columnaIds.has(f.columnaId),
  );

  function handleAsignarSubmit(values: AsignarColumnaFormValues) {
    if (!tablero || !columnaSeleccionada) return;

    const data =
      esTareas
        ? {
            limiteWip: values.limiteWip,
            estadoTarea: values.estadoTarea,
            totalValorEstimado: 0,
          }
        : {
            limiteWip: values.limiteWip,
            estadoTrato: values.estadoTrato,
            totalValorEstimado: values.totalValorEstimado,
          };

    asignarMutation.mutate(
      {
        tableroId: tablero.id,
        columnaId: columnaSeleccionada,
        data,
      },
      {
        onSuccess: () => {
          setAsignarOpen(false);
          setColumnaSeleccionada('');
          form.reset();
        },
        onError: (err) => {
          if (isHttpError(err) && err.status === 422 && err.details) {
            Object.entries(err.details).forEach(([field, message]) => {
              form.setError(field as keyof AsignarColumnaFormValues, {
                message: String(message),
              });
            });
          }
        },
      },
    );
  }

  // Estado de carga — sin redirect
  if (isLoading) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Cargando tablero...
      </p>
    );
  }

  // Error de red (cualquier error, incluyendo 404) — sin redirect
  if (error || !tablero) {
    return (
      <p className="text-sm text-destructive">
        No fue posible cargar el tablero.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Botón Asignar columna */}
      <div className="flex justify-end">
        <Button onClick={() => setAsignarOpen(true)}>
          Asignar columna
        </Button>
      </div>

      {/* Tablero Kanban o mensaje de sin columnas */}
      {tablero.columnas.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Este tablero no tiene columnas configuradas.
        </p>
      ) : (
        <KanbanBoard
          columnas={tablero.columnas}
          fichas={fichasFiltradas}
          tableroId={tablero.id}
          tipoFicha={tipoFicha}
        />
      )}

      {/* Dialog Asignar columna */}
      <Dialog open={asignarOpen} onOpenChange={setAsignarOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Asignar columna</DialogTitle>
            <DialogDescription>
              Selecciona una columna del catálogo y configura su límite WIP.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleAsignarSubmit)}
              className="space-y-4"
            >
              {/* Selector de columna del catálogo */}
              <div className="space-y-1.5">
                <label
                  htmlFor="columna-select"
                  className="text-sm font-medium leading-none"
                >
                  Columna
                </label>
                <Select
                  value={columnaSeleccionada}
                  onValueChange={setColumnaSeleccionada}
                >
                  <SelectTrigger id="columna-select" aria-label="Columna">
                    <SelectValue placeholder="Selecciona una columna" />
                  </SelectTrigger>
                  <SelectContent>
                    {columnasCatalogo.map((col) => (
                      <SelectItem key={col.id} value={col.id}>
                        {col.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Límite WIP */}
              <FormField
                control={form.control}
                name="limiteWip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="limiteWip">Límite WIP</FormLabel>
                    <FormControl>
                      <Input
                        id="limiteWip"
                        type="number"
                        min={1}
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        aria-label="Límite WIP"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Selector estado tarea — solo para tableros TAREAS */}
              {esTareas && (
                <FormField
                  control={form.control}
                  name="estadoTarea"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado de tarea</FormLabel>
                      <Select
                        value={field.value ?? ''}
                        onValueChange={(v) =>
                          field.onChange(
                            estadoTareaEnum.safeParse(v).success ? v : undefined,
                          )
                        }
                      >
                        <FormControl>
                          <SelectTrigger aria-label="Estado de tarea">
                            <SelectValue placeholder="Selecciona un estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                          <SelectItem value="EN_CURSO">En curso</SelectItem>
                          <SelectItem value="FINALIZADA">Finalizada</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Selector estado trato — solo para tableros TRATOS */}
              {!esTareas && (
                <FormField
                  control={form.control}
                  name="estadoTrato"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado de trato</FormLabel>
                      <Select
                        value={field.value ?? ''}
                        onValueChange={(v) =>
                          field.onChange(
                            estadoTratoEnum.safeParse(v).success ? v : undefined,
                          )
                        }
                      >
                        <FormControl>
                          <SelectTrigger aria-label="Estado de trato">
                            <SelectValue placeholder="Selecciona un estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ABIERTO">Abierto</SelectItem>
                          <SelectItem value="GANADO">Ganado</SelectItem>
                          <SelectItem value="PERDIDO">Perdido</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Total valor estimado — oculto para tableros TAREAS (siempre 0) */}
              {!esTareas && (
                <FormField
                  control={form.control}
                  name="totalValorEstimado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="totalValorEstimado">Total valor estimado</FormLabel>
                      <FormControl>
                        <Input
                          id="totalValorEstimado"
                          type="number"
                          min={0}
                          {...field}
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setAsignarOpen(false);
                    form.reset();
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={asignarMutation.isPending || !columnaSeleccionada}
                >
                  {asignarMutation.isPending ? 'Asignando...' : 'Asignar'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
