import { Link } from 'react-router';
import { MoreHorizontal, Pencil, Plus, Trash2, Users } from 'lucide-react';
import type { Contacto, Empresa, Usuario } from '@/api/types';
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
import { SensitiveField } from '@/features/permissions/components/PermissionState';

interface ContactosTableProps {
  contactos: Contacto[];
  empresas?: Empresa[];
  usuarios?: Usuario[];
  onEdit: (contacto: Contacto) => void;
  onDelete: (contacto: Contacto) => void;
  onCreate?: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
  sort?: SortState;
  onSort?: (sortBy: string) => void;
}

export function ContactosTable({
  contactos,
  empresas = [],
  usuarios = [],
  onEdit,
  onDelete,
  onCreate,
  canEdit = true,
  canDelete = true,
  sort,
  onSort,
}: ContactosTableProps) {
  const sortable = Boolean(sort && onSort);
  const empresasById = new Map(empresas.map((empresa) => [empresa.id, empresa]));
  const usuariosById = new Map(usuarios.map((usuario) => [usuario.id, usuario]));

  return (
    <Table className="min-w-[980px]">
      <TableHeader className="bg-muted/50">
        <TableRow className="hover:bg-transparent">
          {sortable ? (
            <SortableTableHead
              sortDirection={sortDirectionFor(sort!, 'nombre')}
              onSort={() => onSort!('nombre')}
            >
              Contacto
            </SortableTableHead>
          ) : (
            <TableHead>Contacto</TableHead>
          )}
          <TableHead>Empresa</TableHead>
          <TableHead>Cargo</TableHead>
          {sortable ? (
            <SortableTableHead
              sortDirection={sortDirectionFor(sort!, 'correo')}
              onSort={() => onSort!('correo')}
            >
              Correo
            </SortableTableHead>
          ) : (
            <TableHead>Correo</TableHead>
          )}
          <TableHead>Estado</TableHead>
          <TableHead>Responsable</TableHead>
          <TableHead>¿Cómo nos conoció?</TableHead>
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
        {contactos.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9} className="p-0">
              <EmptyState
                icon={Users}
                title="No hay contactos que coincidan con los filtros"
                description="Ajusta los filtros o agrega un nuevo contacto."
                action={
                  onCreate ? (
                    <Button onClick={onCreate}>
                      <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                      Nuevo contacto
                    </Button>
                  ) : undefined
                }
                className="border-0"
              />
            </TableCell>
          </TableRow>
        ) : (
          contactos.map((contacto) => (
            <TableRow key={contacto.id} className="group/row">
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {getInitials(contacto.nombre)}
                  </div>
                  <div className="min-w-0">
                    <Link
                      to={`/contactos/${contacto.id}`}
                      className="font-medium underline-offset-4 transition-colors hover:text-primary hover:underline focus:text-primary focus:underline focus:outline-none"
                    >
                      {contacto.nombre}
                    </Link>
                    <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                      <SensitiveField resource="CONTACTO" group="CONTACTO_PRIVADO" fallback="Correo no disponible">
                        <span>{contacto.correo ?? 'Sin correo'}</span>
                      </SensitiveField>
                      <SensitiveField resource="CONTACTO" group="CONTACTO_PRIVADO" fallback="Teléfono no disponible">
                        <span>{contacto.telefono ?? 'Sin teléfono'}</span>
                      </SensitiveField>
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>{empresasById.get(contacto.empresaId)?.nombre ?? '—'}</TableCell>
              <TableCell className="text-muted-foreground">{contacto.cargo ?? '—'}</TableCell>
               <TableCell>
                 <SensitiveField resource="CONTACTO" group="CONTACTO_PRIVADO">
                   {contacto.correo ?? '—'}
                 </SensitiveField>
               </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={estadoRelacionBadgeClass[contacto.estadoRelacion]}
                >
                  {estadoRelacionLabels[contacto.estadoRelacion]}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {usuariosById.get(contacto.responsableId ?? '')?.nombre ?? '—'}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {contacto.comoNosConocio ?? '—'}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(contacto.creadoEn)}
              </TableCell>
              <TableCell className="text-right">
                {(canEdit || canDelete) && <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Acciones para ${contacto.nombre}`}
                      className="text-muted-foreground opacity-0 transition-opacity group-hover/row:opacity-100 data-[state=open]:opacity-100"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    {canEdit && (
                      <DropdownMenuItem onClick={() => onEdit(contacto)}>
                        <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
                        Editar
                      </DropdownMenuItem>
                    )}
                    {canEdit && canDelete && <DropdownMenuSeparator />}
                    {canDelete && (
                      <DropdownMenuItem
                        onClick={() => onDelete(contacto)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                        Eliminar
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

function getInitials(nombre: string): string {
  const parts = nombre.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]!}${parts[parts.length - 1]![0]!}`.toUpperCase();
}
