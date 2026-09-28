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
import { displayWebsiteUrl, normalizeWebsiteUrl } from '../lib/empresaLinks';

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
    <Table className="w-full table-fixed">
      <TableHeader className="bg-muted/50">
        <TableRow className="hover:bg-transparent">
          {sortable ? (
            <SortableTableHead
              className="w-[28%]"
              sortDirection={sortDirectionFor(sort!, 'nombre')}
              onSort={() => onSort!('nombre')}
            >
              Nombre
            </SortableTableHead>
          ) : (
            <TableHead className="w-[28%]">Nombre</TableHead>
          )}
          <TableHead className="w-[13%]">Estado</TableHead>
          {sortable ? (
            <SortableTableHead
              className="w-[14%]"
              sortDirection={sortDirectionFor(sort!, 'sector')}
              onSort={() => onSort!('sector')}
            >
              Sector
            </SortableTableHead>
          ) : (
            <TableHead className="w-[14%]">Sector</TableHead>
          )}
          <TableHead className="w-[14%]">Teléfono</TableHead>
          <TableHead className="w-[19%]">Página web</TableHead>
          {sortable ? (
            <SortableTableHead
              className="w-[10%]"
              sortDirection={sortDirectionFor(sort!, 'creadoEn')}
              onSort={() => onSort!('creadoEn')}
            >
              Creado
            </SortableTableHead>
          ) : (
            <TableHead className="w-[10%]">Creado</TableHead>
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
          empresas.map((empresa) => {
            const websiteHref = empresa.paginaWeb ? normalizeWebsiteUrl(empresa.paginaWeb) : null;

            return (
              <TableRow key={empresa.id} className="group/row">
                <TableCell className="min-w-0">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Building2 className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <button
                      type="button"
                      onClick={() => onView(empresa)}
                      title={empresa.nombre}
                      className="min-w-0 flex-1 truncate text-left font-medium underline-offset-4 transition-colors hover:text-primary hover:underline focus:text-primary focus:underline focus:outline-none"
                    >
                      {empresa.nombre}
                    </button>
                  </div>
                </TableCell>
                <TableCell className="min-w-0">
                  <Badge
                    variant="outline"
                    className={`rounded-full ${estadoRelacionBadgeClass[empresa.estadoRelacion]}`}
                  >
                    {estadoRelacionLabels[empresa.estadoRelacion]}
                  </Badge>
                </TableCell>
                <TableCell className="min-w-0 text-muted-foreground">
                  <span className="block truncate" title={empresa.sector ?? undefined}>
                    {empresa.sector ?? '—'}
                  </span>
                </TableCell>
                <TableCell className="min-w-0 text-muted-foreground">
                  {empresa.telefono ? (
                    <a
                      href={`tel:${empresa.telefono}`}
                      title={empresa.telefono}
                      className="block truncate hover:text-foreground hover:underline"
                    >
                      {empresa.telefono}
                    </a>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell className="min-w-0">
                  {empresa.paginaWeb && websiteHref ? (
                    <a
                      href={websiteHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={empresa.paginaWeb}
                      className="inline-flex min-w-0 max-w-full items-center gap-1 text-primary underline-offset-4 hover:text-primary/80 hover:underline focus:underline focus:outline-none"
                    >
                      <span className="block truncate">{displayWebsiteUrl(empresa.paginaWeb)}</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    </a>
                  ) : empresa.paginaWeb ? (
                    <span className="block truncate" title={empresa.paginaWeb}>
                      {empresa.paginaWeb}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="min-w-0 text-muted-foreground">
                  <span className="block truncate">{formatDate(empresa.creadoEn)}</span>
                </TableCell>
                <TableCell className="w-10 text-right">
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
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
