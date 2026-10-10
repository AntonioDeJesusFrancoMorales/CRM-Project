import { useMemo, useState } from 'react';
import {
  CalendarCheck2,
  CalendarClock,
  CalendarDays,
  List,
  Plus,
  Sun,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RefreshButton, RefreshIcon } from '@/components/shared/RefreshButton';
import { useSynchronousMutationLock } from '@/components/shared/useSynchronousMutationLock';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/shared/EmptyState';
import { PipelineKpiCard } from '@/components/shared/PipelineKpiCard';
import { useAgendas } from '../hooks/useAgendas';
import { useDeleteAgenda } from '../hooks/useDeleteAgenda';
import { AgendaCalendarView } from '../components/AgendaCalendarView';
import { AgendaEventoRow } from '../components/AgendaEventoRow';
import { AgendaCreateDialog } from '../components/AgendaCreateDialog';
import { AgendaEditDialog } from '../components/AgendaEditDialog';
import { AgendaDeleteDialog } from '../components/AgendaDeleteDialog';
import type { Agenda } from '../schemas/agenda.schema';
import { usePermissions } from '@/features/permissions/context';
import { AccessDeniedView } from '@/features/permissions/components/PermissionState';

function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
}

function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const longDateFormatter = new Intl.DateTimeFormat('es-MX', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

function groupLabel(value: string): string {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (value === dateKey(today)) return 'Hoy';
  if (value === dateKey(tomorrow)) return 'Mañana';
  return longDateFormatter.format(parseLocalDate(value));
}

interface AgendaGroup {
  date: string;
  events: Agenda[];
}

function computeKpis(agendas: Agenda[]) {
  const today = dateKey(new Date());
  return {
    total: agendas.length,
    upcoming: agendas.filter((agenda) => agenda.fecha >= today).length,
    today: agendas.filter((agenda) => agenda.fecha === today).length,
  };
}

export function AgendaListPage() {
  const permissions = usePermissions();
  const canRead = permissions.allows('AGENDA', 'LEER');
  const canCreate = permissions.allows('AGENDA', 'CREAR');
  const canEdit = permissions.allows('AGENDA', 'ACTUALIZAR');
  const canDelete = permissions.allows('AGENDA', 'ELIMINAR');
  const { data: agendas = [], isLoading, isError, isFetching, refetch } = useAgendas();
  const deleteMutation = useDeleteAgenda();
  const { acquire, release, isLocked, lockRef: deletionLock } = useSynchronousMutationLock();
  const [view, setView] = useState('calendario');
  const [createOpen, setCreateOpen] = useState(false);
  const [createDate, setCreateDate] = useState<string>();
  const [editing, setEditing] = useState<Agenda | null>(null);
  const [deleting, setDeleting] = useState<Agenda | null>(null);

  const kpis = useMemo(() => computeKpis(agendas), [agendas]);
  const groups = useMemo<AgendaGroup[]>(() => {
    const byDate = new Map<string, Agenda[]>();
    for (const agenda of agendas) {
      const events = byDate.get(agenda.fecha) ?? [];
      events.push(agenda);
      byDate.set(agenda.fecha, events);
    }
    return [...byDate.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([date, events]) => ({
        date,
        events: [...events].sort((left, right) => left.horaInicio.localeCompare(right.horaInicio)),
      }));
  }, [agendas]);

  if (!canRead) return <AccessDeniedView resource="AGENDA" />;

  function openCreate(date?: string) {
    if (!canCreate) return;
    setCreateDate(date);
    setCreateOpen(true);
  }

  function openEdit(agenda: Agenda) {
    if (!canEdit) return;
    setEditing(agenda);
  }

  function openDelete(agenda: Agenda) {
    if (!canDelete) return;
    setDeleting(agenda);
  }

  function handleCreateOpenChange(open: boolean) {
    setCreateOpen(open);
    if (!open) setCreateDate(undefined);
  }

  function handleConfirmDelete() {
    if (!canDelete || !deleting || !acquire()) return;
    deleteMutation.mutate(deleting.id, {
      onSettled: (_data, error) => {
        release();
        if (!error) setDeleting(null);
      },
    });
  }

  function handleDeleteOpenChange(open: boolean) {
    if (!open && deletionLock.current) return;
    if (!open) setDeleting(null);
  }

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">
      <header className="mx-auto flex w-full max-w-[1400px] flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Agenda</h1>
          <p className="text-sm text-muted-foreground">Organiza tus llamadas y reuniones.</p>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton
            resourceLabel="agenda"
            onRefresh={() => void refetch()}
            isRefreshing={isFetching}
          />
          {canCreate && (
            <Button onClick={() => openCreate()}>
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              Nuevo evento
            </Button>
          )}
        </div>
      </header>

      {!isError && (
        <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 gap-3 sm:grid-cols-3">
          <PipelineKpiCard label="Total de eventos" value={String(kpis.total)} hint="En tu agenda" icon={CalendarDays} loading={isLoading} />
          <PipelineKpiCard label="Próximos" value={String(kpis.upcoming)} hint="Hoy y a futuro" icon={CalendarCheck2} loading={isLoading} />
          <PipelineKpiCard label="Hoy" value={String(kpis.today)} hint="Eventos del día" icon={Sun} loading={isLoading} />
        </div>
      )}

      <Tabs value={view} onValueChange={setView} className="gap-4">
        <div className="mx-auto w-full max-w-[1400px]">
          <TabsList>
            <TabsTrigger value="calendario">
              <CalendarDays aria-hidden="true" />
              Calendario
            </TabsTrigger>
            <TabsTrigger value="lista">
              <List aria-hidden="true" />
              Lista
            </TabsTrigger>
          </TabsList>
        </div>

        {isLoading && (
          <div className="mx-auto w-full max-w-[1400px] space-y-3" aria-hidden="true">
            <Skeleton className="h-12 rounded-lg" />
            <Skeleton className="h-96 rounded-lg" />
          </div>
        )}

        {isError && (
          <div className="mx-auto w-full max-w-[1400px] space-y-3 py-12 text-center">
            <p className="text-sm text-destructive">No fue posible cargar la agenda. Intenta de nuevo.</p>
            <Button
              variant="outline"
              onClick={() => void refetch()}
              disabled={isFetching}
              aria-busy={isFetching}
            >
              <RefreshIcon isRefreshing={isFetching} />
              {isFetching ? 'Cargando...' : 'Reintentar'}
            </Button>
          </div>
        )}

        {!isLoading && !isError && agendas.length === 0 && (
          <div className="mx-auto w-full max-w-[1400px]">
            <EmptyState
              icon={CalendarClock}
              title="Aún no hay eventos"
              description="Crea tu primera llamada o reunión para empezar a organizar tu agenda."
              action={canCreate ? (
                <Button onClick={() => openCreate()}>
                  <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                  Nuevo evento
                </Button>
              ) : undefined}
            />
          </div>
        )}

        {!isLoading && !isError && agendas.length > 0 && (
          <>
            <TabsContent value="calendario" className="mt-0">
              <AgendaCalendarView
                agendas={agendas}
                onEdit={canEdit ? openEdit : undefined}
                onDelete={canDelete ? openDelete : undefined}
                onCreate={canCreate ? openCreate : undefined}
              />
            </TabsContent>
            <TabsContent value="lista" className="mx-auto mt-0 w-full max-w-[1400px]">
              <div className="space-y-6 rounded-xl border border-border bg-card p-4 sm:p-5">
                {groups.map((group) => (
                  <section key={group.date} className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h2 className="text-sm font-semibold capitalize text-foreground">{groupLabel(group.date)}</h2>
                      <span className="text-xs tabular-nums text-muted-foreground">{group.events.length} evento{group.events.length === 1 ? '' : 's'}</span>
                    </div>
                    <div className="space-y-2">
                      {group.events.map((agenda) => (
                        <AgendaEventoRow
                          key={agenda.id}
                          agenda={agenda}
                          onEdit={canEdit ? openEdit : undefined}
                          onDelete={canDelete ? openDelete : undefined}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </TabsContent>
          </>
        )}
      </Tabs>

      {canCreate && (
        <AgendaCreateDialog
          open={createOpen}
          onOpenChange={handleCreateOpenChange}
          defaultValues={createDate ? { fecha: createDate } : undefined}
        />
      )}
      {editing && canEdit && (
        <AgendaEditDialog
          open={Boolean(editing)}
          onOpenChange={(open) => !open && setEditing(null)}
          agenda={editing}
        />
      )}
      {canDelete && (
        <AgendaDeleteDialog
          open={Boolean(deleting)}
          onOpenChange={handleDeleteOpenChange}
          asunto={deleting?.asunto ?? ''}
          onConfirm={handleConfirmDelete}
          isDeleting={deleteMutation.isPending || isLocked}
        />
      )}
    </div>
  );
}
