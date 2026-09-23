import { Building2, ExternalLink, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import type { Empresa } from '@/api/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';
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
import { formatDate } from '@/lib/format';
import { estadoRelacionBadgeClass, estadoRelacionLabels } from '../lib/estadoRelacion';

interface EmpresasTableProps {
  empresas: Empresa[];
  onView: (empresa: Empresa) => void;
  onEdit: (empresa: Empresa) => void;
  onDelete: (empresa: Empresa) => void;
  onCreate?: () => void;
  isEmptyDataset?: boolean;
  sort?: SortState;
  onSort?: (sortBy: string) => void;
}

export function EmpresasTable({
  empresas,
  onView,
  onEdit,
  onDelete,
  onCreate,
  isEmptyDataset = false,
  sort,
  onSort,
}: EmpresasTableProps) {
  const sortable = Boolean(sort && onSort);
  return (
    <Table className="min-w-[900px]">
      <TableHeader className="bg-muted/50">
        <TableRow className="hover:bg-transparent">
          {sortable ? (
            <SortableTableHead
              sortDirection={sortDirectionFor(sort!, 'nombre')}
              onSort={() => onSort!('nombre')}
            >
              Nombre
            </SortableTableHead>
          ) : (
            <TableHead>Nombre</TableHead>
          )}
          <TableHead>Estado</TableHead>
          {sortable ? (
            <SortableTableHead
              sortDirection={sortDirectionFor(sort!, 'sector')}
              onSort={() => onSort!('sector')}
            >
              Sector
            </SortableTableHead>
          ) : (
            <TableHead>Sector</TableHead>
          )}
          <TableHead>Teléfono</TableHead>
          <TableHead>Sitio web</TableHead>
          {sortable ? (
            <SortableTableHead
              sortDirection={sortDirectionFor(sort!, 'creadoEn')}
              onSort={() => onSort!('creadoEn')}
            >
              Creado
            </SortableTableHead>
          ) : (
            <TableHead>Creado</TableHead>
          )}
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {empresas.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="p-0">
              <EmptyState
                icon={Building2}
                title={
                  isEmptyDataset
                    ? 'Aún no hay empresas'
                    : 'No hay empresas que coincidan con los filtros'
                }
                description={
                  isEmptyDataset
                    ? 'Registra tu primera empresa para comenzar a gestionar tu cartera.'
                    : 'Ajusta los filtros o registra una nueva empresa.'
                }
                action={
                  onCreate ? (
                    <Button onClick={onCreate}>
                      <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                      Nueva empresa
                    </Button>
                  ) : undefined
                }
                className="rounded-none border-0"
              />
            </TableCell>
          </TableRow>
        ) : (
          empresas.map((empresa) => (
            <TableRow key={empresa.id} className="group/row">
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Building2 className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <button
                    type="button"
                    onClick={() => onView(empresa)}
                    className="text-left font-medium underline-offset-4 transition-colors hover:text-primary hover:underline focus:text-primary focus:underline focus:outline-none"
                  >
                    {empresa.nombre}
                  </button>
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={`rounded-full ${estadoRelacionBadgeClass[empresa.estadoRelacion]}`}
                >
                  {estadoRelacionLabels[empresa.estadoRelacion]}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{empresa.sector ?? '—'}</TableCell>
              <TableCell className="text-muted-foreground">
                {empresa.telefono ? (
                  <a
                    href={`tel:${empresa.telefono}`}
                    className="hover:text-foreground hover:underline"
                  >
                    {empresa.telefono}
                  </a>
                ) : (
                  '—'
                )}
              </TableCell>
              <TableCell className="max-w-[220px]">
                {empresa.paginaWeb ? (
                  <a
                    href={empresa.paginaWeb}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex max-w-full items-center gap-1 text-primary underline-offset-4 hover:text-primary/80 hover:underline focus:underline focus:outline-none"
                  >
                    <span className="truncate">
                      {empresa.paginaWeb.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                    </span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  </a>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {formatDate(empresa.creadoEn)}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Acciones para ${empresa.nombre}`}
                      className="text-muted-foreground opacity-0 transition-opacity group-hover/row:opacity-100 data-[state=open]:opacity-100"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={() => onView(empresa)}>
                      <Building2 className="mr-2 h-4 w-4" aria-hidden="true" />
                      Ver detalle
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(empresa)}>
                      <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(empresa)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
