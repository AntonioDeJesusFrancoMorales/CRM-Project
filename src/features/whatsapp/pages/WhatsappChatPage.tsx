import { useCallback, useRef, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { useEmpresas } from '@/features/empresas/hooks/useEmpresas';
import { useUsuarios } from '@/features/usuarios/hooks/useUsuarios';
import { useConversaciones, conversacionesKeys } from '../hooks/useConversaciones';
import { useSseStream } from '../hooks/useSseStream';
import { ChatInbox } from '../components/ChatInbox';
import { ChatWindow } from '../components/ChatWindow';

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

export function WhatsappChatPage() {
  const queryClient = useQueryClient();
  const [empresaId, setEmpresaId] = useState<string>('');
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const selectedRef = useRef<string | null>(null);
  selectedRef.current = selectedConvId;

  const { data: empresas, isLoading: loadingEmpresas } = useEmpresas();
  const { data: usuarios = [] } = useUsuarios();
  const { data: conversaciones = [], isLoading: loadingConvs } = useConversaciones(empresaId);

  const selectedConv = conversaciones.find((c) => c.id === selectedConvId) ?? null;

  // SSE a nivel página: refresca la bandeja y avisa cuando llega un mensaje nuevo
  // a una conversación que NO está abierta.
  const onSse = useCallback(
    (event: { name: string; data: unknown }) => {
      if (event.name !== 'nuevo_mensaje') return;
      const data = event.data as { conversacionId?: string; direccion?: string; contenido?: string };
      void queryClient.invalidateQueries({ queryKey: conversacionesKeys.all });
      if (data.direccion === 'ENTRANTE' && data.conversacionId !== selectedRef.current) {
        beep();
        toast.message('Nuevo mensaje de WhatsApp', { description: data.contenido?.slice(0, 80) || 'Adjunto' });
      }
    },
    [queryClient],
  );
  useSseStream(onSse, true);

  function handleSelect(id: string) {
    setSelectedConvId(id);
    void apiClient.put(endpoints.wa.conversaciones.marcarLeido(id), {}).then(() => {
      void queryClient.invalidateQueries({ queryKey: conversacionesKeys.all });
    });
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem-3rem)]">
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-card shrink-0">
        <MessageSquare className="h-5 w-5 text-muted-foreground" />
        <span className="font-semibold text-sm">WhatsApp</span>
        <div className="ml-auto w-56">
          {loadingEmpresas ? (
            <Skeleton className="h-9 w-full" />
          ) : (
            <Select
              value={empresaId}
              onValueChange={(v) => { setEmpresaId(v); setSelectedConvId(null); }}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Seleccionar empresa..." />
              </SelectTrigger>
              <SelectContent>
                {(empresas ?? []).map((e) => (
                  <SelectItem key={e.id} value={e.id} className="text-sm">
                    {e.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 shrink-0 border-r flex flex-col overflow-hidden">
          {!empresaId ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground p-6 text-center">
              Selecciona una empresa para ver las conversaciones.
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
            <ChatWindow
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
