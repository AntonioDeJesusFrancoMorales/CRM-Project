import { useNavigate } from 'react-router';
import { CalendarClock, MoreHorizontal, Pencil, Trash2, TriangleAlert } from 'lucide-react';
import type { Contacto, Trato, Usuario } from '@/api/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { formatCurrency, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import {
  tipoContratoBadgeBaseClass,
  tipoContratoBadgeClass,
  tipoContratoLabels,
} from '../lib/tipoContrato';

interface TratosTableProps {
  tratos: Trato[];
  contactos?: Contacto[];
  usuarios?: Usuario[];
  onEdit?: (trato: Trato) => void;
  onDelete?: (trato: Trato) => void;
  sort?: SortState;
  onSort?: (sortBy: string) => void;
}

function isDateOverdue(value?: string | null) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date < today;
}

function isDateDueSoon(value?: string | null, days = 7) {
  if (!value || isDateOverdue(value)) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const limit = new Date(today);
  limit.setDate(today.getDate() + days);
  date.setHours(0, 0, 0, 0);
  return date <= limit;
}

const estadoBadgeClass = {
  ABIERTO:
    'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-400/20',
  GANADO:
    'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/20',
  PERDIDO:
    'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-400/20',
} as const;

const estadoDotClass = {
  ABIERTO: 'bg-blue-500',
  GANADO: 'bg-emerald-500',
  PERDIDO: 'bg-red-500',
} as const;

export function TratosTable({
  tratos,
  contactos = [],
  usuarios = [],
  onEdit,
  onDelete,
  sort,
  onSort,
}: TratosTableProps) {
  const navigate = useNavigate();

  // Lookup Maps para resolución client-side
  const contactosById = new Map(contactos.map((c) => [c.id, c]));
  const usuariosById = new Map(usuarios.map((u) => [u.id, u]));

  const showActions = !!(onEdit || onDelete);
  const sortable = Boolean(sort && onSort);

  return (
    <Table>
      <TableHeader className="bg-muted/50">
        <TableRow className="hover:bg-transparent">
          {sortable ? (
            <SortableTableHead sortDirection={sortDirectionFor(sort!, 'nombre')} onSort={() => onSort!('nombre')}>
              Nombre
            </SortableTableHead>
          ) : (
            <TableHead>Nombre</TableHead>
          )}
          {sortable ? (
            <SortableTableHead
              align="right"
              className="text-right"
              sortDirection={sortDirectionFor(sort!, 'valorEstimado')}
              onSort={() => onSort!('valorEstimado')}
            >
              Valor estimado
            </SortableTableHead>
          ) : (
            <TableHead className="text-right">Valor estimado</TableHead>
          )}
          <TableHead>Tipo de contrato</TableHead>
          <TableHead>Contacto</TableHead>
          <TableHead>Responsable</TableHead>
          {sortable ? (
            <SortableTableHead sortDirection={sortDirectionFor(sort!, 'fechaCierreEsperada')} onSort={() => onSort!('fechaCierreEsperada')}>
              Cierre esperado
            </SortableTableHead>
          ) : (
            <TableHead>Cierre esperado</TableHead>
          )}
          {showActions && <TableHead className="w-10 text-right" />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {tratos.length === 0 ? (
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={showActions ? 7 : 6} className="h-32 text-center text-muted-foreground">
              No hay tratos para los filtros seleccionados
            </TableCell>
          </TableRow>
        ) : (
          tratos.map((trato) => {
            const contacto = contactosById.get(trato.contactoId);
            const responsable = usuariosById.get(trato.responsableId);
            const overdue = isDateOverdue(trato.fechaCierreEsperada);
            const dueSoon = isDateDueSoon(trato.fechaCierreEsperada);
            return (
              <TableRow key={trato.id} className="group/row">
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => void navigate(`/tratos/${trato.id}`)}
                      className="text-left text-sm font-medium text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline focus:text-primary focus:underline focus:outline-none"
                    >
                      {trato.nombre}
                    </button>
                    <div className="flex items-center gap-1.5">
                      <span className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset', estadoBadgeClass[trato.estado])}>
                        <span className={cn('h-1.5 w-1.5 rounded-full', estadoDotClass[trato.estado])} />
                        {trato.estado === 'ABIERTO' ? 'Abierto' : trato.estado === 'GANADO' ? 'Ganado' : 'Perdido'}
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {trato.probabilidad ?? 0}%
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-sm font-medium tabular-nums text-foreground">
                    {formatCurrency(trato.valorEstimado)}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={cn(tipoContratoBadgeBaseClass, tipoContratoBadgeClass[trato.tipoContrato])}>
                    {tipoContratoLabels[trato.tipoContrato]}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm text-foreground">{contacto?.nombre ?? '—'}</span>
                    {contacto?.empresaId && (
                      <span className="text-xs text-muted-foreground">Empresa vinculada</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-foreground">{responsable?.nombre ?? '—'}</span>
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 text-sm tabular-nums',
                      overdue
                        ? 'font-medium text-red-600 dark:text-red-400'
                        : dueSoon
                          ? 'font-medium text-amber-600 dark:text-amber-400'
                          : 'text-muted-foreground',
                    )}
                  >
                    {overdue ? <TriangleAlert className="h-3.5 w-3.5" /> : <CalendarClock className="h-3.5 w-3.5" />}
                    {formatDate(trato.fechaCierreEsperada)}
                  </span>
                </TableCell>
                {showActions && (
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`Acciones para ${trato.nombre}`}
                          className="text-muted-foreground opacity-0 transition-opacity group-hover/row:opacity-100 data-[state=open]:opacity-100"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        {onEdit && (
                          <DropdownMenuItem onClick={() => onEdit(trato)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                        )}
                        {onEdit && onDelete && <DropdownMenuSeparator />}
                        {onDelete && (
                          <DropdownMenuItem
                            onClick={() => onDelete(trato)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
