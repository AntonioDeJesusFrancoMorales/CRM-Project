import { useNavigate } from 'react-router';
import { useState } from 'react';
import type { Contacto, TipoContrato, Trato } from '@/api/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/lib/format';
import { TratoEstadoBadge } from './TratoEstadoBadge';
import { TratoEstadoMenu } from './TratoEstadoMenu';
import { TratoPerderDialog } from './TratoPerderDialog';

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

interface TratosTableProps {
  tratos: Trato[];
  clientes?: Contacto[];
  prospectos?: Contacto[];
  searchTerm?: string;
}

export function TratosTable({
  tratos,
  clientes = [],
  prospectos = [],
  searchTerm,
}: TratosTableProps) {
  const navigate = useNavigate();
  const [perderTrato, setPerderTrato] = useState<Trato | null>(null);

  const clientesById = Object.fromEntries(clientes.map((c) => [c.id, c]));
  const prospectosById = Object.fromEntries(prospectos.map((p) => [p.id, p]));

  const filtered = searchTerm
    ? tratos.filter((t) =>
        t.nombre.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : tratos;

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Valor estimado</TableHead>
            <TableHead>Tipo de contrato</TableHead>
            <TableHead>Vinculado a</TableHead>
            <TableHead>Cierre esperado</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                {searchTerm
                  ? `No se encontraron tratos con "${searchTerm}"`
                  : 'No hay tratos registrados'}
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((trato) => {
              const clienteContacto = trato.cliente_id ? clientesById[trato.cliente_id] : null;
              const prospectoContacto = trato.prospecto_id ? prospectosById[trato.prospecto_id] : null;
              const vinculado = clienteContacto
                ? clienteContacto.nombre
                : prospectoContacto
                  ? prospectoContacto.nombre
                  : null;
              return (
                <TableRow key={trato.id}>
                  <TableCell className="font-medium">
                    <button
                      type="button"
                      onClick={() => void navigate(`/tratos/${trato.id}`)}
                      className="text-left text-primary underline-offset-4 hover:underline focus:underline focus:outline-none"
                    >
                      {trato.nombre}
                    </button>
                  </TableCell>
                  <TableCell>
                    <TratoEstadoBadge estado={trato.estado} />
                  </TableCell>
                  <TableCell>{formatCurrency(trato.valor_estimado)}</TableCell>
                  <TableCell>
                    {trato.tipo_contrato ? tipoContratoLabels[trato.tipo_contrato] : '—'}
                  </TableCell>
                  <TableCell>{vinculado ?? '—'}</TableCell>
                  <TableCell>{formatDate(trato.fecha_cierre_esperada)}</TableCell>
                  <TableCell>
                    <TratoEstadoMenu
                      trato={trato}
                      onPerder={() => setPerderTrato(trato)}
                    />
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {perderTrato && (
        <TratoPerderDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) setPerderTrato(null);
          }}
          tratoId={perderTrato.id}
          nombre={perderTrato.nombre}
        />
      )}
    </>
  );
}
