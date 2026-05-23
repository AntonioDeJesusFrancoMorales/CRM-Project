import { useNavigate } from 'react-router';
import type { Cliente, Empresa } from '@/api/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatRelativeDate } from '@/lib/format';
import { ClienteOrigenBadge } from './ClienteOrigenBadge';

// ADR-037: ClienteOrigenBadge NO debe estar anidado dentro de un <button> o <Link>.
// La tabla usa un <button> solo para el nombre_contacto (navigate al detalle).
// La empresa se muestra como texto sin link (el link a empresa es del Lote E+).

interface ClientesTableProps {
  clientes: Cliente[];
  empresas?: Empresa[];
  searchTerm?: string;
}

export function ClientesTable({ clientes, empresas = [], searchTerm }: ClientesTableProps) {
  const navigate = useNavigate();

  const empresasById = Object.fromEntries(empresas.map((e) => [e.id, e]));

  const filtered = searchTerm
    ? clientes.filter((c) =>
        c.nombre_contacto.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : clientes;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Empresa</TableHead>
          <TableHead>Contacto</TableHead>
          <TableHead>Origen</TableHead>
          <TableHead>Registrado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filtered.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
              {searchTerm
                ? `No se encontraron clientes con "${searchTerm}"`
                : 'No hay clientes registrados'}
            </TableCell>
          </TableRow>
        ) : (
          filtered.map((cliente) => {
            const empresa = empresasById[cliente.empresa_id];
            return (
              <TableRow key={cliente.id}>
                <TableCell className="font-medium">
                  <button
                    type="button"
                    onClick={() => void navigate(`/clientes/${cliente.id}`)}
                    className="text-left text-primary underline-offset-4 hover:underline focus:underline focus:outline-none"
                  >
                    {cliente.nombre_contacto}
                  </button>
                </TableCell>
                <TableCell>{empresa?.nombre ?? '—'}</TableCell>
                <TableCell>
                  <div className="space-y-0.5">
                    {cliente.correo_contacto ? (
                      <p className="text-sm">{cliente.correo_contacto}</p>
                    ) : null}
                    {cliente.telefono_contacto ? (
                      <p className="text-sm text-muted-foreground">{cliente.telefono_contacto}</p>
                    ) : null}
                    {!cliente.correo_contacto && !cliente.telefono_contacto ? (
                      <span className="text-muted-foreground">—</span>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>
                  {/* ADR-037: ClienteOrigenBadge fuera de cualquier contenedor interactivo */}
                  <ClienteOrigenBadge prospectoOrigenId={cliente.prospecto_origen_id} />
                </TableCell>
                <TableCell>{formatRelativeDate(cliente.creado_en)}</TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
