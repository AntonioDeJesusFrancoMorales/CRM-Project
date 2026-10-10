import { useMemo, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import type { Usuario, Rol } from '@/api/types';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { formatRelativeDate } from '@/lib/format';
import { resolveRolNombre } from '../lib/rolLookup';
import { SensitiveField } from '@/features/permissions/components/PermissionState';
import { usePermissions } from '@/features/permissions/context';
import {
  estadoUsuarioBadgeClass,
  estadoUsuarioLabel,
} from '../lib/estadoUsuario';

interface UsuariosTableProps {
  usuarios: Usuario[];
  roles: Rol[];
  sessionUserId: string;
  onEdit: (usuario: Usuario) => void;
  onDelete: (usuario: Usuario) => void;
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

export function UsuariosTable({
  usuarios,
  roles,
  sessionUserId,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
}: UsuariosTableProps) {
  const canReadPrivate = usePermissions().canReadGroup('USUARIO', 'CONTACTO_PRIVADO');
  const [searchTerm, setSearchTerm] = useState('');
  const [rolFilter, setRolFilter] = useState<string>('todos');

  const filtered = useMemo(() => {
    const term = normalizar(searchTerm.trim());
    return usuarios.filter((u) => {
      const coincideBusqueda =
        term === '' ||
        normalizar(u.nombre).includes(term) ||
        (canReadPrivate && normalizar(u.correo ?? '').includes(term));
      const rolNombre = resolveRolNombre(u.rolId, roles);
      const coincideRol =
        rolFilter === 'todos' ||
        normalizar(rolNombre).includes(normalizar(rolFilter));
      return coincideBusqueda && coincideRol;
    });
  }, [canReadPrivate, usuarios, roles, searchTerm, rolFilter]);

  // Build unique role options from the provided roles list
  const rolOptions = useMemo(() => {
    return roles.map((r) => ({ value: r.nombre, label: r.nombre }));
  }, [roles]);

  return (
    <div className="space-y-4">
      {/* Header: búsqueda + filtro de rol */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder={canReadPrivate ? 'Buscar por nombre o correo' : 'Buscar por nombre'}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
          aria-label="Buscar usuarios"
        />
        <Select
          value={rolFilter}
          onValueChange={(v) => setRolFilter(v)}
        >
          <SelectTrigger className="w-[160px]" aria-label="Filtrar por rol">
            <SelectValue placeholder="Filtrar por rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {rolOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Nombre</TableHead>
            <TableHead>Correo</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Creado</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="py-8 text-center text-muted-foreground"
              >
                No se encontraron usuarios con esos filtros
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((usuario) => {
              const isOwnAccount = usuario.id === sessionUserId;
              const rolNombre = resolveRolNombre(usuario.rolId, roles);

              return (
                <TableRow key={usuario.id} className="group">
                  <TableCell className="font-medium">{usuario.nombre}</TableCell>
                  <TableCell className="text-muted-foreground">
                    <SensitiveField resource="USUARIO" group="CONTACTO_PRIVADO">
                      {usuario.correo ?? '—'}
                    </SensitiveField>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{rolNombre}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={estadoUsuarioBadgeClass(usuario.activo)}
                    >
                      {estadoUsuarioLabel(usuario.activo)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatRelativeDate(usuario.creadoEn)}
                  </TableCell>
                  <TableCell>
                    {(canEdit || canDelete) && <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Acciones"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canEdit && <DropdownMenuItem onClick={() => onEdit(usuario)}>Editar</DropdownMenuItem>}

                        {canEdit && canDelete && <DropdownMenuSeparator />}

                        {/* Eliminar — bloqueado para cuenta propia */}
                        {canDelete && isOwnAccount ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <DropdownMenuItem
                                  disabled
                                  className="cursor-not-allowed opacity-50 text-destructive focus:text-destructive"
                                >
                                  Eliminar
                                </DropdownMenuItem>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              No puedes realizar esta acción sobre tu propia cuenta
                            </TooltipContent>
                          </Tooltip>
                        ) : canDelete ? (
                          <DropdownMenuItem
                            onClick={() => onDelete(usuario)}
                            className="text-destructive focus:text-destructive"
                          >
                            Eliminar
                          </DropdownMenuItem>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
