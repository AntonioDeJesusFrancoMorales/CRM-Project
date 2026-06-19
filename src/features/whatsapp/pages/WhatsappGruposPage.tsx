import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Users, RefreshCw, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import type { CanalWhatsapp, MensajeGrupo } from '@/api/types';
import { useGrupos, useMensajesGrupo, useImportarGrupos, useMarcarGrupoLeido, gruposKeys } from '../hooks/useGrupos';
import { useSendMensajeGrupo } from '../hooks/useSendMensajeGrupo';
import { useSseStream } from '../hooks/useSseStream';

const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/api\/?$/, '');
const mediaSrc = (url: string) => (/^https?:\/\//.test(url) ? url : `${API_ORIGIN}${url}`);

function GrupoMediaContent({ mensaje }: { mensaje: MensajeGrupo }) {
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
    default:
      return <a href={src} target="_blank" rel="noreferrer" className="underline text-xs break-all">📄 {mensaje.contenido || 'Adjunto'}</a>;
  }
}

function GrupoBubble({ mensaje }: { mensaje: MensajeGrupo }) {
  const isSaliente = mensaje.direccion === 'SALIENTE';
  const mostrarTexto = mensaje.contenido && mensaje.tipo !== 'DOCUMENTO';
  return (
    <div className={cn('flex', isSaliente ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[70%] rounded-2xl px-3 py-2 text-sm space-y-1', isSaliente ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted rounded-bl-sm')}>
        {!isSaliente && mensaje.remitente && (
          <p className="text-[11px] font-semibold text-emerald-600">{mensaje.remitente}</p>
        )}
        {mensaje.mediaUrl && <GrupoMediaContent mensaje={mensaje} />}
        {mostrarTexto && <p className="whitespace-pre-wrap break-words">{mensaje.contenido}</p>}
      </div>
    </div>
  );
}

export function WhatsappGruposPage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [texto, setTexto] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const { data: grupos = [], isLoading } = useGrupos();
  const { data: mensajes = [] } = useMensajesGrupo(selectedId);
  const importarMut = useImportarGrupos();
  const marcarLeidoMut = useMarcarGrupoLeido();
  const sendMut = useSendMensajeGrupo();

  // Canal activo para importar grupos
  const { data: canales = [] } = useQuery<CanalWhatsapp[]>({
    queryKey: ['wa-canales-global'],
    queryFn: () => apiClient.get<CanalWhatsapp[]>(endpoints.wa.canales.getAllGlobal()),
  });
  const canalActivo = canales.find((c) => c.estado === 'ACTIVO') ?? canales[0];

  const selected = grupos.find((g) => g.id === selectedId) ?? null;

  // SSE: refrescar al llegar mensajes de grupo
  useSseStream((event) => {
    if (event.name === 'nuevo_mensaje_grupo') {
      void queryClient.invalidateQueries({ queryKey: gruposKeys.all });
      const data = event.data as { grupoId?: string };
      if (data?.grupoId === selectedId) {
        void queryClient.invalidateQueries({ queryKey: gruposKeys.mensajes(selectedId!) });
      }
    }
  }, true);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes.length]);

  // Limpia el borrador al cambiar de grupo (evita mandarlo al grupo equivocado).
  useEffect(() => {
    setTexto('');
  }, [selectedId]);

  function handleSelect(id: string, noLeidos: number) {
    setSelectedId(id);
    if (noLeidos > 0) marcarLeidoMut.mutate(id);
  }

  const sinCanal = !selected?.canalId;

  function handleSend() {
    const contenido = texto.trim();
    if (!contenido || !selectedId || sinCanal) return;
    sendMut.mutate(
      { grupoId: selectedId, payload: { tipo: 'TEXTO', contenido } },
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
    <div className="flex flex-col h-[calc(100vh-3.5rem-3rem)]">
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-card shrink-0">
        <Users className="h-5 w-5 text-muted-foreground" />
        <span className="font-semibold text-sm">Grupos de WhatsApp</span>
        <Button
          size="sm"
          variant="outline"
          className="ml-auto"
          disabled={!canalActivo || importarMut.isPending}
          onClick={() => canalActivo && importarMut.mutate(canalActivo.id)}
        >
          {importarMut.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
          Importar grupos
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 shrink-0 border-r flex flex-col overflow-hidden">
          {isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : grupos.length === 0 ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground p-6 text-center">
              No hay grupos. Usa "Importar grupos" para traerlos.
            </div>
          ) : (
            <ScrollArea className="flex-1">
              {grupos.map((g) => (
                <button
                  key={g.id}
                  onClick={() => handleSelect(g.id, g.noLeidos)}
                  className={cn('w-full text-left px-4 py-3 border-b hover:bg-accent flex items-center gap-2', selectedId === g.id && 'bg-accent')}
                >
                  <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="flex-1 truncate text-sm font-medium">{g.nombre}</span>
                  {g.noLeidos > 0 && <Badge className="shrink-0">{g.noLeidos}</Badge>}
                </button>
              ))}
            </ScrollArea>
          )}
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden">
          {selected ? (
            <>
              <div className="px-4 py-3 border-b bg-card font-semibold text-sm flex items-center gap-2">
                <Users className="h-4 w-4" /> {selected.nombre}
              </div>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-2">
                  {mensajes.map((m) => <GrupoBubble key={m.id} mensaje={m} />)}
                  <div ref={endRef} />
                </div>
              </ScrollArea>

              <div className="border-t p-3 flex gap-2 items-end bg-card">
                <Textarea
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={sinCanal ? 'Este grupo no tiene canal: reimporta los grupos' : 'Escribe un mensaje... (Enter para enviar)'}
                  className="resize-none min-h-[40px] max-h-32 text-sm"
                  rows={1}
                  disabled={sinCanal}
                />
                <Button
                  size="icon"
                  aria-label="Enviar mensaje al grupo"
                  onClick={handleSend}
                  disabled={!texto.trim() || sinCanal || sendMut.isPending}
                >
                  {sendMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
              <Users className="h-12 w-12 opacity-20" />
              <p className="text-sm">Selecciona un grupo</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
