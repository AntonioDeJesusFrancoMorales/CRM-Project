import { MoreHorizontal } from 'lucide-react';
import type { Empresa } from '@/api/types';
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
import { formatRelativeDate } from '@/lib/format';

interface EmpresasTableProps {
  empresas: Empresa[];
  onView: (empresa: Empresa) => void;
  onEdit: (empresa: Empresa) => void;
  onDelete: (empresa: Empresa) => void;
  searchTerm?: string;
}

export function EmpresasTable({
  empresas,
  onView,
  onEdit,
  onDelete,
  searchTerm,
}: EmpresasTableProps) {
  const filtered = searchTerm
    ? empresas.filter((e) => {
        const term = searchTerm.toLowerCase();
        return (
          e.nombre.toLowerCase().includes(term) ||
          (e.sector?.toLowerCase().includes(term) ?? false)
        );
      })
    : empresas;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Sector</TableHead>
          <TableHead>Teléfono</TableHead>
          <TableHead>Sitio Web</TableHead>
          <TableHead>Creado</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {filtered.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
              {searchTerm
                ? `No se encontraron empresas con "${searchTerm}"`
                : 'No hay empresas registradas'}
            </TableCell>
          </TableRow>
        ) : (
          filtered.map((empresa) => (
            <TableRow key={empresa.id}>
              <TableCell className="font-medium">
                <button
                  type="button"
                  onClick={() => onView(empresa)}
                  className="text-left text-primary underline-offset-4 hover:underline focus:underline focus:outline-none"
                >
                  {empresa.nombre}
                </button>
              </TableCell>
              <TableCell>{empresa.sector ?? '—'}</TableCell>
              <TableCell>{empresa.telefono ?? '—'}</TableCell>
              <TableCell>
                {empresa.pagina_web ? (
                  <a
                    href={empresa.pagina_web}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline underline-offset-4 hover:text-primary/80"
                  >
                    {empresa.pagina_web}
                  </a>
                ) : (
                  '—'
                )}
              </TableCell>
              <TableCell>{formatRelativeDate(empresa.creado_en)}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Acciones">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView(empresa)}>
                      Ver detalle
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(empresa)}>
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(empresa)}
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
  );
}
