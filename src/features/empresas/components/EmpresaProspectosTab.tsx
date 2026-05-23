import type { EstadoPosibleCliente } from '@/api/types';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useEmpresaProspectos } from '../hooks/useEmpresaProspectos';

interface EmpresaProspectosTabProps {
  empresaId: string;
}

const estadoBadgeClass: Record<EstadoPosibleCliente, string> = {
  frio: 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700',
  tibio: 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700',
  caliente: 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700',
  convertido: 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700',
};

const estadoLabel: Record<EstadoPosibleCliente, string> = {
  frio: 'Frío',
  tibio: 'Tibio',
  caliente: 'Caliente',
  convertido: 'Convertido',
};

export function EmpresaProspectosTab({ empresaId }: EmpresaProspectosTabProps) {
  const { data, isLoading, isError } = useEmpresaProspectos(empresaId);

  if (isLoading) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Cargando prospectos...
      </p>
    );
  }

  if (isError) {
    return (
      <p className="py-8 text-center text-sm text-destructive">
        Error al cargar prospectos
      </p>
    );
  }

  if (!data?.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Esta empresa no tiene prospectos vinculados
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Contacto</TableHead>
          <TableHead>Correo</TableHead>
          <TableHead>Teléfono</TableHead>
          <TableHead>Estado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((prospecto) => (
          <TableRow key={prospecto.id}>
            <TableCell className="font-medium">{prospecto.nombre_contacto}</TableCell>
            <TableCell>{prospecto.correo_contacto ?? '—'}</TableCell>
            <TableCell>{prospecto.telefono_contacto ?? '—'}</TableCell>
            <TableCell>
              <span className={estadoBadgeClass[prospecto.estado_posible_cliente]}>
                {estadoLabel[prospecto.estado_posible_cliente]}
              </span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
