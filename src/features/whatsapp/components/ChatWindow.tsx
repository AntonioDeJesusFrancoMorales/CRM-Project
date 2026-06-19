import { useEffect, useRef, useState } from 'react';
import { Send, Loader2, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Conversacion, Mensaje, Usuario } from '@/api/types';
import { useMensajes } from '../hooks/useMensajes';
import { useSendMensaje } from '../hooks/useSendMensaje';
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

// La mediaUrl viene como "/api/media/xxx"; el backend la sirve en su mismo origen.
const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/api\/?$/, '');
function mediaSrc(url: string) {
  return /^https?:\/\//.test(url) ? url : `${API_ORIGIN}${url}`;
}

function MediaContent({ mensaje }: { mensaje: Mensaje }) {
  if (!mensaje.mediaUrl) return null;
  const src = mediaSrc(mensaje.mediaUrl);
  switch (mensaje.tipo) {
    case 'IMAGEN':
    case 'STICKER':
      return <img src={src} alt="adjunto" className="rounded-lg max-w-full max-h-72 object-contain" />;
    case 'VIDEO':
      return <video src={src} controls className="rounded-lg max-w-full max-h-72" />;
    case 'AUDIO':
      return <audio src={src} controls className="w-56 max-w-full" />;
    case 'DOCUMENTO':
      return (
        <a href={src} target="_blank" rel="noreferrer" className="underline text-xs break-all">
          📄 {mensaje.contenido || 'Documento'}
        </a>
      );
    default:
      return (
        <a href={src} target="_blank" rel="noreferrer" className="underline text-xs break-all">
          Ver adjunto
        </a>
      );
  }
}

function StatusCheck({ status }: { status: Mensaje['status'] }) {
  if (status === 'ENVIADO') return <Check className="h-3 w-3 inline" />;
  if (status === 'ENTREGADO') return <CheckCheck className="h-3 w-3 inline" />;
  if (status === 'LEIDO') return <CheckCheck className="h-3 w-3 inline text-sky-400" />;
  if (status === 'FALLIDO') return <span className="text-destructive">✕</span>;
  return null;
}

function MessageBubble({ mensaje }: { mensaje: Mensaje }) {
  const isSaliente = mensaje.direccion === 'SALIENTE';
  // En documento el contenido es el nombre del archivo (ya se muestra en el link).
  const mostrarTexto = mensaje.contenido && mensaje.tipo !== 'DOCUMENTO';
  return (
    <div className={cn('flex w-full min-w-0', isSaliente ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[75%] min-w-0 rounded-2xl px-3 py-2 text-sm space-y-1',
          isSaliente
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-muted rounded-bl-sm',
        )}
      >
        {mensaje.mediaUrl && <MediaContent mensaje={mensaje} />}
        {mostrarTexto && (
          <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{mensaje.contenido}</p>
        )}
        <p className={cn('text-[10px] flex items-center gap-1', isSaliente ? 'text-primary-foreground/70 justify-end' : 'text-muted-foreground')}>
          {formatHora(mensaje.creadoEn)}
          {isSaliente && <StatusCheck status={mensaje.status} />}
        </p>
      </div>
    </div>
  );
}

export function ChatWindow({ conversacion, usuarios, empresaId }: Props) {
  const [texto, setTexto] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const { data: mensajes, isLoading } = useMensajes(conversacion.id);
  const sendMut = useSendMensaje();
  const isCerrada = conversacion.estado === 'CERRADA';

  // El SSE vive a nivel de página (WhatsappChatPage) — una sola conexión por
  // usuario, igual que registra el backend (SseEmitterRegistry es 1:1 por
  // usuarioId). Si cada ChatWindow abriera su propia conexión, la última en
  // registrarse "pisaría" a las anteriores y se perderían eventos.

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
    <div className="flex flex-col h-full min-w-0">
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
          <div className="flex flex-col gap-2 w-full min-w-0">
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
            aria-label="Enviar mensaje"
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
