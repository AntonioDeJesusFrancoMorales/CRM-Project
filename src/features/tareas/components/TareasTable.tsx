// TareasTable — homologa TratosTable.
// Columnas: título (navega a /tareas/:id), tipo, prioridad, estado (badge + TareaEstadoMenu),
//           responsable, trato vinculado, fecha_limite, acciones (editar/eliminar).
// Recibe tareas ya filtradas desde la página; no filtra internamente.

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Pencil, Trash2 } from 'lucide-react';
import type { Tarea } from '@/api/types';
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
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/format';
import { TareaEstadoMenu } from './TareaEstadoMenu';
import { TareaEstadoBadge } from './TareaEstadoBadge';
import { TareaEditDialog } from './TareaEditDialog';
import { TareaDeleteDialog } from './TareaDeleteDialog';
import { useDeleteTarea } from '../hooks/useDeleteTarea';
import { prioridadBadgeClass, prioridadLabels, tipoLabels } from '../lib/tareaBadges';

/** Una tarea está vencida si su fecha límite ya pasó y aún no fue completada. */
function estaVencida(tarea: Tarea): boolean {
  return tarea.fechaCompletada === null && new Date(tarea.fechaLimite) < new Date();
}

interface TareasTableProps {
  tareas: Tarea[];
  /** Mapa id → nombre de tratos para mostrar en columna trato. */
  tratosById?: Record<string, string>;
  /** Mapa id → nombre de usuarios/responsables. */
  usuariosById?: Record<string, string>;
}

export function TareasTable({
  tareas,
  tratosById = {},
  usuariosById = {},
}: TareasTableProps) {
  const navigate = useNavigate();
  const [editTarea, setEditTarea] = useState<Tarea | null>(null);
  const [deleteTarea, setDeleteTarea] = useState<Tarea | null>(null);
  const deleteMutation = useDeleteTarea();

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
          {tareas.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                No hay tareas que coincidan con los filtros
              </TableCell>
            </TableRow>
          ) : (
            tareas.map((tarea) => {
              const vencida = estaVencida(tarea);
              return (
              <TableRow key={tarea.id} className="group">
                <TableCell className="font-medium">
                  <button
                    type="button"
                    onClick={() => void navigate(`/tareas/${tarea.id}`)}
                    className="text-left font-medium underline-offset-4 transition-colors hover:text-primary hover:underline focus:text-primary focus:underline focus:outline-none"
                  >
                    {tarea.titulo}
                  </button>
                </TableCell>
                <TableCell className="text-muted-foreground">{tipoLabels[tarea.tipo]}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={prioridadBadgeClass[tarea.prioridad]}>
                    {prioridadLabels[tarea.prioridad]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <TareaEstadoBadge tareaId={tarea.id} />
                    <TareaEstadoMenu tarea={tarea} />
                  </div>
                </TableCell>
                <TableCell>{usuariosById[tarea.responsableId] ?? '—'}</TableCell>
                <TableCell>{tratosById[tarea.tratoId] ?? '—'}</TableCell>
                <TableCell
                  className={cn(
                    'tabular-nums',
                    vencida
                      ? 'font-medium text-red-600 dark:text-red-400'
                      : 'text-muted-foreground',
                  )}
                >
                  {formatDate(tarea.fechaLimite)}
                </TableCell>
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
              );
            })
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
