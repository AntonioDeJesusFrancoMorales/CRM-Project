// AgendaListPage — vista principal de la agenda del usuario (lista cronológica).
// Eventos agrupados por fecha (Hoy / Mañana / fecha larga), ordenados por hora de inicio.
// Botón "Nuevo evento" → AgendaCreateDialog. Editar/eliminar por evento vía dialogs.
// Homologa el layout de TareasListPage (header + estados loading/error/empty).

import { useMemo, useState } from 'react';
import { CalendarClock, CalendarCheck2, CalendarDays, Plus, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { useAgendas } from '../hooks/useAgendas';
import { useDeleteAgenda } from '../hooks/useDeleteAgenda';
import { AgendaEventoRow } from '../components/AgendaEventoRow';
import { AgendaCreateDialog } from '../components/AgendaCreateDialog';
import { AgendaEditDialog } from '../components/AgendaEditDialog';
import { AgendaDeleteDialog } from '../components/AgendaDeleteDialog';
import type { Agenda } from '../schemas/agenda.schema';

/** Construye una Date local a partir de "YYYY-MM-DD" (evita el corrimiento por UTC). */
function parseFechaLocal(fecha: string): Date {
  const [y, m, d] = fecha.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

/** "YYYY-MM-DD" de una Date en horario local. */
function toFechaKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const fechaLargaFmt = new Intl.DateTimeFormat('es', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

/** Label del grupo: "Hoy", "Mañana" o la fecha larga en español. */
function labelGrupo(fecha: string): string {
  const hoy = new Date();
  const manana = new Date(hoy);
  manana.setDate(hoy.getDate() + 1);

  if (fecha === toFechaKey(hoy)) return 'Hoy';
  if (fecha === toFechaKey(manana)) return 'Mañana';
  return fechaLargaFmt.format(parseFechaLocal(fecha));
}

interface GrupoAgenda {
  fecha: string;
  eventos: Agenda[];
}

/**
 * KPIs derivados sólo de la lista de eventos, usando el campo real `fecha` (YYYY-MM-DD).
 * - total: todos los eventos.
 * - proximos: fecha >= hoy (incluye hoy y futuros).
 * - hoy: fecha === hoy.
 */
function computeKpis(agendas: Agenda[]) {
  const hoyKey = toFechaKey(new Date());
  let proximos = 0;
  let hoy = 0;
  for (const evento of agendas) {
    if (evento.fecha >= hoyKey) proximos += 1;
    if (evento.fecha === hoyKey) hoy += 1;
  }
  return { total: agendas.length, proximos, hoy };
}

export function AgendaListPage() {
  const { data: agendas, isLoading, isError, refetch } = useAgendas();
  const deleteMutation = useDeleteAgenda();

  const [createOpen, setCreateOpen] = useState(false);
  const [editando, setEditando] = useState<Agenda | null>(null);
  const [eliminando, setEliminando] = useState<Agenda | null>(null);

  const kpis = useMemo(() => computeKpis(agendas ?? []), [agendas]);

  // Agrupa por fecha y ordena cronológicamente (fecha asc, luego horaInicio asc).
  const grupos = useMemo<GrupoAgenda[]>(() => {
    const porFecha = new Map<string, Agenda[]>();
    for (const evento of agendas ?? []) {
      const lista = porFecha.get(evento.fecha) ?? [];
      lista.push(evento);
      porFecha.set(evento.fecha, lista);
    }
    return [...porFecha.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([fecha, eventos]) => ({
        fecha,
        eventos: [...eventos].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio)),
      }));
  }, [agendas]);

  function handleConfirmDelete() {
    if (!eliminando) return;
    deleteMutation.mutate(eliminando.id, { onSuccess: () => setEliminando(null) });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Agenda"
        description="Tus llamadas y reuniones, ordenadas por fecha."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Nuevo evento
          </Button>
        }
      />

      {/* Fila de KPIs derivados de la lista (oculta en error de carga) */}
      {!isError && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Total de eventos"
            value={String(kpis.total)}
            icon={CalendarDays}
            loading={isLoading}
          />
          <StatCard
            label="Próximos"
            value={String(kpis.proximos)}
            hint="Hoy y a futuro"
            icon={CalendarCheck2}
            loading={isLoading}
          />
          <StatCard
            label="Hoy"
            value={String(kpis.hoy)}
            hint="Eventos del día"
            icon={Sun}
            loading={isLoading}
          />
        </div>
      )}

      {/* Loading: esqueleto de la lista cronológica en vez de texto plano */}
      {isLoading && (
        <div className="space-y-6" aria-hidden="true">
          {Array.from({ length: 2 }).map((_, g) => (
            <section key={g} className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, r) => (
                  <div
                    key={r}
                    className="flex items-start gap-3 rounded-md border bg-card px-3 py-2.5"
                  >
                    <Skeleton className="h-4 w-16 flex-shrink-0" />
                    <Skeleton className="mt-0.5 h-4 w-4 flex-shrink-0 rounded-full" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="space-y-3 py-12 text-center">
          <p className="text-sm text-destructive">
            No fue posible cargar la agenda. Intenta de nuevo.
          </p>
          <Button variant="outline" onClick={() => void refetch()}>
            Reintentar
          </Button>
        </div>
      )}

      {/* Empty state rico: no hay eventos en la agenda */}
      {!isLoading && !isError && grupos.length === 0 && (
        <EmptyState
          icon={CalendarClock}
          title="Aún no hay eventos"
          description="Programá tu primera llamada o reunión para empezar a organizar tu agenda."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              Nuevo evento
            </Button>
          }
        />
      )}

      {/* Lista cronológica agrupada por día */}
      {!isLoading && !isError && grupos.length > 0 && (
        <div className="space-y-6">
          {grupos.map((grupo) => (
            <section key={grupo.fecha} className="space-y-2">
              <h2 className="text-sm font-semibold capitalize text-muted-foreground">
                {labelGrupo(grupo.fecha)}
              </h2>
              <div className="space-y-2">
                {grupo.eventos.map((evento) => (
                  <AgendaEventoRow
                    key={evento.id}
                    agenda={evento}
                    onEdit={setEditando}
                    onDelete={setEliminando}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <AgendaCreateDialog open={createOpen} onOpenChange={setCreateOpen} />

      {editando && (
        <AgendaEditDialog
          open={Boolean(editando)}
          onOpenChange={(open) => !open && setEditando(null)}
          agenda={editando}
        />
      )}

      <AgendaDeleteDialog
        open={Boolean(eliminando)}
        onOpenChange={(open) => !open && setEliminando(null)}
        asunto={eliminando?.asunto ?? ''}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}
