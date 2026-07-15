import { Badge } from '@/components/ui/badge';
import type { TareaWorkflowState } from '../lib/tareaWorkflow';

const FALLBACK_STATE: TareaWorkflowState = {
  tareaId: '',
  fichaId: null,
  columnaId: null,
  nombre: 'Sin columna',
  color: null,
};

interface TareaEstadoBadgeProps {
  workflowState?: TareaWorkflowState;
  /** @deprecated El estado ya no se resuelve por tareaId/localStorage; usar workflowState. */
  tareaId?: string;
}

export function TareaEstadoBadge({ workflowState }: TareaEstadoBadgeProps) {
  const state = workflowState ?? FALLBACK_STATE;

  return (
    <Badge
      variant={state.columnaId ? 'secondary' : 'outline'}
      style={state.color ? { borderColor: state.color } : undefined}
    >
      {state.nombre}
    </Badge>
  );
}
