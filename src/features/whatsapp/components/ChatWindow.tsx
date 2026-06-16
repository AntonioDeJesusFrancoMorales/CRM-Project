import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Conversacion, Mensaje, Usuario } from '@/api/types';
import { useMensajes, mensajesKeys } from '../hooks/useMensajes';
import { useSendMensaje } from '../hooks/useSendMensaje';
import { useSseStream } from '../hooks/useSseStream';
import { ConversacionHeader } from './ConversacionHeader';

interface Props {
  conversacion: Conversacion;
  usuarios: Usuario[];
  empresaId: string;
}

function formatHora(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function MessageBubble({ mensaje }: { mensaje: Mensaje }) {
  const isSaliente = mensaje.direccion === 'SALIENTE';
  return (
    <div className={cn('flex', isSaliente ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[70%] rounded-2xl px-3 py-2 text-sm',
          isSaliente
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-muted rounded-bl-sm',
        )}
      >
        {mensaje.contenido && <p className="whitespace-pre-wrap break-words">{mensaje.contenido}</p>}
        {mensaje.mediaUrl && (
          <p className="text-xs opacity-70 italic">
            [{mensaje.tipo.toLowerCase()}]
          </p>
        )}
        <p className={cn('text-[10px] mt-0.5', isSaliente ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
          {formatHora(mensaje.creadoEn)}
        </p>
      </div>
    </div>
  );
}

export function ChatWindow({ conversacion, usuarios, empresaId }: Props) {
  const [texto, setTexto] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: mensajes, isLoading } = useMensajes(conversacion.id);
  const sendMut = useSendMensaje();
  const isCerrada = conversacion.estado === 'CERRADA';

  // SSE: refrescar mensajes cuando llega un evento nuevo
  useSseStream(
    (event) => {
      if (event.name === 'nuevo_mensaje') {
        const data = event.data as { conversacionId?: string };
        if (data?.conversacionId === conversacion.id) {
          void queryClient.invalidateQueries({
            queryKey: mensajesKeys.byConversacion(conversacion.id),
          });
        }
      }
    },
    true,
  );

  // Auto-scroll al fondo cuando llegan mensajes nuevos
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes?.length]);

  function handleSend() {
    const contenido = texto.trim();
    if (!contenido || isCerrada) return;
    sendMut.mutate(
      { conversacionId: conversacion.id, payload: { tipo: 'TEXTO', contenido } },
      { onSuccess: () => setTexto('') },
    );
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col h-full">
      <ConversacionHeader
        conversacion={conversacion}
        usuarios={usuarios}
        empresaId={empresaId}
      />

      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-2/3" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {(mensajes ?? []).map((m) => (
              <MessageBubble key={m.id} mensaje={m} />
            ))}
            <div ref={endRef} />
          </div>
        )}
      </ScrollArea>

      {!isCerrada && (
        <div className="border-t p-3 flex gap-2 items-end bg-card">
          <Textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje... (Enter para enviar)"
            className="resize-none min-h-[40px] max-h-32 text-sm"
            rows={1}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!texto.trim() || sendMut.isPending}
          >
            {sendMut.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
