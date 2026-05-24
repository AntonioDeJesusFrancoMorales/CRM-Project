import type { EstadoTrato } from '@/api/types';
import { Badge } from '@/components/ui/badge';

const labels: Record<EstadoTrato, string> = {
  abierto: 'Abierto',
  ganado: 'Ganado',
  perdido: 'Perdido',
};

const classes: Record<EstadoTrato, string> = {
  abierto: 'bg-blue-100 text-blue-700 border-transparent',
  ganado: 'bg-green-100 text-green-700 border-transparent',
  perdido: 'bg-red-100 text-red-700 border-transparent',
};

interface TratoEstadoBadgeProps {
  estado: EstadoTrato;
}

export function TratoEstadoBadge({ estado }: TratoEstadoBadgeProps) {
  return <Badge className={classes[estado]}>{labels[estado]}</Badge>;
}
