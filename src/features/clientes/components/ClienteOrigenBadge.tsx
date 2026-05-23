import { Link } from 'react-router';
import { Badge } from '@/components/ui/badge';

// ADR-037: el Link del badge NO puede estar anidado dentro de otro <Link> o <button>.
// Este componente debe usarse siempre fuera de elementos interactivos contenedores.

interface ClienteOrigenBadgeProps {
  prospectoOrigenId: string | null;
}

export function ClienteOrigenBadge({ prospectoOrigenId }: ClienteOrigenBadgeProps) {
  if (prospectoOrigenId !== null) {
    return (
      <Link
        to={`/prospectos/${prospectoOrigenId}`}
        className="inline-flex"
      >
        <Badge className="bg-green-100 text-green-700 border-transparent hover:bg-green-200 cursor-pointer">
          Origen: Prospecto convertido
        </Badge>
      </Link>
    );
  }

  return (
    <Badge className="bg-slate-100 text-slate-700 border-transparent">
      Origen: Manual
    </Badge>
  );
}
