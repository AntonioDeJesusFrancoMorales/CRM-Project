import { useEffect, useRef, useState } from 'react';
import { Send, Loader2, Check, CheckCheck, Paperclip, StickyNote, FileText, Mic, Square } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import type { Conversacion, Mensaje, TipoMensaje, Usuario } from '@/api/types';
import { useMensajes } from '../hooks/useMensajes';
import { useSendMensaje } from '../hooks/useSendMensaje';
import { usePlantillas } from '../hooks/usePlantillas';
import { ConversacionHeader } from './ConversacionHeader';

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
  });
}

function tipoDeMime(mime: string): TipoMensaje {
  if (mime.startsWith('image/')) return 'IMAGEN';
  if (mime.startsWith('video/')) return 'VIDEO';
  if (mime.startsWith('audio/')) return 'AUDIO';
  return 'DOCUMENTO';
}

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
  const esNota = mensaje.interna;
  // En documento el contenido es el nombre del archivo (ya se muestra en el link).
  const mostrarTexto = mensaje.contenido && mensaje.tipo !== 'DOCUMENTO';
  return (
    <div className={cn('flex w-full min-w-0', isSaliente ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[75%] min-w-0 rounded-2xl px-3 py-2 text-sm space-y-1',
          esNota
            ? 'bg-amber-100 text-amber-900 border border-amber-300 rounded-br-sm dark:bg-amber-950 dark:text-amber-100 dark:border-amber-800'
            : isSaliente
              ? 'bg-primary text-primary-foreground rounded-br-sm'
              : 'bg-muted rounded-bl-sm',
        )}
      >
        {esNota && (
          <p className="text-[10px] font-semibold flex items-center gap-1 opacity-80">
            <StickyNote className="h-3 w-3" /> Nota interna
          </p>
        )}
        {mensaje.mediaUrl && <MediaContent mensaje={mensaje} />}
        {mostrarTexto && (
          <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{mensaje.contenido}</p>
        )}
        <p className={cn('text-[10px] flex items-center gap-1',
          esNota ? 'text-amber-700 dark:text-amber-300 justify-end'
          : isSaliente ? 'text-primary-foreground/70 justify-end' : 'text-muted-foreground')}>
          {formatHora(mensaje.creadoEn)}
          {isSaliente && !esNota && <StatusCheck status={mensaje.status} />}
        </p>
      </div>
    </div>
  );
}

