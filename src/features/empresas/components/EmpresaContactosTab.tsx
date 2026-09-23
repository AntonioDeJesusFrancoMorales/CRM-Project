import { ContactRound, RefreshCw } from 'lucide-react';
import { Link } from 'react-router';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useEmpresaContactos } from '@/features/contactos/hooks/useEmpresaContactos';
import {
  estadoRelacionBadgeClass,
  estadoRelacionLabels,
} from '@/features/empresas/lib/estadoRelacion';

interface EmpresaContactosTabProps {
  empresaId: string;
}

export function EmpresaContactosTab({ empresaId }: EmpresaContactosTabProps) {
  const { data, isLoading, isError, refetch } = useEmpresaContactos(empresaId);

  if (isLoading) {
    return (
      <Card aria-busy="true" aria-label="Cargando contactos">
        <TableSkeleton columns={5} rows={4} />
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="space-y-3 py-12 text-center">
          <p className="text-sm text-destructive">No fue posible cargar los contactos.</p>
          <Button variant="outline" onClick={() => void refetch()}>
            <RefreshCw data-icon="inline-start" aria-hidden="true" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data?.length) {
    return (
      <Card>
        <CardContent className="p-0">
          <EmptyState
            icon={ContactRound}
            title="Esta empresa no tiene contactos vinculados"
            description="Los contactos vinculados a esta empresa aparecerán aquí."
            className="rounded-none border-0 py-16"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden rounded-lg shadow-none">
      <Table className="min-w-[760px]">
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-transparent">
            <TableHead>Contacto</TableHead>
            <TableHead>Cargo</TableHead>
            <TableHead>Correo</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((contacto) => (
            <TableRow key={contacto.id} className="group/row">
              <TableCell>
                <Link
                  to={`/contactos/${contacto.id}`}
                  className="font-medium underline-offset-4 transition-colors hover:text-primary hover:underline focus:text-primary focus:underline focus:outline-none"
                >
                  {contacto.nombre}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">{contacto.cargo ?? '—'}</TableCell>
              <TableCell className="text-muted-foreground">
                {contacto.correo ? (
                  <a
                    href={`mailto:${contacto.correo}`}
                    className="hover:text-foreground hover:underline"
                  >
                    {contacto.correo}
                  </a>
                ) : (
                  '—'
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {contacto.telefono ? (
                  <a
                    href={`tel:${contacto.telefono}`}
                    className="hover:text-foreground hover:underline"
                  >
                    {contacto.telefono}
                  </a>
                ) : (
                  '—'
                )}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn('rounded-full', estadoRelacionBadgeClass[contacto.estadoRelacion])}
                >
                  {estadoRelacionLabels[contacto.estadoRelacion]}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
