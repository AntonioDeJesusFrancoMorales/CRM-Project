import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Link } from 'react-router';
import type { EstadoTrato, TipoContrato, Trato } from '@/api/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { useTratos } from '@/features/tratos/hooks/useTratos';
import { TratoCreateDialog } from '@/features/tratos/components/TratoCreateDialog';

// ADR-036: lazy load por montaje. useTratos solo dispara fetch cuando el componente está
// montado (dentro de <TabsContent value="tratos">).
// ADR-041 (Change 6a): migrado de useTratosByCliente a useTratos({ cliente_id }).
// Change 6a Lote E: agregado botón "Nuevo trato" (prefill cliente_id) + Link al detalle del trato.

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
            <TableCell className="font-medium">
              <Link
                to={`/tratos/${trato.id}`}
                className="text-primary underline-offset-4 hover:underline focus:underline focus:outline-none"
              >
                {trato.nombre}
              </Link>
            </TableCell>
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

export function ClienteTratosTab({ clienteId }: ClienteTratosTabProps) {
  const { data, isLoading, isError } = useTratos({ cliente_id: clienteId });
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Header con botón crear (siempre visible) */}
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          Nuevo trato
        </Button>
      </div>

      {/* Contenido */}
      {isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Cargando tratos...
        </p>
      ) : isError ? (
        <p className="py-8 text-center text-sm text-destructive">
          Error al cargar los tratos. Intenta de nuevo.
        </p>
      ) : !data?.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">Sin tratos vinculados</p>
          </CardContent>
        </Card>
      ) : (
        <TratosTable tratos={data} />
      )}

      {/* Dialog crear trato — prefill con cliente actual */}
      <TratoCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultValues={{ asociacion: 'cliente', cliente_id: clienteId }}
      />
    </div>
  );
}
