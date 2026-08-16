import { useNavigate } from 'react-router';
import { MoreHorizontal } from 'lucide-react';
import type { Contacto, Trato, Usuario } from '@/api/types';
import { Badge } from '@/components/ui/badge';
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
import {
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
      <TableHeader>
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
          {showActions && <TableHead className="w-10" />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {tratos.length === 0 ? (
          <TableRow>
            <TableCell colSpan={showActions ? 7 : 6} className="py-8 text-center text-muted-foreground">
              No hay tratos para los filtros seleccionados
            </TableCell>
          </TableRow>
        ) : (
          tratos.map((trato) => {
            const contacto = contactosById.get(trato.contactoId);
            const responsable = usuariosById.get(trato.responsableId);
            return (
              <TableRow key={trato.id} className="group">
                <TableCell className="font-medium">
                  <button
                    type="button"
                    onClick={() => void navigate(`/tratos/${trato.id}`)}
                    className="text-left font-medium underline-offset-4 transition-colors hover:text-primary hover:underline focus:text-primary focus:underline focus:outline-none"
                  >
                    {trato.nombre}
                  </button>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCurrency(trato.valorEstimado)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={tipoContratoBadgeClass[trato.tipoContrato]}
                  >
                    {tipoContratoLabels[trato.tipoContrato]}
                  </Badge>
                </TableCell>
                <TableCell>{contacto?.nombre ?? '—'}</TableCell>
                <TableCell>{responsable?.nombre ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(trato.fechaCierreEsperada)}
                </TableCell>
                {showActions && (
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Acciones">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onEdit && (
                          <DropdownMenuItem onClick={() => onEdit(trato)}>
                            Editar
                          </DropdownMenuItem>
                        )}
                        {onEdit && onDelete && <DropdownMenuSeparator />}
                        {onDelete && (
                          <DropdownMenuItem
                            onClick={() => onDelete(trato)}
                            className="text-destructive focus:text-destructive"
                          >
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
