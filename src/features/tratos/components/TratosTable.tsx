import { useNavigate } from 'react-router';
import type { Contacto, TipoContrato, Trato, Usuario } from '@/api/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/lib/format';

const tipoContratoLabels: Record<TipoContrato, string> = {
  SERVICIO: 'Servicio',
  LICENCIA: 'Licencia',
  SUSCRIPCION: 'Suscripción',
  PERMANENTE: 'Permanente',
  OTRO: 'Otro',
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
  contactos?: Contacto[];
  usuarios?: Usuario[];
  searchTerm?: string;
}

export function TratosTable({
  tratos,
  contactos = [],
  usuarios = [],
  searchTerm,
}: TratosTableProps) {
  const navigate = useNavigate();

  // Lookup Maps para resolución client-side
  const contactosById = new Map(contactos.map((c) => [c.id, c]));
  const usuariosById = new Map(usuarios.map((u) => [u.id, u]));

  const filtered = searchTerm
    ? tratos.filter((t) =>
        t.nombre.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : tratos;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Valor estimado</TableHead>
          <TableHead>Tipo de contrato</TableHead>
          <TableHead>Contacto</TableHead>
          <TableHead>Responsable</TableHead>
          <TableHead>Cierre esperado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filtered.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
              {searchTerm
                ? `No se encontraron tratos con "${searchTerm}"`
                : 'No hay tratos registrados'}
            </TableCell>
          </TableRow>
        ) : (
          filtered.map((trato) => {
            const contacto = contactosById.get(trato.contactoId);
            const responsable = usuariosById.get(trato.responsableId);
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
                <TableCell>{formatCurrency(trato.valorEstimado)}</TableCell>
                <TableCell>{tipoContratoLabels[trato.tipoContrato]}</TableCell>
                <TableCell>{contacto?.nombre ?? '—'}</TableCell>
                <TableCell>{responsable?.nombre ?? '—'}</TableCell>
                <TableCell>{formatDate(trato.fechaCierreEsperada)}</TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
