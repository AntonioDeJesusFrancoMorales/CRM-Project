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

const ESTADO_LABELS: Record<string, string> = {
  PROSPECTO: 'Prospecto',
  ACTIVO: 'Activo',
  INACTIVO: 'Inactivo',
};

const ESTADO_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  PROSPECTO: 'outline',
  ACTIVO: 'default',
  INACTIVO: 'secondary',
};

interface ContactosTableProps {
  contactos: Contacto[];
  onEdit: (contacto: Contacto) => void;
  onDelete: (contacto: Contacto) => void;
}

export function ContactosTable({ contactos, onEdit, onDelete }: ContactosTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Correo</TableHead>
          <TableHead>¿Cómo nos conoció?</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {contactos.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
              No hay contactos registrados
            </TableCell>
          </TableRow>
        ) : (
          contactos.map((contacto) => (
            <TableRow key={contacto.id}>
              <TableCell className="font-medium">
                <Link
                  to={`/contactos/${contacto.id}`}
                  className="text-primary underline-offset-4 hover:underline focus:underline focus:outline-none"
                >
                  {contacto.nombre}
                </Link>
              </TableCell>
              <TableCell>
                <Badge variant={ESTADO_VARIANT[contacto.estadoRelacion]}>
                  {ESTADO_LABELS[contacto.estadoRelacion] ?? contacto.estadoRelacion}
                </Badge>
              </TableCell>
              <TableCell>{contacto.correo ?? '—'}</TableCell>
              <TableCell>{contacto.comoNosConocio ?? '—'}</TableCell>
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
