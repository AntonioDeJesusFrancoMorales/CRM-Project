import { useMemo, useState } from 'react';
import { MoreHorizontal, Search, ShieldCheck } from 'lucide-react';
import type { Rol } from '@/api/types';
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
import { Input } from '@/components/ui/input';
import { estadoRolBadgeClass, estadoRolLabel } from '../lib/estadoRol';

interface RolesTableProps {
  roles: Rol[];
  onEdit: (rol: Rol) => void;
  onDelete: (rol: Rol) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

/** Normaliza acentos y mayúsculas para comparación de búsqueda. */
function normalizar(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export function RolesTable({ roles, onEdit, onDelete, canEdit = true, canDelete = true }: RolesTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(() => {
    const term = normalizar(searchTerm.trim());
    if (term === '') return roles;
    return roles.filter(
      (r) =>
        normalizar(r.nombre).includes(term) ||
        normalizar(r.descripcion ?? '').includes(term),
    );
  }, [roles, searchTerm]);

  return (
    <div>
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Buscar por nombre o descripción"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 pl-9"
            aria-label="Buscar roles"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center px-6 py-16 text-center">
          <Search className="size-8 text-muted-foreground/50" aria-hidden="true" />
          <p className="mt-3 font-medium">No se encontraron roles con esos filtros</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => setSearchTerm('')}
          >
            Limpiar búsqueda
          </Button>
        </div>
      ) : (
        <Table className="min-w-[700px]">
          <TableHeader className="bg-muted/50 text-left text-xs text-muted-foreground">
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-auto px-4 py-3 font-medium text-muted-foreground">
                Nombre
              </TableHead>
              <TableHead className="h-auto px-4 py-3 font-medium text-muted-foreground">
                Descripción
              </TableHead>
              <TableHead className="h-auto px-4 py-3 font-medium text-muted-foreground">
                Estado
              </TableHead>
              <TableHead className="h-auto w-12 px-4 py-3 text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((rol) => (
              <TableRow key={rol.id} className="group/row hover:bg-muted/30">
                <TableCell className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <ShieldCheck className="size-4" aria-hidden="true" />
                    </span>
                    <span className="font-medium">{rol.nombre}</span>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3 text-muted-foreground">
                  {rol.descripcion ?? '—'}
                </TableCell>
                <TableCell className="px-4 py-3">
                  <Badge
                    variant="outline"
                    className={`rounded-full px-2 py-1 text-xs font-medium ${estadoRolBadgeClass(rol.activo)}`}
                  >
                    {estadoRolLabel(rol.activo)}
                  </Badge>
                </TableCell>
                <TableCell className="w-12 px-4 py-3 text-right">
                  {(canEdit || canDelete) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Acciones para ${rol.nombre}`}
                          className="text-muted-foreground"
                        >
                          <MoreHorizontal aria-hidden="true" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32">
                        {canEdit && (
                          <DropdownMenuItem
                            className="px-2 py-1.5"
                            onClick={() => onEdit(rol)}
                          >
                            Editar
                          </DropdownMenuItem>
                        )}
                        {canEdit && canDelete && <DropdownMenuSeparator />}
                        {canDelete && (
                          <DropdownMenuItem
                            onClick={() => onDelete(rol)}
                            className="px-2 py-1.5 text-destructive focus:text-destructive"
                          >
                            Eliminar
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
