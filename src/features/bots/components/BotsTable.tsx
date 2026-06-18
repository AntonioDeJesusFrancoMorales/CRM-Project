import { useState } from 'react';
import { Copy, Pencil, Power, PowerOff, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Bot } from '@/api/types';
import { useAllCanales } from '@/features/whatsapp/hooks/useCanales';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useDeleteBot } from '../hooks/useDeleteBot';
import { useToggleBotActivo } from '../hooks/useToggleBotActivo';

interface Props {
  bots: Bot[];
  onEdit: (bot: Bot) => void;
}

function maskToken(token: string): string {
  return `${token.slice(0, 8)}${'•'.repeat(16)}`;
}

export function BotsTable({ bots, onEdit }: Props) {
  const { data: canales } = useAllCanales();
  const deleteMut = useDeleteBot();
  const toggleMut = useToggleBotActivo();
  const [deleteTarget, setDeleteTarget] = useState<Bot | null>(null);

  const canalMap = Object.fromEntries((canales ?? []).map((c) => [c.id, c.nombre]));

  async function handleCopyToken(bot: Bot) {
    await navigator.clipboard.writeText(bot.apiAccessToken);
    toast.success('Token copiado');
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Canal</TableHead>
            <TableHead>Webhook</TableHead>
            <TableHead>Token</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="w-32" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {bots.map((bot) => (
            <TableRow key={bot.id}>
              <TableCell className="font-medium">{bot.nombre}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {bot.canalId ? canalMap[bot.canalId] ?? bot.canalId : 'Todos los canales'}
              </TableCell>
              <TableCell className="max-w-[220px] truncate text-xs text-muted-foreground" title={bot.webhookUrl}>
                {bot.webhookUrl}
              </TableCell>
              <TableCell>
                <button
                  type="button"
                  onClick={() => void handleCopyToken(bot)}
                  className="inline-flex items-center gap-1 rounded font-mono text-xs text-muted-foreground hover:text-foreground"
                  title="Copiar token completo"
                >
                  {maskToken(bot.apiAccessToken)}
                  <Copy className="h-3 w-3" aria-hidden="true" />
                </button>
              </TableCell>
              <TableCell>
                <Badge variant={bot.activo ? 'default' : 'secondary'}>
                  {bot.activo ? 'Activo' : 'Inactivo'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={toggleMut.isPending}
                        onClick={() => toggleMut.mutate({ id: bot.id, activar: !bot.activo })}
                      >
                        {bot.activo ? (
                          <PowerOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Power className="h-4 w-4 text-primary" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{bot.activo ? 'Desactivar' : 'Activar'}</TooltipContent>
                  </Tooltip>
                  <Button variant="ghost" size="icon" onClick={() => onEdit(bot)} aria-label="Editar">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(bot)} aria-label="Eliminar">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar bot?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && (
                <>
                  Se eliminará <strong>{deleteTarget.nombre}</strong> y su token dejará de funcionar.
                  El workflow de n8n no podrá responder hasta que conectes otro bot.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMut.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMut.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (deleteTarget) deleteMut.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
              }}
            >
              {deleteMut.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
