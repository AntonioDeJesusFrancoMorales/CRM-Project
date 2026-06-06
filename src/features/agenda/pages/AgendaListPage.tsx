// AgendaListPage — vista principal de la agenda del usuario (lista cronológica).
// Eventos agrupados por fecha (Hoy / Mañana / fecha larga), ordenados por hora de inicio.
// Botón "Nuevo evento" → AgendaCreateDialog. Editar/eliminar por evento vía dialogs.
// Homologa el layout de TareasListPage (header + estados loading/error/empty).

import { useMemo, useState } from 'react';
import { CalendarClock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

export function AgendaListPage() {
  const { data: agendas, isLoading, isError, refetch } = useAgendas();
  const deleteMutation = useDeleteAgenda();

  const [createOpen, setCreateOpen] = useState(false);
  const [editando, setEditando] = useState<Agenda | null>(null);
  const [eliminando, setEliminando] = useState<Agenda | null>(null);

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
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agenda</h1>
          <p className="text-sm text-muted-foreground">
            Tus llamadas y reuniones, ordenadas por fecha.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          Nuevo evento
        </Button>
      </header>

      {/* Loading */}
      {isLoading && (
        <p className="py-12 text-center text-sm text-muted-foreground">Cargando agenda...</p>
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

      {/* Empty */}
      {!isLoading && !isError && grupos.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
          <CalendarClock className="h-8 w-8" aria-hidden="true" />
          <p className="text-sm">No tenés eventos en tu agenda.</p>
          <Button variant="outline" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Crear el primero
          </Button>
        </div>
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
