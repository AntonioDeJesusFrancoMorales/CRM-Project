// ColumnaCreateDialog — dialog "Nueva columna" para el board.
// Oculta el concepto catálogo: el usuario crea con nombre libre + color de paleta.
// Por detrás se invocan las dos llamadas (crear catálogo + asignar) vía
// useCrearColumnaEnTablero (orquestador de Fase 2).
// Bloqueo de duplicados client-side: nombre igual (trim + lowercase) → error en field,
// sin llamar a la API.
// Nota: totalValorEstimado NO se expone en la UI — es un valor DERIVADO (suma en runtime).
// Se envía siempre 0 al back (@NotNull); el back lo persiste pero el front lo ignora al leer.

import { useEffect } from 'react';
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
  columnaNuevaSchema,
  type ColumnaNuevaFormValues,
} from '../schemas/columna.schema';
import { ColorPaletteField } from './ColorPaletteField';
import { COLUMN_PALETTE } from '../lib/columnPalette';
import { useCrearColumnaEnTablero } from '../hooks/useCrearColumnaEnTablero';
import type { TipoTablero } from '../schemas/tablero.schema';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ColumnaCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableroId: string;
  tipoTablero: TipoTablero;
  /** Nombres ya existentes en el tablero (para bloqueo de duplicados client-side). */
  nombresExistentes: string[];
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function ColumnaCreateDialog({
  open,
  onOpenChange,
  tableroId,
  tipoTablero,
  nombresExistentes,
}: ColumnaCreateDialogProps) {
  const crearMutation = useCrearColumnaEnTablero();

  const form = useForm<ColumnaNuevaFormValues>({
    resolver: zodResolver(columnaNuevaSchema),
    defaultValues: {
      tipoTablero,
      nombre: '',
      color: COLUMN_PALETTE[0],
      limiteWip: 1,
      totalValorEstimado: 0,
    },
  });

  // Sincronizar tipoTablero cuando cambian las props
  useEffect(() => {
    form.setValue('tipoTablero', tipoTablero);
  }, [tipoTablero, form]);

  // Resetear el form al cerrar el dialog
  useEffect(() => {
    if (!open) {
      form.reset({
        tipoTablero,
        nombre: '',
        color: COLUMN_PALETTE[0],
        limiteWip: 1,
        totalValorEstimado: 0,
      });
    }
  }, [open, tipoTablero, form]);

  function handleSubmit(values: ColumnaNuevaFormValues) {
    // Bloqueo client-side de duplicados
    const nombreNorm = values.nombre.trim().toLowerCase();
    const hayDuplicado = nombresExistentes.some(
      (n) => n.trim().toLowerCase() === nombreNorm,
    );

    if (hayDuplicado) {
      form.setError('nombre', {
        message: 'Ya existe una columna con ese nombre en este tablero',
      });
      return;
    }

    // El discriminador tipoTablero NO se envía al back — construimos el payload.
    // totalValorEstimado se envía siempre 0: la columna nueva no tiene fichas y el valor
    // real es DERIVADO en runtime desde las fichas; el back lo requiere @NotNull.
    const asignacionData = {
      limiteWip: values.limiteWip,
      totalValorEstimado: 0 as const,
    };

    crearMutation.mutate(
      {
        columna: {
          nombre: values.nombre.trim(),
          color: values.color,
          tipoTablero,
          tipoColumna: 'PERSONALIZADA',
        },
        asignacion: {
          tableroId,
          ...asignacionData,
        },
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
        // onError: el hook ya emite el toast de error — el dialog queda abierto
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva columna</DialogTitle>
          <DialogDescription>
            Crea una columna nueva y agrégala a este tablero.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
            autoComplete="off"
          >
            {/* Nombre */}
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="columna-nombre">Nombre</FormLabel>
                  <FormControl>
                    <Input
                      id="columna-nombre"
                      placeholder="Ej: En revisión"
                      maxLength={80}
                      {...field}
                      aria-label="Nombre de la columna"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Color */}
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <ColorPaletteField
                      id="columna-color"
                      value={field.value}
                      onChange={field.onChange}
                      disabled={crearMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Límite WIP */}
            <FormField
              control={form.control}
              name="limiteWip"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="columna-limite-wip">Límite WIP</FormLabel>
                  <FormControl>
                    <Input
                      id="columna-limite-wip"
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

            {/* totalValorEstimado — NO se expone en la UI (valor derivado en runtime).
                El schema lo mantiene con default 0 para cumplir @NotNull del back. */}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={crearMutation.isPending}
              >
                {crearMutation.isPending ? 'Creando...' : 'Crear columna'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
