// TareasTable — homologa TratosTable.
// Columnas: título (navega a /tareas/:id), tipo, prioridad, estado (badge + TareaEstadoMenu),
//           responsable, trato vinculado, fecha_limite, acciones (editar/eliminar).
// Acepta searchTerm para filtro client-side por título.

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Pencil, Trash2 } from 'lucide-react';
import type { Tarea, TipoTarea } from '@/api/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/format';
import { TareaEstadoMenu } from './TareaEstadoMenu';
import { TareaEstadoBadge } from './TareaEstadoBadge';
import { TareaEditDialog } from './TareaEditDialog';
import { TareaDeleteDialog } from './TareaDeleteDialog';
import { useDeleteTarea } from '../hooks/useDeleteTarea';

const tipoLabels: Record<TipoTarea, string> = {
  GENERAL: 'General',
  SEGUIMIENTO: 'Seguimiento',
  NEGOCIACION: 'Negociación',
  CIERRE: 'Cierre',
};

const prioridadLabels: Record<string, string> = {
  BAJA: 'Baja',
  MEDIA: 'Media',
  ALTA: 'Alta',
  URGENTE: 'Urgente',
};


interface TareasTableProps {
  tareas: Tarea[];
  /** Mapa id → nombre de tratos para mostrar en columna trato. */
  tratosById?: Record<string, string>;
  /** Mapa id → nombre de usuarios/responsables. */
  usuariosById?: Record<string, string>;
  searchTerm?: string;
}

export function TareasTable({
  tareas,
  tratosById = {},
  usuariosById = {},
  searchTerm,
}: TareasTableProps) {
  const navigate = useNavigate();
  const [editTarea, setEditTarea] = useState<Tarea | null>(null);
  const [deleteTarea, setDeleteTarea] = useState<Tarea | null>(null);
  const deleteMutation = useDeleteTarea();

  const filtered = searchTerm
    ? tareas.filter((t) =>
        t.titulo.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : tareas;

  function handleConfirmDelete() {
    if (!deleteTarea) return;
    deleteMutation.mutate(deleteTarea.id, {
      onSuccess: () => setDeleteTarea(null),
      onError: () => setDeleteTarea(null),
    });
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Título</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Prioridad</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Responsable</TableHead>
            <TableHead>Trato</TableHead>
            <TableHead>Fecha límite</TableHead>
            <TableHead className="w-24"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                {searchTerm
                  ? `No se encontraron tareas con "${searchTerm}"`
                  : 'No hay tareas registradas'}
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((tarea) => (
              <TableRow key={tarea.id}>
                <TableCell className="font-medium">
                  <button
                    type="button"
                    onClick={() => void navigate(`/tareas/${tarea.id}`)}
                    className="text-left text-primary underline-offset-4 hover:underline focus:underline focus:outline-none"
                  >
                    {tarea.titulo}
                  </button>
                </TableCell>
                <TableCell>{tipoLabels[tarea.tipo]}</TableCell>
                <TableCell>
                  <Badge variant="outline">{prioridadLabels[tarea.prioridad]}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <TareaEstadoBadge tareaId={tarea.id} />
                    <TareaEstadoMenu tarea={tarea} />
                  </div>
                </TableCell>
                <TableCell>{usuariosById[tarea.responsableId] ?? '—'}</TableCell>
                <TableCell>{tratosById[tarea.tratoId] ?? '—'}</TableCell>
                <TableCell>{formatDate(tarea.fechaLimite)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Editar tarea"
                      onClick={() => setEditTarea(tarea)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Eliminar tarea"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarea(tarea)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {editTarea && (
        <TareaEditDialog
          open={true}
          onOpenChange={(open) => { if (!open) setEditTarea(null); }}
          tarea={editTarea}
        />
      )}

      {deleteTarea && (
        <TareaDeleteDialog
          open={true}
          onOpenChange={(open) => { if (!open) setDeleteTarea(null); }}
          titulo={deleteTarea.titulo}
          onConfirm={handleConfirmDelete}
          isDeleting={deleteMutation.isPending}
        />
      )}
    </>
  );
}
