import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { EstadoRelacion } from '@/api/types';
import { puedeTransicionar } from '../hooks/useTransicionEstado';

const ESTADO_LABELS: Record<EstadoRelacion, string> = {
  PROSPECTO: 'Prospecto',
  ACTIVO: 'Activo',
  INACTIVO: 'Inactivo',
};

const ESTADOS: EstadoRelacion[] = ['PROSPECTO', 'ACTIVO', 'INACTIVO'];

interface EstadoRelacionSelectProps {
  actual: EstadoRelacion;
  tieneTratosActivos: boolean;
  value: EstadoRelacion;
  onChange: (value: EstadoRelacion) => void;
  disabled?: boolean;
}

export function EstadoRelacionSelect({
  actual,
  tieneTratosActivos,
  value,
  onChange,
  disabled,
}: EstadoRelacionSelectProps) {
  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as EstadoRelacion)}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ESTADOS.map((estado) => {
          const { ok, razon } = puedeTransicionar(actual, estado, tieneTratosActivos);

          if (!ok && razon) {
            return (
              <Tooltip key={estado}>
                <TooltipTrigger asChild>
                  {/* Span wrapper necesario: SelectItem con disabled no acepta asChild */}
                  <span>
                    <SelectItem value={estado} disabled>
                      {ESTADO_LABELS[estado]}
                    </SelectItem>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {razon}
                </TooltipContent>
              </Tooltip>
            );
          }

          return (
            <SelectItem key={estado} value={estado}>
              {ESTADO_LABELS[estado]}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
