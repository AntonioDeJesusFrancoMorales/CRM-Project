import { Link } from 'react-router';
import { MoreHorizontal } from 'lucide-react';
import type { Contacto } from '@/api/types';
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
import { formatRelativeDate } from '@/lib/format';
import {
  estadoRelacionBadgeClass,
  estadoRelacionLabels,
} from '../lib/estadoRelacion';

interface ContactosTableProps {
  contactos: Contacto[];
  onEdit: (contacto: Contacto) => void;
  onDelete: (contacto: Contacto) => void;
  searchTerm?: string;
}

export function ContactosTable({
  contactos,
  onEdit,
  onDelete,
  searchTerm,
}: ContactosTableProps) {
  const filtered = searchTerm
    ? contactos.filter((c) => {
        const term = searchTerm.toLowerCase();
        return (
          c.nombre.toLowerCase().includes(term) ||
          (c.correo?.toLowerCase().includes(term) ?? false) ||
          (c.cargo?.toLowerCase().includes(term) ?? false)
        );
      })
    : contactos;

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Nombre</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Cargo</TableHead>
          <TableHead>Correo</TableHead>
          <TableHead>¿Cómo nos conoció?</TableHead>
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
              {searchTerm
                ? `No se encontraron contactos con "${searchTerm}"`
                : 'No hay contactos registrados'}
            </TableCell>
          </TableRow>
        ) : (
          filtered.map((contacto) => (
            <TableRow key={contacto.id} className="group">
              <TableCell className="font-medium">
                <Link
                  to={`/contactos/${contacto.id}`}
                  className="text-left font-medium underline-offset-4 transition-colors hover:text-primary hover:underline focus:text-primary focus:underline focus:outline-none"
                >
                  {contacto.nombre}
                </Link>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={estadoRelacionBadgeClass[contacto.estadoRelacion]}
                >
                  {estadoRelacionLabels[contacto.estadoRelacion]}
                </Badge>
              </TableCell>
              <TableCell>{contacto.cargo ?? '—'}</TableCell>
              <TableCell>{contacto.correo ?? '—'}</TableCell>
              <TableCell>{contacto.comoNosConocio ?? '—'}</TableCell>
              <TableCell className="text-muted-foreground">
                {formatRelativeDate(contacto.creadoEn)}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Acciones">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(contacto)}>
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(contacto)}
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
