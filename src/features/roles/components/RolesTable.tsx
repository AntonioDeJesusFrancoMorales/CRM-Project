import { useMemo, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
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
}

/** Normaliza acentos y mayúsculas para comparación de búsqueda. */
function normalizar(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export function RolesTable({ roles, onEdit, onDelete }: RolesTableProps) {
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
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Buscar por nombre o descripción"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
          aria-label="Buscar roles"
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Nombre</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                No se encontraron roles con esos filtros
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((rol) => (
              <TableRow key={rol.id} className="group">
                <TableCell className="font-medium">{rol.nombre}</TableCell>
                <TableCell className="text-muted-foreground">
                  {rol.descripcion ?? '—'}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={estadoRolBadgeClass(rol.activo)}>
                    {estadoRolLabel(rol.activo)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Acciones">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(rol)}>Editar</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(rol)}
                        className="text-destructive focus:text-destructive"
                      >
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
    </div>
  );
}
