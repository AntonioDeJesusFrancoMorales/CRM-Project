import { useMemo, useState } from 'react';
import { MoreHorizontal, Search } from 'lucide-react';
import type { Etiqueta } from '@/api/types';
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

interface EtiquetasTableProps {
  etiquetas: Etiqueta[];
  onEdit: (etiqueta: Etiqueta) => void;
  onDelete: (etiqueta: Etiqueta) => void;
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

const tipoLabel: Record<Etiqueta['tipoEtiqueta'], string> = {
  TRATO: 'Trato',
  TAREA: 'Tarea',
};

export function EtiquetasTable({ etiquetas, onEdit, onDelete, canEdit = true, canDelete = true }: EtiquetasTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(() => {
    const term = normalizar(searchTerm.trim());
    if (term === '') return etiquetas;
    return etiquetas.filter((e) => normalizar(e.nombre).includes(term));
  }, [etiquetas, searchTerm]);

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
            placeholder="Buscar por nombre"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 pl-9"
            aria-label="Buscar etiquetas"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center px-6 py-16 text-center">
          <Search className="size-8 text-muted-foreground/50" aria-hidden="true" />
          <p className="mt-3 font-medium">No se encontraron etiquetas con esos filtros</p>
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
        <Table className="min-w-[600px]">
          <TableHeader className="bg-muted/50 text-left text-xs text-muted-foreground">
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-auto px-4 py-3 font-medium text-muted-foreground">
                Etiqueta
              </TableHead>
              <TableHead className="h-auto px-4 py-3 font-medium text-muted-foreground">
                Tipo
              </TableHead>
              <TableHead className="h-auto px-4 py-3 font-medium text-muted-foreground">
                Color
              </TableHead>
              <TableHead className="h-auto w-12 px-4 py-3 text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((etiqueta) => (
              <TableRow key={etiqueta.id} className="group/row hover:bg-muted/30">
                <TableCell className="px-4 py-3 font-medium">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="size-2.5 shrink-0 rounded-full border"
                      style={{ backgroundColor: etiqueta.color, borderColor: etiqueta.color }}
                      aria-hidden="true"
                    />
                    {etiqueta.nombre}
                  </span>
                </TableCell>
                <TableCell className="px-4 py-3">
                  <Badge
                    variant="secondary"
                    className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
                  >
                    {tipoLabel[etiqueta.tipoEtiqueta]}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-3 font-mono text-xs text-muted-foreground">
                  {etiqueta.color}
                </TableCell>
                <TableCell className="w-12 px-4 py-3 text-right">
                  {(canEdit || canDelete) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Acciones para ${etiqueta.nombre}`}
                          className="text-muted-foreground"
                        >
                          <MoreHorizontal aria-hidden="true" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32">
                        {canEdit && (
                          <DropdownMenuItem
                            className="px-2 py-1.5"
                            onClick={() => onEdit(etiqueta)}
                          >
                            Editar
                          </DropdownMenuItem>
                        )}
                        {canEdit && canDelete && <DropdownMenuSeparator />}
                        {canDelete && (
                          <DropdownMenuItem
                            onClick={() => onDelete(etiqueta)}
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
