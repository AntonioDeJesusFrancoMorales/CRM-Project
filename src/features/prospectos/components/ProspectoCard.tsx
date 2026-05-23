import { MoreVertical, UserCheck } from 'lucide-react';
import type { Prospecto } from '@/api/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { EstadoPosibleCliente } from '@/api/types';

// ADR-028: Select inline para cambio de estado — no DnD
// ADR-026: 'convertido' solo se puede poner via ConvertirProspectoDialog, no inline

const estadoLabels: Record<EstadoPosibleCliente, string> = {
  frio: 'Frío',
  tibio: 'Tibio',
  caliente: 'Caliente',
  convertido: 'Convertido',
};

interface ProspectoCardProps {
  prospecto: Prospecto;
  empresaNombre?: string;
  responsableNombre?: string;
  onEstadoChange: (id: string, nuevoEstado: 'frio' | 'tibio' | 'caliente') => void;
  onEdit: (prospecto: Prospecto) => void;
  onDelete: (prospecto: Prospecto) => void;
  onConvertir: (prospecto: Prospecto) => void;
  onViewDetail: (prospecto: Prospecto) => void;
}

export function ProspectoCard({
  prospecto,
  empresaNombre,
  responsableNombre,
  onEstadoChange,
  onEdit,
  onDelete,
  onConvertir,
  onViewDetail,
}: ProspectoCardProps) {
  const isConvertido = prospecto.estado_posible_cliente === 'convertido';

  function handleEstadoChange(value: string) {
    if (value === 'frio' || value === 'tibio' || value === 'caliente') {
      onEstadoChange(prospecto.id, value);
    }
  }

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow">
      <CardHeader className="pb-2 pt-3 px-3">
        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            className="text-left flex-1 min-w-0"
            onClick={() => onViewDetail(prospecto)}
          >
            <p className="text-sm font-medium leading-tight truncate">
              {prospecto.nombre_contacto}
            </p>
            {empresaNombre && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {empresaNombre}
              </p>
            )}
          </button>

          <div className="flex items-center gap-1 shrink-0">
            {/* Botón "Convertir a cliente" — oculto si ya está convertido (REQ-CONV-ACCION-002) */}
            {!isConvertido && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                title="Convertir a cliente"
                onClick={() => onConvertir(prospecto)}
              >
                <UserCheck className="h-3.5 w-3.5" />
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreVertical className="h-3.5 w-3.5" />
                  <span className="sr-only">Opciones</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onViewDetail(prospecto)}>
                  Ver detalle
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(prospecto)}>
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDelete(prospecto)}
                >
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-3 pb-3 space-y-2">
        {responsableNombre && (
          <p className="text-xs text-muted-foreground">
            Resp: {responsableNombre}
          </p>
        )}

        {/* Select inline de estado — ADR-028, ADR-026 */}
        {isConvertido ? (
          <Badge className="bg-green-100 text-green-700 border-transparent text-xs">
            {estadoLabels.convertido}
          </Badge>
        ) : (
          <Select
            value={prospecto.estado_posible_cliente}
            onValueChange={handleEstadoChange}
          >
            <SelectTrigger className="h-7 text-xs w-full">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="frio">Frío</SelectItem>
              <SelectItem value="tibio">Tibio</SelectItem>
              <SelectItem value="caliente">Caliente</SelectItem>
            </SelectContent>
          </Select>
        )}
      </CardContent>
    </Card>
  );
}
