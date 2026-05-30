import { Link } from 'react-router';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useEmpresaContactos } from '@/features/contactos/hooks/useEmpresaContactos';
import type { EstadoRelacion } from '@/api/types';

interface EmpresaContactosTabProps {
  empresaId: string;
}

const ESTADO_LABELS: Record<EstadoRelacion, string> = {
  PROSPECTO: 'Prospecto',
  ACTIVO: 'Activo',
  INACTIVO: 'Inactivo',
};

const ESTADO_VARIANT: Record<EstadoRelacion, 'default' | 'secondary' | 'outline'> = {
  PROSPECTO: 'outline',
  ACTIVO: 'default',
  INACTIVO: 'secondary',
};

export function EmpresaContactosTab({ empresaId }: EmpresaContactosTabProps) {
  const { data, isLoading, isError } = useEmpresaContactos(empresaId);

  if (isLoading) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Cargando contactos...
      </p>
    );
  }

  if (isError) {
    return (
      <p className="py-8 text-center text-sm text-destructive">
        Error al cargar contactos
      </p>
    );
  }

  if (!data?.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Esta empresa no tiene contactos vinculados
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Correo</TableHead>
          <TableHead>Teléfono</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((contacto) => (
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
                {ESTADO_LABELS[contacto.estadoRelacion]}
              </Badge>
            </TableCell>
            <TableCell>{contacto.correo ?? '—'}</TableCell>
            <TableCell>{contacto.telefono ?? '—'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
