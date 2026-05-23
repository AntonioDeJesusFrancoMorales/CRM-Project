import { ChevronDown } from 'lucide-react';
import { Link } from 'react-router';
import type { Cliente, Empresa, Prospecto, Usuario } from '@/api/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { formatDate } from '@/lib/format';

// ADR-023: join client-side por prospecto_origen_id para timestamp de conversión
// REQ-CONV-TAB-001..004

interface ConvertidoItem {
  prospecto: Prospecto;
  cliente: Cliente;
  empresa?: Empresa;
  responsable?: Usuario;
}

interface ProspectoConvertidosListProps {
  prospectos: Prospecto[];
  clientes: Cliente[];
  empresas: Empresa[];
  usuarios: Usuario[];
}

function isMismoPeriodo(isoDate: string, now: Date): boolean {
  const d = new Date(isoDate);
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

// Lote G — Fix 3: filas clickeables hacia el detalle del prospecto.
// Patrón Option B: el <Link> de fila envuelve toda la fila; el link de empresa
// usa onClick con stopPropagation para evitar links anidados (viola a11y).
// Se usa <a> explícito con role="link" para el link de empresa dentro del <Link>.
function ConvertidoRow({ item }: { item: ConvertidoItem }) {
  return (
    <Link
      to={`/prospectos/${item.prospecto.id}`}
      className="flex items-center justify-between py-3 border-b last:border-0 cursor-pointer hover:bg-muted/40 transition-colors rounded-sm"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{item.prospecto.nombre_contacto}</p>
        {item.empresa && (
          <Link
            to={`/empresas/${item.empresa.id}`}
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-muted-foreground truncate hover:underline"
          >
            {item.empresa.nombre}
          </Link>
        )}
      </div>
      <div className="text-right shrink-0 ml-4">
        <Badge className="bg-green-100 text-green-700 border-transparent text-xs">
          Convertido
        </Badge>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDate(item.cliente.creado_en)}
        </p>
      </div>
    </Link>
  );
}

export function ProspectoConvertidosList({
  prospectos,
  clientes,
  empresas,
  usuarios,
}: ProspectoConvertidosListProps) {
  const empresasById = Object.fromEntries(empresas.map((e) => [e.id, e]));
  const usuariosById = Object.fromEntries(usuarios.map((u) => [u.id, u]));

  // Join client-side: para cada prospecto convertido, buscar el cliente con prospecto_origen_id
  const convertidos = prospectos.filter(
    (p) => p.estado_posible_cliente === 'convertido',
  );

  const items: ConvertidoItem[] = convertidos.reduce<ConvertidoItem[]>((acc, p) => {
    const cliente = clientes.find((c) => c.prospecto_origen_id === p.id);
    if (!cliente) return acc;
    acc.push({
      prospecto: p,
      cliente,
      empresa: empresasById[p.empresa_id],
      responsable: usuariosById[p.responsable_id],
    });
    return acc;
  }, []);

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Aún no hay prospectos convertidos
          </p>
        </CardContent>
      </Card>
    );
  }

  const now = new Date();

  const esteMes = items.filter((item) =>
    isMismoPeriodo(item.cliente.creado_en, now),
  );

  const anteriores = items.filter(
    (item) => !isMismoPeriodo(item.cliente.creado_en, now),
  );

  return (
    <div className="space-y-6">
      {/* Sección "Convertidos este mes" */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Convertidos este mes
        </h3>
        {esteMes.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground">Sin conversiones este mes</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="px-4 py-0">
              {esteMes.map((item) => (
                <ConvertidoRow key={item.prospecto.id} item={item} />
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sección "Anteriores" — Collapsible (REQ-CONV-TAB-002) */}
      {anteriores.length > 0 && (
        <Collapsible>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group">
            <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
            Ver convertidos anteriores ({anteriores.length})
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <Card>
              <CardContent className="px-4 py-0">
                {anteriores.map((item) => (
                  <ConvertidoRow key={item.prospecto.id} item={item} />
                ))}
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
