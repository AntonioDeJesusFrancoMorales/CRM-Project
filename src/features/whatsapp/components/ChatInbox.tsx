import { MessageCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { Conversacion } from '@/api/types';

interface Props {
  conversaciones: Conversacion[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

// Quita el sufijo JID y deja el número legible.
function limpiarNumero(jid: string) {
  return jid.replace(/@s\.whatsapp\.net$/, '').replace(/@g\.us$/, '');
}

// Si el "nombre" es solo el número (o vacío), muestra el número con +; si es un nombre real, lo usa.
function tituloDe(conv: Conversacion) {
  const numero = limpiarNumero(conv.numeroTelefono);
  const nombre = conv.nombreContacto?.trim();
  if (!nombre || nombre === numero || /^\d+$/.test(nombre)) return `+${numero}`;
  return nombre;
}

function inicial(texto: string) {
  const c = texto.replace(/[^a-zA-Z0-9]/g, '').charAt(0);
  return c ? c.toUpperCase() : '#';
}

function formatTime(iso: string | null) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    }
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return d.toLocaleDateString('es-MX', { weekday: 'short' });
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' });
  } catch {
    return '';
  }
}

export function ChatInbox({ conversaciones, selectedId, onSelect }: Props) {
  if (conversaciones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground p-6">
        <MessageCircle className="h-10 w-10 opacity-30" />
        <p className="text-sm">No hay conversaciones</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden">
      <div>
        {conversaciones.map((conv) => {
          const titulo = tituloDe(conv);
          const esNumero = titulo.startsWith('+');
          const noLeidos = conv.noLeidos ?? 0;
          return (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={cn(
                'w-full text-left px-3 py-2.5 flex items-center gap-3 border-b border-border/50 hover:bg-muted/50 transition-colors',
                selectedId === conv.id && 'bg-muted',
              )}
            >
              <div className="h-11 w-11 shrink-0 rounded-full bg-primary/15 text-primary flex items-center justify-center font-semibold">
                {esNumero ? <User className="h-5 w-5" /> : inicial(titulo)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={cn('truncate min-w-0 text-sm', noLeidos > 0 ? 'font-semibold' : 'font-medium')}>
                    {titulo}
                  </span>
                  <span className={cn('text-[11px] shrink-0', noLeidos > 0 ? 'text-emerald-600 font-medium' : 'text-muted-foreground')}>
                    {formatTime(conv.ultimoMensajeAt ?? conv.actualizadoEn)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className={cn('truncate min-w-0 text-xs', noLeidos > 0 ? 'text-foreground' : 'text-muted-foreground')}>
                    {conv.ultimoMensajeTexto || (conv.estado === 'CERRADA' ? 'Conversación cerrada' : ' ')}
                  </span>
                  {noLeidos > 0 ? (
                    <Badge className="shrink-0 h-5 min-w-5 px-1.5 rounded-full bg-emerald-600 hover:bg-emerald-600 text-white text-[11px] flex items-center justify-center">
                      {noLeidos}
                    </Badge>
                  ) : conv.estado === 'CERRADA' ? (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">Cerrada</Badge>
                  ) : null}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
