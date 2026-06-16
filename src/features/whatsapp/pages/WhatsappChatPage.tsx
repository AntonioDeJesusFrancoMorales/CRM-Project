import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useEmpresas } from '@/features/empresas/hooks/useEmpresas';
import { useUsuarios } from '@/features/usuarios/hooks/useUsuarios';
import { useConversaciones } from '../hooks/useConversaciones';
import { ChatInbox } from '../components/ChatInbox';
import { ChatWindow } from '../components/ChatWindow';

export function WhatsappChatPage() {
  const [empresaId, setEmpresaId] = useState<string>('');
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);

  const { data: empresas, isLoading: loadingEmpresas } = useEmpresas();
  const { data: usuarios = [] } = useUsuarios();
  const { data: conversaciones = [], isLoading: loadingConvs } = useConversaciones(empresaId);

  const selectedConv = conversaciones.find((c) => c.id === selectedConvId) ?? null;

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem-3rem)]">
      {/* Selector de empresa */}
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

      {/* Layout principal de chat */}
      <div className="flex flex-1 overflow-hidden">
        {/* Panel izquierdo: lista de conversaciones */}
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
              onSelect={(id) => setSelectedConvId(id)}
            />
          )}
        </aside>

        {/* Panel derecho: conversación activa */}
        <main className="flex-1 flex flex-col overflow-hidden">
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
