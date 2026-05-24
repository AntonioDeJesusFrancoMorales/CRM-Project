// ADR-043: Modal obligatorio motivo_perdida cuando se marca un trato como perdido.
// Único punto de entrada al endpoint PATCH /tratos/:id/perder.
// Validación Zod: motivo requerido, 1-2000 chars. Cancelar cierra sin acción.

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { isHttpError } from '@/api/http-error';
import { usePerderTrato } from '../hooks/usePerderTrato';

const perderSchema = z.object({
  motivo_perdida: z
    .string()
    .min(1, { message: 'El motivo de pérdida es requerido' })
    .max(2000, { message: 'El motivo no puede exceder 2000 caracteres' }),
});

type PerderInput = z.infer<typeof perderSchema>;

interface TratoPerderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tratoId: string;
  nombre: string;
}

export function TratoPerderDialog({
  open,
  onOpenChange,
  tratoId,
  nombre,
}: TratoPerderDialogProps) {
  const mutation = usePerderTrato();

  const form = useForm<PerderInput>({
    resolver: zodResolver(perderSchema),
    defaultValues: { motivo_perdida: '' },
  });

  // Reset al abrir/cerrar para que no quede texto de una sesión previa.
  useEffect(() => {
    if (open) form.reset({ motivo_perdida: '' });
  }, [open, form]);

  // Mapear errors 422 del backend a campo concreto.
  useEffect(() => {
    if (!isHttpError(mutation.error)) return;
    if (mutation.error.status !== 422) return;
    const details = mutation.error.details ?? [];
    for (const { field, message } of details) {
      if (field === 'motivo_perdida') {
        form.setError('motivo_perdida', { message });
      }
    }
  }, [mutation.error, form]);

  function handleSubmit(values: PerderInput) {
    mutation.mutate(
      { id: tratoId, motivo_perdida: values.motivo_perdida },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Marcar como perdido</DialogTitle>
          <DialogDescription>
            Indica el motivo por el cual <strong>{nombre}</strong> se marca como
            perdido. Este campo es obligatorio.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="motivo_perdida"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Motivo de pérdida{' '}
                    <span aria-hidden="true" className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <textarea
                      className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                      placeholder="Ej: precio fuera de presupuesto, eligió competidor, sin respuesta..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={mutation.isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Guardando...' : 'Marcar como perdido'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
