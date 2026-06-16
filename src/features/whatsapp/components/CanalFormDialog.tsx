import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { CanalWhatsapp } from '@/api/types';
import { canalSchema, type CanalFormValues } from '../schemas/canal.schema';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: CanalFormValues) => void;
  isLoading?: boolean;
  initial?: CanalWhatsapp | null;
}

export function CanalFormDialog({ open, onClose, onSubmit, isLoading, initial }: Props) {
  const form = useForm<CanalFormValues>({
    resolver: zodResolver(canalSchema),
    defaultValues: { nombre: '', instanceName: '', apiUrl: '', apiKey: '' },
  });

  useEffect(() => {
    if (open && initial) {
      form.reset({
        nombre: initial.nombre,
        instanceName: initial.instanceName,
        apiUrl: initial.apiUrl,
        apiKey: '',
      });
    } else if (open) {
      form.reset({ nombre: '', instanceName: '', apiUrl: '', apiKey: '' });
    }
  }, [open, initial, form]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? 'Editar canal' : 'Nuevo canal WhatsApp'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="nombre" render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl><Input placeholder="WhatsApp Principal" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="instanceName" render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre de instancia</FormLabel>
                <FormControl><Input placeholder="mi-instancia" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="apiUrl" render={({ field }) => (
              <FormItem>
                <FormLabel>URL de Evolution API</FormLabel>
                <FormControl><Input placeholder="https://evolution.miservidor.com" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="apiKey" render={({ field }) => (
              <FormItem>
                <FormLabel>API Key{initial ? ' (dejar vacío para no cambiar)' : ''}</FormLabel>
                <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Guardando...' : initial ? 'Guardar' : 'Crear'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
