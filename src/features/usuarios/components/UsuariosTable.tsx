import { useMemo, useState } from 'react';
import { MoreHorizontal, Search, ShieldAlert } from 'lucide-react';
import type { Usuario, Rol } from '@/api/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { cn } from '@/lib/utils';
import { resolveRolNombre } from '../lib/rolLookup';
import { SensitiveField } from '@/features/permissions/components/PermissionState';
import { usePermissions } from '@/features/permissions/context';
import { estadoUsuarioBadgeClass, estadoUsuarioLabel } from '../lib/estadoUsuario';

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
  return str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
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
        rolFilter === 'todos' || normalizar(rolNombre).includes(normalizar(rolFilter));
      return coincideBusqueda && coincideRol;
    });
  }, [canReadPrivate, usuarios, roles, searchTerm, rolFilter]);

  // Build unique role options from the provided roles list
  const rolOptions = useMemo(() => {
    return roles.map((r) => ({ value: r.nombre, label: r.nombre }));
  }, [roles]);

  function clearFilters() {
    setSearchTerm('');
    setRolFilter('todos');
  }

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
            placeholder={canReadPrivate ? 'Buscar por nombre o correo' : 'Buscar por nombre'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 pl-9"
            aria-label="Buscar usuarios"
          />
        </div>
        <Select value={rolFilter} onValueChange={(v) => setRolFilter(v)}>
          <SelectTrigger className="h-9 w-full sm:w-56" aria-label="Filtrar por rol">
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
        <span className="text-xs text-muted-foreground sm:pl-1" aria-live="polite">
          {filtered.length} {filtered.length === 1 ? 'usuario' : 'usuarios'}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center px-6 py-16 text-center">
          <Search className="size-8 text-muted-foreground/50" aria-hidden="true" />
          <p className="mt-3 font-medium">No se encontraron usuarios con esos filtros</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>
            Quitar filtros
          </Button>
        </div>
      ) : (
        <Table className="min-w-[820px]">
          <TableHeader className="bg-muted/50 text-left text-xs text-muted-foreground">
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-auto w-[28%] px-4 py-3 font-medium text-muted-foreground">
                Nombre
              </TableHead>
              <TableHead className="h-auto w-[24%] px-4 py-3 font-medium text-muted-foreground">
                Correo
              </TableHead>
              <TableHead className="h-auto w-[18%] px-4 py-3 font-medium text-muted-foreground">
                Rol
              </TableHead>
              <TableHead className="h-auto w-[13%] px-4 py-3 font-medium text-muted-foreground">
                Estado
              </TableHead>
              <TableHead className="h-auto w-[12%] px-4 py-3 font-medium text-muted-foreground">
                Creado
              </TableHead>
              <TableHead className="h-auto w-12 px-4 py-3 text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((usuario) => {
              const isOwnAccount = usuario.id === sessionUserId;
              const rolNombre = resolveRolNombre(usuario.rolId, roles);

              return (
                <TableRow key={usuario.id} className="group/row hover:bg-muted/30">
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                          {getInitials(usuario.nombre)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{usuario.nombre}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-muted-foreground">
                    <SensitiveField
                      resource="USUARIO"
                      group="CONTACTO_PRIVADO"
                      fallback={
                        <span className="inline-flex items-center gap-1.5 text-xs">
                          <ShieldAlert className="size-3.5" aria-hidden="true" />
                          Sin permiso
                        </span>
                      }
                    >
                      {usuario.correo ?? '—'}
                    </SensitiveField>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge
                      variant="secondary"
                      className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
                    >
                      {rolNombre}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={cn(
                        'rounded-full px-2 py-1 text-xs font-medium',
                        estadoUsuarioBadgeClass(usuario.activo),
                      )}
                    >
                      {estadoUsuarioLabel(usuario.activo)}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {formatRelativeDate(usuario.creadoEn)}
                  </TableCell>
                  <TableCell className="w-12 px-4 py-3 text-right">
                    {(canEdit || canDelete) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Acciones para ${usuario.nombre}`}
                            className="text-muted-foreground"
                          >
                            <MoreHorizontal aria-hidden="true" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32">
                          {canEdit && (
                            <DropdownMenuItem
                              className="px-2 py-1.5"
                              onClick={() => onEdit(usuario)}
                            >
                              Editar
                            </DropdownMenuItem>
                          )}

                          {canEdit && canDelete && <DropdownMenuSeparator />}

                          {canDelete && isOwnAccount ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>
                                  <DropdownMenuItem
                                    disabled
                                    className="cursor-not-allowed px-2 py-1.5 text-destructive focus:text-destructive"
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
                              className="px-2 py-1.5 text-destructive focus:text-destructive"
                              onClick={() => onDelete(usuario)}
                            >
                              Eliminar
                            </DropdownMenuItem>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function getInitials(nombre: string): string {
  const parts = nombre.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]!}${parts[parts.length - 1]![0]!}`.toUpperCase();
}
