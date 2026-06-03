// ColumnaEditDialog — dialog "Editar columna" del board kanban.
// Precarga nombre y color actuales de la columna.
// Bloqueo de duplicados client-side: compara contra nombresExistentes (excluye la propia).
// Color legacy: si el color actual no está en la paleta, se muestra como swatch adicional
// en ColorPaletteField (via prop legacyColor). El usuario puede mantenerlo o elegir otro.
// Submit: useUpdateColumna.mutate({ id, data: { nombre, color } }).
// onSuccess → cierra el dialog. onError → queda abierto (el hook emite el toast).

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
import { z } from 'zod';
import type { ColumnaTablero } from '@/features/kanban/schemas/tablero.schema';
import { ColorPaletteField } from './ColorPaletteField';
import { useUpdateColumna } from '../hooks/useUpdateColumna';

// ---------------------------------------------------------------------------
// Schema interno del form — nombre + color (hex cualquiera)
// ---------------------------------------------------------------------------

const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;

const editFormSchema = z.object({
  nombre: z
    .string()
    .min(1, 'El nombre es obligatorio')
    .max(80, 'El nombre no puede superar los 80 caracteres'),
  color: z
    .string()
    .regex(HEX_REGEX, 'El color debe ser un valor hexadecimal válido (#RRGGBB)'),
});

type EditFormValues = z.infer<typeof editFormSchema>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ColumnaEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Columna a editar — se precarga nombre y color actuales. */
  columna: ColumnaTablero;
  /**
   * Nombres de las OTRAS columnas del tablero (excluye la columna en edición).
   * Se usa para bloquear duplicados client-side.
   */
  nombresExistentes: string[];
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function ColumnaEditDialog({
  open,
  onOpenChange,
  columna,
  nombresExistentes,
}: ColumnaEditDialogProps) {
  const updateMutation = useUpdateColumna();

  const colorInicial = columna.color ?? '#94a3b8';
  const nombreInicial = columna.nombre ?? '';

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      nombre: nombreInicial,
      color: colorInicial,
    },
  });

  // Sincronizar valores cuando cambia la columna (p.ej. se abre el dialog de otra columna)
  useEffect(() => {
    if (open) {
      form.reset({
        nombre: columna.nombre ?? '',
        color: columna.color ?? '#94a3b8',
      });
    }
  }, [open, columna, form]);

  function handleSubmit(values: EditFormValues) {
    // Bloqueo client-side de duplicados (excluyendo la propia columna)
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

    updateMutation.mutate(
      {
        id: columna.id,
        data: {
          nombre: values.nombre.trim(),
          color: values.color,
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
          <DialogTitle>Editar columna</DialogTitle>
          <DialogDescription>
            Modificá el nombre y el color de esta columna.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            {/* Nombre */}
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="columna-edit-nombre">Nombre</FormLabel>
                  <FormControl>
                    <Input
                      id="columna-edit-nombre"
                      placeholder="Nombre de la columna"
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
                    {/* legacyColor: color inicial de la columna (fijo), para mostrarlo como swatch
                        extra si no está en la paleta. Es independiente de field.value (color actual). */}
                    <ColorPaletteField
                      id="columna-edit-color"
                      value={field.value}
                      onChange={field.onChange}
                      disabled={updateMutation.isPending}
                      legacyColor={colorInicial}
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
                onClick={() => onOpenChange(false)}
                disabled={updateMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
