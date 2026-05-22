import { useMemo, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import type { Usuario } from '@/api/types';
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

interface UsuariosTableProps {
  usuarios: Usuario[];
  sessionUserId: string;
  onEdit: (usuario: Usuario) => void;
  onDelete: (usuario: Usuario) => void;
  onDesactivar: (usuario: Usuario) => void;
  onReactivar: (usuario: Usuario) => void;
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
  sessionUserId,
  onEdit,
  onDelete,
  onDesactivar,
  onReactivar,
}: UsuariosTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [rolFilter, setRolFilter] = useState<'admin' | 'usuario' | 'todos'>('todos');

  const filtered = useMemo(() => {
    const term = normalizar(searchTerm.trim());
    return usuarios.filter((u) => {
      const coincideBusqueda =
        term === '' ||
        normalizar(u.nombre).includes(term) ||
        normalizar(u.correo).includes(term);
      const coincideRol = rolFilter === 'todos' || u.rol_sistema === rolFilter;
      return coincideBusqueda && coincideRol;
    });
  }, [usuarios, searchTerm, rolFilter]);

  return (
    <div className="space-y-4">
      {/* Header: búsqueda + filtro de rol */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Buscar por nombre o correo"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
          aria-label="Buscar usuarios"
        />
        <Select
          value={rolFilter}
          onValueChange={(v) => setRolFilter(v as 'admin' | 'usuario' | 'todos')}
        >
          <SelectTrigger className="w-[160px]" aria-label="Filtrar por rol">
            <SelectValue placeholder="Filtrar por rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="usuario">Usuario</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Correo</TableHead>
            <TableHead>Rol sistema</TableHead>
            <TableHead>Rol empresa</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Creado</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="py-8 text-center text-muted-foreground"
              >
                No se encontraron usuarios con esos filtros
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((usuario) => {
              const isOwnAccount = usuario.id === sessionUserId;

              return (
                <TableRow key={usuario.id}>
                  <TableCell className="font-medium">{usuario.nombre}</TableCell>
                  <TableCell>{usuario.correo}</TableCell>
                  <TableCell>
                    {usuario.rol_sistema === 'admin' ? (
                      <Badge variant="default">Admin</Badge>
                    ) : (
                      <Badge variant="secondary">Usuario</Badge>
                    )}
                  </TableCell>
                  <TableCell>{usuario.rol_empresa ?? '—'}</TableCell>
                  <TableCell>
                    {usuario.activo ? (
                      <Badge
                        variant="outline"
                        className="border-emerald-500 text-emerald-700"
                      >
                        Activo
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-muted-foreground text-muted-foreground"
                      >
                        Inactivo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{formatRelativeDate(usuario.creado_en)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
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
                        {/* Editar — siempre habilitado, incluso para cuenta propia */}
                        <DropdownMenuItem onClick={() => onEdit(usuario)}>
                          Editar
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        {/* Desactivar / Reactivar según estado */}
                        {usuario.activo ? (
                          isOwnAccount ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>
                                  <DropdownMenuItem
                                    disabled
                                    className="cursor-not-allowed opacity-50"
                                  >
                                    Desactivar
                                  </DropdownMenuItem>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                No puedes realizar esta acción sobre tu propia cuenta
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => onDesactivar(usuario)}
                            >
                              Desactivar
                            </DropdownMenuItem>
                          )
                        ) : (
                          <DropdownMenuItem onClick={() => onReactivar(usuario)}>
                            Reactivar
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuSeparator />

                        {/* Eliminar — bloqueado para cuenta propia */}
                        {isOwnAccount ? (
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
                        ) : (
                          <DropdownMenuItem
                            onClick={() => onDelete(usuario)}
                            className="text-destructive focus:text-destructive"
                          >
                            Eliminar
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
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
