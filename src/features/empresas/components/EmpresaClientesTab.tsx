import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useEmpresaClientes } from '../hooks/useEmpresaClientes';

interface EmpresaClientesTabProps {
  empresaId: string;
}

export function EmpresaClientesTab({ empresaId }: EmpresaClientesTabProps) {
  const { data, isLoading, isError } = useEmpresaClientes(empresaId);

  if (isLoading) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Cargando clientes...
      </p>
    );
  }

  if (isError) {
    return (
      <p className="py-8 text-center text-sm text-destructive">
        Error al cargar clientes
      </p>
    );
  }

  if (!data?.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Esta empresa no tiene clientes vinculados
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
          <TableHead>Cargo</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((cliente) => (
          <TableRow key={cliente.id}>
            <TableCell className="font-medium">{cliente.nombre_contacto}</TableCell>
            <TableCell>{cliente.correo_contacto ?? '—'}</TableCell>
            <TableCell>{cliente.telefono_contacto ?? '—'}</TableCell>
            <TableCell>{cliente.cargo_contacto ?? '—'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
