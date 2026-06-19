import { UserCheck, XCircle, RotateCcw, Bot, BotOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LABEL_ESCALADO_HUMANO, type Conversacion, type Usuario } from '@/api/types';
import { useAsignarAgente } from '../hooks/useAsignarAgente';
import { useCerrarConversacion } from '../hooks/useCerrarConversacion';
import { useReabrirConversacion } from '../hooks/useReabrirConversacion';
import { useAplicarLabelsConversacion } from '../hooks/useAplicarLabelsConversacion';

interface Props {
  conversacion: Conversacion;
  usuarios: Usuario[];
  empresaId: string;
}

function limpiarNumero(jid: string) {
  return jid.replace(/@s\.whatsapp\.net$/, '').replace(/@g\.us$/, '');
}

export function ConversacionHeader({ conversacion, usuarios, empresaId }: Props) {
  const asignarMut = useAsignarAgente();
  const cerrarMut = useCerrarConversacion();
  const reabrirMut = useReabrirConversacion();
  const labelsMut = useAplicarLabelsConversacion();

  const isCerrada = conversacion.estado === 'CERRADA';
  const botActivo = conversacion.botActivo;

  function handleToggleBot() {
    const nuevasLabels = botActivo
      ? [LABEL_ESCALADO_HUMANO]
      : conversacion.labels.filter((l) => l !== LABEL_ESCALADO_HUMANO);
    labelsMut.mutate({ conversacionId: conversacion.id, empresaId, labels: nuevasLabels });
  }
  const numero = limpiarNumero(conversacion.numeroTelefono);
  const nombre = conversacion.nombreContacto?.trim();
  const titulo = !nombre || nombre === numero || /^\d+$/.test(nombre) ? `+${numero}` : nombre;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-primary/15 text-primary flex items-center justify-center text-sm font-semibold">
          {titulo.replace(/[^a-zA-Z0-9]/g, '').charAt(0).toUpperCase() || '#'}
        </div>
        <div>
          <p className="font-semibold text-sm">{titulo}</p>
          <p className="text-xs text-muted-foreground">+{numero}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={botActivo ? 'outline' : 'secondary'}
              size="sm"
              className="h-8 text-xs"
              disabled={labelsMut.isPending}
              onClick={handleToggleBot}
            >
              {botActivo ? (
                <Bot className="h-3.5 w-3.5 mr-1 text-primary" />
              ) : (
                <BotOff className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
              )}
              {botActivo ? 'Bot ON' : 'Bot OFF'}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {botActivo
              ? 'Apagar el bot y ceder la conversación a un agente'
              : 'Reactivar el bot para esta conversación'}
          </TooltipContent>
        </Tooltip>

        {isCerrada && (
          <>
            <Badge variant="secondary">Cerrada</Badge>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              disabled={reabrirMut.isPending}
              onClick={() => reabrirMut.mutate({ conversacionId: conversacion.id, empresaId })}
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Reabrir
            </Button>
          </>
        )}

        {!isCerrada && (
          <>
            <Select
              value={conversacion.asignadoA ?? ''}
              onValueChange={(agenteId) =>
                asignarMut.mutate({ conversacionId: conversacion.id, agenteId, empresaId })
              }
            >
              <SelectTrigger className="w-40 h-8 text-xs" aria-label="Asignar agente">
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