export function ChatWindow({ conversacion, usuarios, empresaId }: Props) {
  const [texto, setTexto] = useState('');
  const [notaInterna, setNotaInterna] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [grabando, setGrabando] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const { data: mensajes, isLoading } = useMensajes(conversacion.id);
  const { data: plantillas = [] } = usePlantillas();
  const sendMut = useSendMensaje();
  const isCerrada = conversacion.estado === 'CERRADA';

  // Inserta el contenido de una plantilla en el input, resolviendo {{nombre}}.
  function insertarPlantilla(contenido: string) {
    const nombre = conversacion.nombreContacto?.trim() || '';
    const resuelto = contenido.replace(/\{\{nombre\}\}/g, nombre);
    setTexto((prev) => (prev ? `${prev} ${resuelto}` : resuelto));
  }

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
      { conversacionId: conversacion.id, payload: { tipo: 'TEXTO', contenido, interna: notaInterna } },
      { onSuccess: () => setTexto('') },
    );
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // Adjunta un archivo: lo sube al backend (base64) y manda el mensaje con la URL
  // resultante; el texto actual del input viaja como caption.
  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite re-seleccionar el mismo archivo
    if (!file || isCerrada) return;
    setSubiendo(true);
    try {
      const base64 = await fileToBase64(file);
      const { url } = await apiClient.post<{ url: string }>(endpoints.media.upload(), {
        base64,
        mime: file.type || 'application/octet-stream',
      });
      const caption = texto.trim();
      sendMut.mutate(
        {
          conversacionId: conversacion.id,
          payload: { tipo: tipoDeMime(file.type), contenido: caption || undefined, mediaUrl: url },
        },
        { onSuccess: () => setTexto('') },
      );
    } catch {
      toast.error('No se pudo subir el archivo');
    } finally {
      setSubiendo(false);
    }
  }

  // Nota de voz: graba con MediaRecorder, sube el audio y lo envía como mensaje AUDIO.
  async function toggleGrabar() {
    if (isCerrada) return;
    if (grabando) {
      recorderRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setGrabando(false);
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        if (blob.size === 0) return;
        setSubiendo(true);
        try {
          const base64 = await new Promise<string>((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result as string);
            r.onerror = () => reject(new Error('read'));
            r.readAsDataURL(blob);
          });
          const { url } = await apiClient.post<{ url: string }>(endpoints.media.upload(), {
            base64, mime: blob.type,
          });
          sendMut.mutate({ conversacionId: conversacion.id, payload: { tipo: 'AUDIO', mediaUrl: url } });
        } catch {
          toast.error('No se pudo enviar la nota de voz');
        } finally {
          setSubiendo(false);
        }
      };
      recorder.start();
      recorderRef.current = recorder;
      setGrabando(true);
    } catch {
      toast.error('No se pudo acceder al micrófono');
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
        <div className={cn('border-t p-3 flex gap-2 items-end', notaInterna ? 'bg-amber-50 dark:bg-amber-950/40' : 'bg-card')}>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept="image/*,video/*,audio/*,application/pdf"
            onChange={handleFile}
          />
          <Button
            size="icon"
            variant="ghost"
            aria-label="Adjuntar archivo"
            disabled={subiendo || sendMut.isPending}
            onClick={() => fileRef.current?.click()}
          >
            {subiendo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
          </Button>

          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" aria-label="Insertar plantilla">
                    <FileText className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Insertar plantilla</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto w-64">
              {plantillas.length === 0 ? (
                <DropdownMenuItem disabled>No hay plantillas</DropdownMenuItem>
              ) : (
                plantillas.map((p) => (
                  <DropdownMenuItem key={p.id} onSelect={() => insertarPlantilla(p.contenido)} className="flex flex-col items-start gap-0.5">
                    <span className="text-xs font-medium">{p.titulo}</span>
                    <span className="text-[11px] text-muted-foreground truncate max-w-full">{p.contenido}</span>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant={notaInterna ? 'secondary' : 'ghost'}
                aria-label="Nota interna"
                onClick={() => setNotaInterna((v) => !v)}
              >
                <StickyNote className={cn('h-4 w-4', notaInterna && 'text-amber-600')} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{notaInterna ? 'Modo nota interna (no se envía a WhatsApp)' : 'Escribir nota interna'}</TooltipContent>
          </Tooltip>

          <Textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={notaInterna ? 'Nota interna (no se envía al cliente)...' : 'Escribe un mensaje... (Enter para enviar)'}
            className="resize-none min-h-[40px] max-h-32 text-sm"
            rows={1}
          />
          {/* Micrófono: grabar nota de voz (oculto en modo nota interna y si hay texto escrito). */}
          {!notaInterna && !texto.trim() && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant={grabando ? 'destructive' : 'ghost'}
                  aria-label={grabando ? 'Detener y enviar nota de voz' : 'Grabar nota de voz'}
                  disabled={subiendo}
                  onClick={toggleGrabar}
                >
                  {grabando ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{grabando ? 'Detener y enviar' : 'Grabar nota de voz'}</TooltipContent>
            </Tooltip>
          )}
          <Button
            size="icon"
            aria-label={notaInterna ? 'Guardar nota' : 'Enviar mensaje'}
            onClick={handleSend}
            disabled={!texto.trim() || sendMut.isPending}
          >
            {sendMut.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : notaInterna ? (
              <StickyNote className="h-4 w-4" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
