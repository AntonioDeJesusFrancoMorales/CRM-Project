import { useState } from 'react';
import { Pencil, Trash2, Plus, Wifi, WifiOff, QrCode, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { CanalWhatsapp, Empresa } from '@/api/types';
import { CanalFormDialog } from './CanalFormDialog';
import { ConectarCanalDialog } from './ConectarCanalDialog';
import { useCreateCanal } from '../hooks/useCreateCanal';
import { useEditCanal } from '../hooks/useEditCanal';
import { useDeleteCanal } from '../hooks/useDeleteCanal';
import { useSyncChats } from '../hooks/useSyncChats';
import { useConectarCanal } from '../hooks/useConectarCanal';
import type { CanalFormValues } from '../schemas/canal.schema';

interface Props {
  canales: CanalWhatsapp[];
  empresas: Empresa[];
}

export function CanalesTable({ canales, empresas }: Props) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CanalWhatsapp | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [conectando, setConectando] = useState<CanalWhatsapp | null>(null);

  const createMut = useCreateCanal();
  const editMut = useEditCanal();
  const deleteMut = useDeleteCanal();
  const syncMut = useSyncChats();
  // Vive en el padre (no dentro del dialog) y se dispara de forma imperativa
  // en los handlers de click, nunca desde un useEffect: React StrictMode
  // monta/desmonta/remonta componentes en dev, y disparar la conexión desde
  // un efecto deja la mutation colgada para siempre (el observer interno de
  // useMutation se desincroniza del fetch real durante ese ciclo).
  const conectarMut = useConectarCanal();

  const empresaMap = Object.fromEntries(empresas.map((e) => [e.id, e.nombre]));

  function handleConectar(canal: CanalWhatsapp) {
    setConectando(canal);
    conectarMut.mutate(canal.id);
  }

  function handleSubmit(values: CanalFormValues) {
    if (editing) {
      editMut.mutate(
        { id: editing.id, payload: { nombre: values.nombre, instanceName: editing.instanceName, apiUrl: editing.apiUrl, apiKey: '' } },
        { onSuccess: () => { setEditing(null); setFormOpen(false); } },
      );
    } else {
      createMut.mutate(
        { empresaId: values.empresaId ?? '', nombre: values.nombre, instanceName: '', proveedor: 'EVOLUTION_API', apiUrl: '', apiKey: '' },
        {
          onSuccess: (created) => {
            setFormOpen(false);
            handleConectar(created);
          },
        },
      );
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Nuevo canal
        </Button>
      </div>

      {canales.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">
          No hay canales configurados. Crea uno con el botón de arriba.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Instancia</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-28" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {canales.map((canal) => (
              <TableRow key={canal.id}>
                <TableCell className="font-medium">{canal.nombre}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {empresaMap[canal.empresaId] ?? canal.empresaId}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{canal.instanceName}</TableCell>
                <TableCell>
                  {canal.estado === 'ACTIVO' && (
                    <Badge variant="default"><Wifi className="h-3 w-3 mr-1" />Activo</Badge>
                  )}
                  {canal.estado === 'DESCONECTADO' && (
                    <Badge variant="destructive"><WifiOff className="h-3 w-3 mr-1" />Desconectado</Badge>
                  )}
                  {canal.estado === 'INACTIVO' && (
                    <Badge variant="secondary"><WifiOff className="h-3 w-3 mr-1" />Inactivo</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => handleConectar(canal)}>
                          <QrCode className="h-4 w-4 text-primary" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Conectar por QR</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={syncMut.isPending}
                          onClick={() => syncMut.mutate(canal.id)}
                        >
                          <RefreshCw className={`h-4 w-4 ${syncMut.isPending ? 'animate-spin' : ''}`} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Cargar historial de chats</TooltipContent>
                    </Tooltip>
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(canal); setFormOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeletingId(canal.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <CanalFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSubmit={handleSubmit}
        isLoading={createMut.isPending || editMut.isPending}
        isEditing={!!editing}
      />

      {conectando && (
        <ConectarCanalDialog
          open={!!conectando}
          onClose={() => setConectando(null)}
          canalId={conectando.id}
          canalNombre={conectando.nombre}
          conectarMut={conectarMut}
        />
      )}

      <AlertDialog open={!!deletingId} onOpenChange={(v) => !v && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar canal?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deletingId) deleteMut.mutate(deletingId, { onSuccess: () => setDeletingId(null) });
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
