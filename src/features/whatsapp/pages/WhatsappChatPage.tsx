import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { MessageSquare, Search } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { useUsuarios } from '@/features/usuarios/hooks/useUsuarios';
import { useAllCanales } from '../hooks/useCanales';
import { useConversaciones, conversacionesKeys } from '../hooks/useConversaciones';
import { mensajesKeys } from '../hooks/useMensajes';
import { useSseStream } from '../hooks/useSseStream';
import { ChatInbox } from '../components/ChatInbox';
import { ChatWindow } from '../components/ChatWindow';

const CANAL_STORAGE_KEY = 'wa-canal-seleccionado';

// Beep corto para avisar mensaje nuevo (sin assets externos).
function beep() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 660;
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // sin audio disponible: ignorar
  }
}

// Notificación nativa del SO cuando llega un mensaje y la pestaña no está visible.
function notificarNavegador(titulo: string, cuerpo: string) {
  try {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    if (!document.hidden) return;
    new Notification(titulo, { body: cuerpo });
  } catch {
    // ignorar
  }
}

export function WhatsappChatPage() {
  const queryClient = useQueryClient();
  // El usuario trabaja por canal (número conectado), no por empresa. La empresa se
  // deriva del canal y se usa internamente para cargar/invalidar (el back filtra por
  // empresa); las conversaciones se filtran client-side por canalId.
  const [canalId, setCanalId] = useState<string>(() => localStorage.getItem(CANAL_STORAGE_KEY) ?? '');
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const selectedRef = useRef<string | null>(null);
  selectedRef.current = selectedConvId;

  const { data: canales = [], isLoading: loadingCanales } = useAllCanales();
  const { data: usuarios = [] } = useUsuarios();

  // Pide permiso de notificaciones del navegador una vez (no bloquea si lo rechazan).
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      void Notification.requestPermission();
    }
  }, []);

  // Auto-selección: el canal guardado si aún existe, si no el primero disponible.
  useEffect(() => {
    if (canales.length === 0) return;
    const existe = canales.some((c) => c.id === canalId);
    if (!existe) setCanalId(canales[0]!.id);
  }, [canales, canalId]);

  function seleccionarCanal(id: string) {
    setCanalId(id);
    localStorage.setItem(CANAL_STORAGE_KEY, id);
    setSelectedConvId(null);
  }

  const canalSeleccionado = canales.find((c) => c.id === canalId) ?? null;
  const empresaId = canalSeleccionado?.empresaId ?? '';

  const [busqueda, setBusqueda] = useState('');

  const { data: todasConversaciones = [], isLoading: loadingConvs } = useConversaciones(empresaId);
  // Una empresa puede tener varios canales: nos quedamos solo con los del canal activo.
  const conversacionesCanal = todasConversaciones.filter((c) => c.canalId === canalId);

  // Atajo desde el kanban: /whatsapp?contacto=<id> abre la conversación de ese contacto.
  // Best-effort sobre la empresa del canal activo (cubre el caso común de 1 empresa);
  // si está en otro canal de la misma empresa, cambia de canal y la selecciona.
  const [searchParams, setSearchParams] = useSearchParams();
  const contactoParam = searchParams.get('contacto');
  useEffect(() => {
    if (!contactoParam || todasConversaciones.length === 0) return;
    const conv = todasConversaciones.find((c) => c.contactoId === contactoParam);
    if (conv) {
      if (conv.canalId !== canalId) {
        setCanalId(conv.canalId);
        localStorage.setItem(CANAL_STORAGE_KEY, conv.canalId);
      }
      setSelectedConvId(conv.id);
    }
    searchParams.delete('contacto');
    setSearchParams(searchParams, { replace: true });
  }, [contactoParam, todasConversaciones, canalId, searchParams, setSearchParams]);

  // Búsqueda client-side por nombre, número o texto del último mensaje.
  const q = busqueda.trim().toLowerCase();
  const conversaciones = q
    ? conversacionesCanal.filter((c) =>
        [c.nombreContacto, c.numeroTelefono, c.ultimoMensajeTexto]
          .some((campo) => campo?.toLowerCase().includes(q)),
      )
    : conversacionesCanal;

  const selectedConv = conversaciones.find((c) => c.id === selectedConvId) ?? null;

  // SSE: única conexión para toda la pantalla de WhatsApp (el backend solo
  // guarda una conexión por usuario — abrir otra aquí y otra en ChatWindow
  // hacía que se pisaran y se perdieran eventos intermitentemente).
  // Refresca la bandeja siempre, y además los mensajes de la conversación
  // abierta cuando el evento le corresponde a ella.
  const onSse = useCallback(
    (event: { name: string; data: unknown }) => {
      if (event.name === 'nuevo_mensaje' || event.name === 'estado_mensaje') {
        const data = event.data as { conversacionId?: string; direccion?: string; contenido?: string };
        if (data?.conversacionId === selectedRef.current) {
          void queryClient.invalidateQueries({ queryKey: mensajesKeys.byConversacion(data.conversacionId) });
        }
      }
      if (event.name !== 'nuevo_mensaje') return;
      const data = event.data as { conversacionId?: string; direccion?: string; contenido?: string };
      void queryClient.invalidateQueries({ queryKey: conversacionesKeys.all });
      if (data.direccion === 'ENTRANTE' && data.conversacionId !== selectedRef.current) {
        beep();
        const desc = data.contenido?.slice(0, 80) || 'Adjunto';
        toast.message('Nuevo mensaje de WhatsApp', { description: desc });
        notificarNavegador('Nuevo mensaje de WhatsApp', desc);
      }
    },
    [queryClient],
  );
  useSseStream(onSse, true);

  function handleSelect(id: string) {
    setSelectedConvId(id);
    void apiClient
      .put(endpoints.wa.conversaciones.marcarLeido(id), {})
      .then(() => {
        void queryClient.invalidateQueries({ queryKey: conversacionesKeys.all });
      })
      .catch(() => {
        toast.error('No se pudo marcar la conversación como leída');
      });
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem-3rem)]">
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-card shrink-0">
        <MessageSquare className="h-5 w-5 text-muted-foreground" />
        <span className="font-semibold text-sm">WhatsApp</span>
        <div className="ml-auto w-56">
          {loadingCanales ? (
            <Skeleton className="h-9 w-full" />
          ) : canales.length === 0 ? (
            <span className="text-xs text-muted-foreground">Sin canales conectados</span>
          ) : canales.length === 1 ? (
            // Un solo canal: se usa automático, lo mostramos como etiqueta (no selector).
            <span className="text-sm font-medium truncate block text-right">{canales[0]!.nombre}</span>
          ) : (
            <Select value={canalId} onValueChange={seleccionarCanal}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Seleccionar canal..." />
              </SelectTrigger>
              <SelectContent>
                {canales.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="text-sm">
                    {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 shrink-0 border-r flex flex-col overflow-hidden">
          {canalId && (
            <div className="p-2 border-b shrink-0">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar conversación..."
                  className="h-9 pl-8 text-sm"
                />
              </div>
            </div>
          )}
          {!canalId ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground p-6 text-center">
              Conecta un canal de WhatsApp para ver las conversaciones.
            </div>
          ) : loadingConvs ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : (
            <ChatInbox
              conversaciones={conversaciones}
              selectedId={selectedConvId}
              onSelect={handleSelect}
            />
          )}
        </aside>

        <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {selectedConv ? (
            // key por conversacion.id: sin esto React reutiliza la misma instancia
            // de ChatWindow al cambiar de chat y el borrador de texto sin enviar
            // queda "pegado" — riesgo de mandarlo a la conversación equivocada.
            <ChatWindow
              key={selectedConv.id}
              conversacion={selectedConv}
              usuarios={usuarios}
              empresaId={empresaId}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
              <MessageSquare className="h-12 w-12 opacity-20" />
              <p className="text-sm">Selecciona una conversación</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
