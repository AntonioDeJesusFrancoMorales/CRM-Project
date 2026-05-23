import type { EstadoTrato, TipoContrato, Trato } from '@/api/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/lib/format';
import { useTratosByCliente } from '../hooks/useTratosByCliente';

// ADR-036: lazy load por montaje. useTratosByCliente(id) solo dispara fetch cuando
// el componente está montado (dentro de <TabsContent value="tratos">).
// ADR-039 T_D.8: sin botón crear trato (Change 6), sin links a detalle de trato.

// ── Labels ─────────────────────────────────────────────────────────────────

const estadoTratoLabels: Record<EstadoTrato, string> = {
  abierto: 'Abierto',
  ganado: 'Ganado',
  perdido: 'Perdido',
};

const estadoTratoClasses: Record<EstadoTrato, string> = {
  abierto: 'bg-blue-100 text-blue-700 border-transparent',
  ganado: 'bg-green-100 text-green-700 border-transparent',
  perdido: 'bg-red-100 text-red-700 border-transparent',
};

const tipoContratoLabels: Record<TipoContrato, string> = {
  precio_fijo: 'Precio fijo',
  tiempo_materiales: 'Tiempo y materiales',
  retainer: 'Retainer',
};

function formatCurrency(value: number | null): string {
  if (value === null) return '—';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(value);
}

// ── Sub-components ──────────────────────────────────────────────────────────

function TratosTable({ tratos }: { tratos: Trato[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Valor estimado</TableHead>
          <TableHead>Tipo de contrato</TableHead>
          <TableHead>Cierre esperado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tratos.map((trato) => (
          <TableRow key={trato.id}>
            <TableCell className="font-medium">{trato.nombre}</TableCell>
            <TableCell>
              <Badge className={estadoTratoClasses[trato.estado]}>
                {estadoTratoLabels[trato.estado]}
              </Badge>
            </TableCell>
            <TableCell>{formatCurrency(trato.valor_estimado)}</TableCell>
            <TableCell>
              {trato.tipo_contrato ? tipoContratoLabels[trato.tipo_contrato] : '—'}
            </TableCell>
            <TableCell>{formatDate(trato.fecha_cierre_esperada)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ── Props ───────────────────────────────────────────────────────────────────

interface ClienteTratosTabProps {
  clienteId: string;
}

// ── Main component ───────────────────────────────────────────────────────────

/**
 * Tab de tratos vinculados a un Cliente.
 * Container — llama useTratosByCliente con lazy implícito por montaje en TabsContent.
 * REQ-07 — ADR-036
 */
export function ClienteTratosTab({ clienteId }: ClienteTratosTabProps) {
  const { data, isLoading, isError } = useTratosByCliente(clienteId);

  if (isLoading) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Cargando tratos...
      </p>
    );
  }

  if (isError) {
    return (
      <p className="py-8 text-center text-sm text-destructive">
        Error al cargar los tratos. Intenta de nuevo.
      </p>
    );
  }

  if (!data?.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-muted-foreground">Sin tratos vinculados</p>
        </CardContent>
      </Card>
    );
  }

  return <TratosTable tratos={data} />;
}
