// KanbanPage — vista de un tablero Kanban concreto.
// Consume useTablero(id) + useFichas().
// Filtra fichas: solo tipoFicha === 'TRATO' cuyo columnaId esté en el tablero.
// 404 → toast + redirect a /tableros.
// Renderiza KanbanBoard con columnas y fichas del tablero.
// Batch 5: pasa tableroId al KanbanBoard + UI "Asignar columna" inline.

import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
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
import { KanbanBoard } from '../components/KanbanBoard';

export function KanbanPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [asignarOpen, setAsignarOpen] = useState(false);
  const [columnaSeleccionada, setColumnaSeleccionada] = useState<string>('');

  const { data: tablero, isLoading, error } = useTablero(id);
  const { data: fichas = [] } = useFichas();
  const { data: columnasCatalogo = [] } = useColumnas();
  const asignarMutation = useAsignarColumna();

  const form = useForm<AsignarColumnaFormValues>({
    resolver: zodResolver(asignarColumnaSchema),
    defaultValues: {
      limiteWip: 1,
      totalValorEstimado: 0,
    },
  });

  const is404 = isHttpError(error) && error.status === 404;

  // Redirect en caso de 404
  useEffect(() => {
    if (!is404) return;
    toast.error('El tablero no existe');
    void navigate('/tableros', { replace: true });
  }, [is404, navigate]);

  // Fichas filtradas: solo TRATO y columnaId presente en este tablero
  const columnaIds = new Set(tablero?.columnas.map((c) => c.id) ?? []);
  const fichasFiltradas = fichas.filter(
    (f) => f.tipoFicha === 'TRATO' && columnaIds.has(f.columnaId),
  );

  function handleAsignarSubmit(values: AsignarColumnaFormValues) {
    if (!tablero || !columnaSeleccionada) return;

    asignarMutation.mutate(
      {
        tableroId: tablero.id,
        columnaId: columnaSeleccionada,
        data: {
          limiteWip: values.limiteWip,
          estadoTrato: values.estadoTrato,
          totalValorEstimado: values.totalValorEstimado,
        },
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

  if (isLoading) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Cargando tablero...
      </p>
    );
  }

  if (is404) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        El tablero no existe. Volviendo al listado...
      </p>
    );
  }

  if (error || !tablero) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-sm text-destructive">No fue posible cargar el tablero.</p>
        <Button variant="outline" onClick={() => void navigate('/tableros')}>
          Volver al listado
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/tableros" aria-label="Volver al listado de tableros">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{tablero.nombre}</h1>
            {tablero.descripcion && (
              <p className="text-sm text-muted-foreground">{tablero.descripcion}</p>
            )}
          </div>
        </div>

        {/* Botón Asignar columna */}
        <Button onClick={() => setAsignarOpen(true)}>
          Asignar columna
        </Button>
      </header>

      {/* Tablero Kanban */}
      {tablero.columnas.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Este tablero no tiene columnas configuradas.
        </p>
      ) : (
        <KanbanBoard
          columnas={tablero.columnas}
          fichas={fichasFiltradas}
          tableroId={tablero.id}
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

              {/* Total valor estimado */}
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
