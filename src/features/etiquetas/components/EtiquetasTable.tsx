import { useMemo, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
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
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Buscar por nombre"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
          aria-label="Buscar etiquetas"
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Etiqueta</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Color</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                No se encontraron etiquetas con esos filtros
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((etiqueta) => (
              <TableRow key={etiqueta.id} className="group">
                <TableCell className="font-medium">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full border"
                      style={{ backgroundColor: etiqueta.color, borderColor: etiqueta.color }}
                      aria-hidden="true"
                    />
                    {etiqueta.nombre}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{tipoLabel[etiqueta.tipoEtiqueta]}</Badge>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {etiqueta.color}
                </TableCell>
                <TableCell>
                  {(canEdit || canDelete) && <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Acciones">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                       {canEdit && <DropdownMenuItem onClick={() => onEdit(etiqueta)}>Editar</DropdownMenuItem>}
                       {canEdit && canDelete && <DropdownMenuSeparator />}
                       {canDelete && (
                         <DropdownMenuItem
                           onClick={() => onDelete(etiqueta)}
                           className="text-destructive focus:text-destructive"
                         >
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
    </div>
  );
}
