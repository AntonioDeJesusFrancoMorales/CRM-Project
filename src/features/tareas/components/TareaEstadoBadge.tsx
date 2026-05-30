// TareaEstadoBadge — muestra el estado client-only de una tarea (ADR-050).
// Reactivo: lee el estado vía useTareaEstado, así se actualiza cuando el menú lo cambia.

import { Badge } from '@/components/ui/badge';
import type { EstadoTareaLocal } from '@/api/types';
import { useTareaEstado } from '../hooks/useTareaEstado';

const estadoLabels: Record<EstadoTareaLocal, string> = {
  pendiente: 'Pendiente',
  en_progreso: 'En progreso',
  completada: 'Completada',
};

const estadoBadgeVariant: Record<EstadoTareaLocal, 'outline' | 'secondary' | 'default'> = {
  pendiente: 'outline',
  en_progreso: 'secondary',
  completada: 'default',
};

interface TareaEstadoBadgeProps {
  tareaId: string;
}

export function TareaEstadoBadge({ tareaId }: TareaEstadoBadgeProps) {
  const [estado] = useTareaEstado(tareaId);

  return <Badge variant={estadoBadgeVariant[estado]}>{estadoLabels[estado]}</Badge>;
}
