import { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Link2,
  MapPin,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Agenda } from '../schemas/agenda.schema';

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const WEEK_DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatSelectedDate(key: string): string {
  const [year, month, day] = key.split('-').map(Number);
  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' }).format(
    new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1),
  );
}

function shortTime(value: string | null): string | null {
  return value?.slice(0, 5) ?? null;
}

interface AgendaCalendarViewProps {
  agendas: Agenda[];
  onEdit: (agenda: Agenda) => void;
  onDelete: (agenda: Agenda) => void;
  onCreate: (date?: string) => void;
}

export function AgendaCalendarView({
  agendas,
  onEdit,
  onDelete,
  onCreate,
}: AgendaCalendarViewProps) {
  const today = dateKey(new Date());
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState(today);
  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const eventsByDate = useMemo(() => {
    const result = new Map<string, Agenda[]>();
    for (const agenda of agendas) {
      const events = result.get(agenda.fecha) ?? [];
      events.push(agenda);
      result.set(agenda.fecha, events);
    }
    for (const events of result.values()) {
      events.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
    }
    return result;
  }, [agendas]);

  const firstDay = new Date(year, month, 1);
  const leadingDays = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cellCount = Math.ceil((leadingDays + daysInMonth) / 7) * 7;
  const cells = Array.from({ length: cellCount }, (_, index) => index - leadingDays + 1);
  const selectedEvents = eventsByDate.get(selected) ?? [];

  function moveMonth(amount: number) {
    setCursor(new Date(year, month + amount, 1));
  }

  function goToday() {
    const now = new Date();
    setCursor(now);
    setSelected(dateKey(now));
  }

  return (
    <div className="mx-auto grid w-full max-w-[1400px] gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
          <div>
            <h2 className="font-semibold text-foreground">
              {MONTH_NAMES[month]} {year}
            </h2>
            <p className="text-xs text-muted-foreground">
              Selecciona un día para ver sus eventos
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => moveMonth(-1)}
              aria-label="Mes anterior"
            >
              <ChevronLeft />
            </Button>
            <Button variant="outline" size="sm" onClick={goToday}>
              Hoy
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => moveMonth(1)}
              aria-label="Mes siguiente"
            >
              <ChevronRight />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-border">
          {WEEK_DAYS.map((day) => (
            <div key={day} className="p-2 text-center text-xs font-medium text-muted-foreground sm:p-3">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((day, index) => {
            const key = day > 0 && day <= daysInMonth ? dateKey(new Date(year, month, day)) : null;
            const events = key ? eventsByDate.get(key) ?? [] : [];
            return (
              <button
                key={`${year}-${month}-${index}`}
                type="button"
                disabled={!key}
                onClick={() => key && setSelected(key)}
                className={cn(
                  'min-h-20 border-b border-r border-border p-1.5 text-left align-top transition-colors sm:min-h-28 sm:p-2',
                  key ? 'hover:bg-muted/50' : 'bg-muted/20',
                  key === selected && 'bg-primary/5 ring-2 ring-inset ring-primary/50',
                )}
              >
                <span
                  className={cn(
                    'text-xs sm:text-sm',
                    key === today &&
                      'flex h-6 w-6 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground sm:h-7 sm:w-7',
                  )}
                >
                  {key ? day : ''}
                </span>
                <div className="mt-1 space-y-1">
                  {events.slice(0, 3).map((agenda) => (
                    <div
                      key={agenda.id}
                      title={`${shortTime(agenda.horaInicio)} ${agenda.asunto}`}
                      className={cn(
                        'truncate rounded px-1 py-0.5 text-[10px] font-medium sm:px-1.5 sm:py-1 sm:text-[11px]',
                        agenda.tipo === 'LLAMADA'
                          ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300'
                          : 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
                      )}
                    >
                      <span className="hidden sm:inline">{shortTime(agenda.horaInicio)} </span>
                      {agenda.asunto}
                    </div>
                  ))}
                  {events.length > 3 && (
                    <span className="text-[10px] text-muted-foreground sm:text-[11px]">
                      +{events.length - 3} más
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <aside className="h-fit rounded-xl border border-border bg-card p-4 lg:sticky lg:top-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold capitalize">{formatSelectedDate(selected)}</h3>
            <p className="text-xs text-muted-foreground">
              {selectedEvents.length} evento{selectedEvents.length === 1 ? '' : 's'}
            </p>
          </div>
          <Button size="icon-sm" onClick={() => onCreate(selected)} aria-label="Nuevo evento en la fecha seleccionada">
            <Plus />
          </Button>
        </div>

        {selectedEvents.length === 0 ? (
          <button
            type="button"
            onClick={() => onCreate(selected)}
            className="w-full rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
          >
            No hay eventos. Crear uno
          </button>
        ) : (
          <div className="space-y-3">
            {selectedEvents.map((agenda) => (
              <article key={agenda.id} className="rounded-lg border border-border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{agenda.asunto}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                      {shortTime(agenda.horaInicio)}
                      {agenda.horaFin ? ` – ${shortTime(agenda.horaFin)}` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0">
                    <Button variant="ghost" size="icon-sm" onClick={() => onEdit(agenda)} aria-label={`Editar ${agenda.asunto}`}>
                      <Pencil />
                    </Button>
                    <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => onDelete(agenda)} aria-label={`Eliminar ${agenda.asunto}`}>
                      <Trash2 />
                    </Button>
                  </div>
                </div>
                {agenda.ubicacion && (
                  <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    {agenda.ubicacion}
                  </p>
                )}
                {agenda.linkVideollamada && (
                  <a href={agenda.linkVideollamada} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline">
                    <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Abrir videollamada
                  </a>
                )}
              </article>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}
