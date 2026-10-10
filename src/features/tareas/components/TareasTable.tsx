// TareasTable — homologa TratosTable.
// Columnas: título (navega a /tareas/:id), tipo, prioridad, estado (badge + TareaEstadoMenu),
//           responsable, trato vinculado, fecha_limite, acciones (editar/eliminar).
// Recibe tareas ya filtradas desde la página; no filtra internamente.

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { CalendarClock, MoreHorizontal, Pencil, Trash2, TriangleAlert } from 'lucide-react';
import type { Tarea } from '@/api/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SortableTableHead } from '@/components/shared/SortableTableHead';
import type { SortState } from '@/components/shared/listPaging';
import { sortDirectionFor } from '@/components/shared/listPaging';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/format';
import { TareaEstadoMenu } from './TareaEstadoMenu';
import { TareaEstadoBadge } from './TareaEstadoBadge';
import { TareaEditDialog } from './TareaEditDialog';
import { TareaDeleteDialog } from './TareaDeleteDialog';
import { useDeleteTarea } from '../hooks/useDeleteTarea';
import { prioridadBadgeClass, prioridadLabels, tareaBadgeBaseClass, tipoLabels } from '../lib/tareaBadges';
import type { ColumnaTablero } from '@/features/kanban/schemas/tablero.schema';
import type { TareaWorkflowById } from '../lib/tareaWorkflow';
import { useSynchronousMutationLock } from '@/components/shared/useSynchronousMutationLock';

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
  workflowByTareaId?: TareaWorkflowById;
  workflowColumns?: ColumnaTablero[];
  sort?: SortState;
  onSort?: (sortBy: string) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export function TareasTable({
  tareas,
  tratosById = {},
  usuariosById = {},
  workflowByTareaId = {},
  workflowColumns = [],
  sort,
  onSort,
  canEdit = true,
  canDelete = true,
}: TareasTableProps) {
  const navigate = useNavigate();
  const [editTarea, setEditTarea] = useState<Tarea | null>(null);
  const [deleteTarea, setDeleteTarea] = useState<Tarea | null>(null);
  const deleteMutation = useDeleteTarea();
  const { acquire, release, isLocked, lockRef: deleteLock } = useSynchronousMutationLock();
  const sortable = Boolean(sort && onSort);

  function handleConfirmDelete() {
    if (!deleteTarea || !acquire()) return;
    deleteMutation.mutate(deleteTarea.id, {
      onSuccess: () => setDeleteTarea(null),
      onError: () => setDeleteTarea(null),
      onSettled: () => release(),
    });
  }

  function handleDeleteOpenChange(open: boolean) {
    if (!open && deleteLock.current) return;
    if (!open) setDeleteTarea(null);
  }

  return (
    <>
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-transparent">
            {sortable ? (
              <SortableTableHead sortDirection={sortDirectionFor(sort!, 'titulo')} onSort={() => onSort!('titulo')}>
                Título
              </SortableTableHead>
            ) : (
              <TableHead>Título</TableHead>
            )}
            <TableHead>Tipo</TableHead>
            {sortable ? (
              <SortableTableHead sortDirection={sortDirectionFor(sort!, 'prioridad')} onSort={() => onSort!('prioridad')}>
                Prioridad
              </SortableTableHead>
            ) : (
              <TableHead>Prioridad</TableHead>
            )}
            <TableHead>Estado</TableHead>
            <TableHead>Responsable</TableHead>
            <TableHead>Trato</TableHead>
            {sortable ? (
              <SortableTableHead sortDirection={sortDirectionFor(sort!, 'fechaLimite')} onSort={() => onSort!('fechaLimite')}>
                Fecha límite
              </SortableTableHead>
            ) : (
              <TableHead>Fecha límite</TableHead>
            )}
            <TableHead className="w-10 text-right"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tareas.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                No hay tareas que coincidan con los filtros
              </TableCell>
            </TableRow>
          ) : (
            tareas.map((tarea) => {
              const vencida = estaVencida(tarea);
              const workflowState = workflowByTareaId[tarea.id];
              return (
              <TableRow key={tarea.id} className="group/row">
                <TableCell>
                  <button
                    type="button"
                    onClick={() => void navigate(`/tareas/${tarea.id}`)}
                    className="text-left text-sm font-medium text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline focus:text-primary focus:underline focus:outline-none"
                  >
                    {tarea.titulo}
                  </button>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{tipoLabels[tarea.tipo]}</TableCell>
                <TableCell>
                  <span className={cn(tareaBadgeBaseClass, prioridadBadgeClass[tarea.prioridad])}>
                    {prioridadLabels[tarea.prioridad]}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <TareaEstadoBadge workflowState={workflowState} />
                    {canEdit && (
                      <TareaEstadoMenu
                        tarea={tarea}
                        workflowState={workflowState}
                        workflowColumns={workflowColumns}
                      />
                    )}
                  </div>
                </TableCell>
                <TableCell><span className="text-sm text-foreground">{usuariosById[tarea.responsableId] ?? '—'}</span></TableCell>
                <TableCell><span className="text-sm text-foreground">{tratosById[tarea.tratoId] ?? '—'}</span></TableCell>
                <TableCell
                  className={cn(
                    'inline-flex items-center gap-1 text-sm tabular-nums',
                    vencida
                      ? 'font-medium text-red-600 dark:text-red-400'
                      : 'text-muted-foreground',
                  )}
                >
                  {vencida ? <TriangleAlert className="h-3.5 w-3.5" /> : <CalendarClock className="h-3.5 w-3.5" />}
                  {formatDate(tarea.fechaLimite)}
                </TableCell>
                <TableCell className="text-right">
                  {(canEdit || canDelete) && <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`Acciones para ${tarea.titulo}`}
                        className="text-muted-foreground opacity-0 transition-opacity group-hover/row:opacity-100 data-[state=open]:opacity-100"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      {canEdit && (
                        <DropdownMenuItem onClick={() => setEditTarea(tarea)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                      )}
                      {canEdit && canDelete && <DropdownMenuSeparator />}
                      {canDelete && (
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteTarea(tarea)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>}
                </TableCell>
              </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {editTarea && canEdit && (
        <TareaEditDialog
          open={true}
          onOpenChange={(open) => { if (!open) setEditTarea(null); }}
          tarea={editTarea}
        />
      )}

      {deleteTarea && canDelete && (
        <TareaDeleteDialog
          open={true}
          onOpenChange={handleDeleteOpenChange}
          titulo={deleteTarea.titulo}
          onConfirm={handleConfirmDelete}
          isDeleting={deleteMutation.isPending || isLocked}
        />
      )}
    </>
  );
}
