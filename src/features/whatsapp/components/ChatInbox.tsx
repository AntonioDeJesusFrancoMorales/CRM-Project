import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Conversacion } from '@/api/types';

interface Props {
  conversaciones: Conversacion[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60_000);
    if (diffMin < 1) return 'ahora';
    if (diffMin < 60) return `hace ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `hace ${diffH}h`;
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
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
    <ScrollArea className="h-full">
      <div className="divide-y">
        {conversaciones.map((conv) => (
          <button
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={cn(
              'w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors',
              selectedId === conv.id && 'bg-muted',
            )}
          >
            <div className="flex items-center justify-between mb-0.5">
              <span className="font-medium text-sm truncate">
                {conv.nombreContacto ?? conv.numeroTelefono}
              </span>
              <span className="text-[11px] text-muted-foreground shrink-0 ml-2">
                {formatTime(conv.actualizadoEn)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground truncate">{conv.numeroTelefono}</span>
              {conv.estado === 'CERRADA' && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Cerrada</Badge>
              )}
            </div>
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}
