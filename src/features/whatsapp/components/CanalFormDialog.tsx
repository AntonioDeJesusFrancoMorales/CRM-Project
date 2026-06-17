import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEmpresas } from '@/features/empresas/hooks/useEmpresas';
import { canalSchema, type CanalFormValues } from '../schemas/canal.schema';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: CanalFormValues) => void;
  isLoading?: boolean;
  isEditing?: boolean;
}

export function CanalFormDialog({ open, onClose, onSubmit, isLoading, isEditing }: Props) {
  const { data: empresas = [] } = useEmpresas();

  const form = useForm<CanalFormValues>({
    resolver: zodResolver(canalSchema),
    defaultValues: { empresaId: '', nombre: '' },
  });

  useEffect(() => {
    if (open) form.reset({ empresaId: '', nombre: '' });
  }, [open, form]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar canal' : 'Nuevo canal WhatsApp'}</DialogTitle>
          {!isEditing && (
            <DialogDescription>
              Después de crear el canal podrás escanear el QR para conectar el número.
            </DialogDescription>
          )}
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {!isEditing && (
              <FormField control={form.control} name="empresaId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Empresa</FormLabel>
                  <Select value={field.value ?? ''} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar empresa..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {empresas.map((e) => (
                        <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            )}

            <FormField control={form.control} name="nombre" render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del canal</FormLabel>
                <FormControl>
                  <Input placeholder="WhatsApp Ventas" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Guardando...' : isEditing ? 'Guardar' : 'Crear y conectar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
