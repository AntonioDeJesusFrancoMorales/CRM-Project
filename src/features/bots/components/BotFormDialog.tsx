import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isHttpError } from '@/api/http-error';
import type { Bot } from '@/api/types';
import { useSynchronousMutationLock } from '@/components/shared/useSynchronousMutationLock';
import { useAllCanales } from '@/features/whatsapp/hooks/useCanales';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { botCreateSchema, type BotCreateInput } from '../schemas/bot.schema';
import { useCreateBot } from '../hooks/useCreateBot';
import { useEditBot } from '../hooks/useEditBot';

const TODOS_LOS_CANALES = '__TODOS__';

type CreateProps = {
  mode: 'create';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Se dispara con el bot recién creado para que el padre muestre el diálogo del token. */
  onCreated: (bot: Bot) => void;
  bot?: never;
};

type EditProps = {
  mode: 'edit';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bot: Bot;
  onCreated?: never;
};

export type BotFormDialogProps = CreateProps | EditProps;

function CanalSelectField({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const { data: canales } = useAllCanales();

  return (
    <Select
      value={value || TODOS_LOS_CANALES}
      onValueChange={(v) => onChange(v === TODOS_LOS_CANALES ? '' : v)}
    >
      <FormControl>
        <SelectTrigger>
          <SelectValue placeholder="Todos los canales" />
        </SelectTrigger>
      </FormControl>
      <SelectContent>
        <SelectItem value={TODOS_LOS_CANALES}>Todos los canales</SelectItem>
        {(canales ?? []).map((c) => (
          <SelectItem key={c.id} value={c.id}>
            {c.nombre}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function serverErrorsFromMutation(error: unknown): Array<{ field: string; message: string }> | undefined {
  return isHttpError(error) && error.status === 422 && error.details ? error.details : undefined;
}

function CreateDialog({
  open,
  onOpenChange,
  onCreated,
}: Pick<CreateProps, 'open' | 'onOpenChange' | 'onCreated'>) {
  const mutation = useCreateBot();
  const { acquire, release, isLocked, lockRef: submissionLock } = useSynchronousMutationLock();
  const form = useForm<BotCreateInput>({
    resolver: zodResolver(botCreateSchema),
    defaultValues: { nombre: '', canalId: '', webhookUrl: '' },
  });

  useEffect(() => {
    if (open) form.reset({ nombre: '', canalId: '', webhookUrl: '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const serverErrors = serverErrorsFromMutation(mutation.error);
  useEffect(() => {
    if (!serverErrors?.length) return;
    for (const { field, message } of serverErrors) {
      form.setError(field as keyof BotCreateInput, { message });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverErrors]);

  function handleSubmit(values: BotCreateInput) {
    if (!acquire()) return;
    mutation.mutate(values, {
      onSettled: (created, error) => {
        release();
        if (!error && created) {
          onOpenChange(false);
          onCreated(created);
        }
      },
    });
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && submissionLock.current) return;
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo bot</DialogTitle>
          <DialogDescription>
            Conectá un workflow de n8n. Al guardar te mostramos el token para pegarlo en el nodo
            de configuración del workflow.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Nombre <span aria-hidden="true" className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Agente principal" maxLength={100} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="canalId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Canal</FormLabel>
                  <CanalSelectField value={field.value ?? ''} onChange={field.onChange} />
                  <FormDescription>Si no elegís uno, el bot atiende todos los canales.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="webhookUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Webhook URL <span aria-hidden="true" className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="https://n8n.tudominio.com/webhook/..." {...field} />
                  </FormControl>
                  <FormDescription>
                    La Production URL del nodo Webhook del workflow de n8n.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={mutation.isPending || isLocked}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending || isLocked}>
                {mutation.isPending ? 'Guardando...' : 'Crear bot'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function EditDialog({ open, onOpenChange, bot }: Pick<EditProps, 'open' | 'onOpenChange' | 'bot'>) {
  const mutation = useEditBot(bot.id);
  const { acquire, release, isLocked, lockRef: submissionLock } = useSynchronousMutationLock();
  const form = useForm<BotCreateInput>({
    resolver: zodResolver(botCreateSchema),
    defaultValues: { nombre: bot.nombre, canalId: bot.canalId ?? '', webhookUrl: bot.webhookUrl },
  });

  useEffect(() => {
    if (open) form.reset({ nombre: bot.nombre, canalId: bot.canalId ?? '', webhookUrl: bot.webhookUrl });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, bot.id]);

  const serverErrors = serverErrorsFromMutation(mutation.error);
  useEffect(() => {
    if (!serverErrors?.length) return;
    for (const { field, message } of serverErrors) {
      form.setError(field as keyof BotCreateInput, { message });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverErrors]);

  function handleSubmit(values: BotCreateInput) {
    if (!acquire()) return;
    mutation.mutate(values, {
      onSettled: (_data, error) => {
        release();
        if (!error) onOpenChange(false);
      },
    });
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && submissionLock.current) return;
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar bot</DialogTitle>
          <DialogDescription>
            Modificá <strong>{bot.nombre}</strong>. El token no cambia al editar.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Nombre <span aria-hidden="true" className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Agente principal" maxLength={100} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="canalId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Canal</FormLabel>
                  <CanalSelectField value={field.value ?? ''} onChange={field.onChange} />
                  <FormDescription>Si no elegís uno, el bot atiende todos los canales.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="webhookUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Webhook URL <span aria-hidden="true" className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="https://n8n.tudominio.com/webhook/..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={mutation.isPending || isLocked}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending || isLocked}>
                {mutation.isPending ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function BotFormDialog(props: BotFormDialogProps) {
  if (props.mode === 'create') {
    return <CreateDialog open={props.open} onOpenChange={props.onOpenChange} onCreated={props.onCreated} />;
  }
  return <EditDialog open={props.open} onOpenChange={props.onOpenChange} bot={props.bot} />;
}
