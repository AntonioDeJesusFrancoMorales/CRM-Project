import { useState } from 'react';
import { Pencil, Trash2, Plus, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { CanalWhatsapp } from '@/api/types';
import { CanalFormDialog } from './CanalFormDialog';
import { useCreateCanal } from '../hooks/useCreateCanal';
import { useEditCanal } from '../hooks/useEditCanal';
import { useDeleteCanal } from '../hooks/useDeleteCanal';
import type { CanalFormValues } from '../schemas/canal.schema';

interface Props {
  canales: CanalWhatsapp[];
  empresaId: string;
}

export function CanalesTable({ canales, empresaId }: Props) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CanalWhatsapp | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const createMut = useCreateCanal(empresaId);
  const editMut = useEditCanal(empresaId);
  const deleteMut = useDeleteCanal(empresaId);

  function handleSubmit(values: CanalFormValues) {
    if (editing) {
      editMut.mutate({ id: editing.id, payload: values }, { onSuccess: () => setFormOpen(false) });
    } else {
      createMut.mutate({ ...values, empresaId, proveedor: 'EVOLUTION' }, { onSuccess: () => setFormOpen(false) });
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
        <p className="text-sm text-muted-foreground text-center py-8">
          No hay canales configurados para esta empresa.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Instancia</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {canales.map((canal) => (
              <TableRow key={canal.id}>
                <TableCell className="font-medium">{canal.nombre}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{canal.instanceName}</TableCell>
                <TableCell className="text-muted-foreground text-sm truncate max-w-48">{canal.apiUrl}</TableCell>
                <TableCell>
                  <Badge variant={canal.estado === 'ACTIVO' ? 'default' : 'secondary'}>
                    {canal.estado === 'ACTIVO'
                      ? <><Wifi className="h-3 w-3 mr-1" />Activo</>
                      : <><WifiOff className="h-3 w-3 mr-1" />Inactivo</>
                    }
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
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
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        isLoading={createMut.isPending || editMut.isPending}
        initial={editing}
      />

      <AlertDialog open={!!deletingId} onOpenChange={(v) => !v && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar canal?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
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
