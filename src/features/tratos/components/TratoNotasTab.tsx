// TratoNotasTab — timeline del trato: notas manuales (NOTA) y eventos del sistema (EVENTO).
// Más recientes primero. Caja para escribir una nota nueva.

import { useState } from 'react';
import { StickyNote, Activity, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Usuario } from '@/api/types';
import { useUsuarios } from '@/features/usuarios/hooks/useUsuarios';
import { useNotasTrato, useCrearNotaTrato } from '../hooks/useNotasTrato';

function formatFecha(iso: string) {
  try {
    return new Date(iso).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return '';
  }
}

export function TratoNotasTab({ tratoId }: { tratoId: string }) {
  const { data: notas = [], isLoading } = useNotasTrato(tratoId);
  const { data: usuarios = [] } = useUsuarios();
  const crearMut = useCrearNotaTrato(tratoId);
  const [texto, setTexto] = useState('');

  const autorNombre = (id: string | null) =>
    id ? (usuarios.find((u: Usuario) => u.id === id)?.nombre ?? 'Usuario') : 'Sistema';

  function handleGuardar() {
    const contenido = texto.trim();
    if (!contenido) return;
    crearMut.mutate(contenido, { onSuccess: () => setTexto('') });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 space-y-2">
          <Textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escribe una nota sobre esta oportunidad..."
            rows={3}
          />
          <div className="flex justify-end">
            <Button size="sm" disabled={!texto.trim() || crearMut.isPending} onClick={handleGuardar}>
              {crearMut.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <StickyNote className="h-4 w-4 mr-1" />}
              Agregar nota
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-sm text-muted-foreground py-6 text-center">Cargando...</p>
      ) : notas.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">Sin notas ni eventos todavía.</p>
      ) : (
        <ol className="space-y-3">
          {notas.map((n) => {
            const esEvento = n.tipo === 'EVENTO';
            return (
              <li key={n.id} className="flex gap-3">
                <div className={cn(
                  'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                  esEvento ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary',
                )}>
                  {esEvento ? <Activity className="h-3.5 w-3.5" /> : <StickyNote className="h-3.5 w-3.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm whitespace-pre-wrap break-words', esEvento && 'italic text-muted-foreground')}>
                    {n.contenido}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {autorNombre(n.autorId)} · {formatFecha(n.creadoEn)}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
