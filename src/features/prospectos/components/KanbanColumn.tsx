import type { Empresa, Prospecto, Usuario } from '@/api/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ProspectoCard } from './ProspectoCard';

interface KanbanColumnProps {
  label: string;
  prospectos: Prospecto[];
  empresasById: Record<string, Empresa>;
  usuariosById: Record<string, Usuario>;
  onEstadoChange: (id: string, nuevoEstado: 'frio' | 'tibio' | 'caliente') => void;
  onEdit: (prospecto: Prospecto) => void;
  onDelete: (prospecto: Prospecto) => void;
  onConvertir: (prospecto: Prospecto) => void;
  onViewDetail: (prospecto: Prospecto) => void;
}

export function KanbanColumn({
  label,
  prospectos,
  empresasById,
  usuariosById,
  onEstadoChange,
  onEdit,
  onDelete,
  onConvertir,
  onViewDetail,
}: KanbanColumnProps) {
  return (
    <Card className="flex flex-col h-full min-h-[400px]">
      <CardHeader className="pb-3 pt-4 px-4 shrink-0">
        <CardTitle className="text-sm font-semibold flex items-center justify-between">
          <span>{label}</span>
          <span className="text-xs font-normal text-muted-foreground tabular-nums">
            {prospectos.length}
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 px-3 pb-3 overflow-hidden">
        <ScrollArea className="h-full pr-1">
          {prospectos.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground">
              Sin prospectos en este estado
            </p>
          ) : (
            <div className="space-y-2">
              {prospectos.map((prospecto) => (
                <ProspectoCard
                  key={prospecto.id}
                  prospecto={prospecto}
                  empresaNombre={empresasById[prospecto.empresa_id]?.nombre}
                  responsableNombre={usuariosById[prospecto.responsable_id]?.nombre}
                  onEstadoChange={onEstadoChange}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onConvertir={onConvertir}
                  onViewDetail={onViewDetail}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
