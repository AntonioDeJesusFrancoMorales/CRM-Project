import { UserCheck, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Conversacion, Usuario } from '@/api/types';
import { useAsignarAgente } from '../hooks/useAsignarAgente';
import { useCerrarConversacion } from '../hooks/useCerrarConversacion';

interface Props {
  conversacion: Conversacion;
  usuarios: Usuario[];
  empresaId: string;
}

export function ConversacionHeader({ conversacion, usuarios, empresaId }: Props) {
  const asignarMut = useAsignarAgente();
  const cerrarMut = useCerrarConversacion();

  const isCerrada = conversacion.estado === 'CERRADA';

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
      <div>
        <p className="font-semibold text-sm">
          {conversacion.nombreContacto ?? conversacion.numeroTelefono}
        </p>
        <p className="text-xs text-muted-foreground">{conversacion.numeroTelefono}</p>
      </div>

      <div className="flex items-center gap-2">
        {isCerrada && <Badge variant="secondary">Cerrada</Badge>}

        {!isCerrada && (
          <>
            <Select
              value={conversacion.asignadoA ?? ''}
              onValueChange={(agenteId) =>
                asignarMut.mutate({ conversacionId: conversacion.id, agenteId, empresaId })
              }
            >
              <SelectTrigger className="w-40 h-8 text-xs">
                <UserCheck className="h-3.5 w-3.5 mr-1" />
                <SelectValue placeholder="Asignar agente" />
              </SelectTrigger>
              <SelectContent>
                {usuarios.map((u) => (
                  <SelectItem key={u.id} value={u.id} className="text-xs">
                    {u.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              disabled={cerrarMut.isPending}
              onClick={() => cerrarMut.mutate({ conversacionId: conversacion.id, empresaId })}
            >
              <XCircle className="h-3.5 w-3.5 mr-1" />
              Cerrar
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
