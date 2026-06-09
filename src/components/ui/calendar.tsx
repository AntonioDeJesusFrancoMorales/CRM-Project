import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';
import { formatYmd } from '@/lib/date';

interface CalendarProps {
  /** Día seleccionado (local). */
  selected?: Date | null;
  /** Se dispara al hacer clic en un día. */
  onSelect: (date: Date) => void;
  className?: string;
}

// Semana empieza en LUNES (es). getDay(): 0=Dom..6=Sáb → índice con lunes=0.
const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const mondayIndex = (jsDay: number): number => (jsDay + 6) % 7;

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function sameYmd(a: Date, b: Date): boolean {
  return formatYmd(a) === formatYmd(b);
}

/**
 * Calendario de un mes, hecho a mano (sin dependencias externas).
 * Navegación por mes con chevrons; grilla de 6 semanas para altura estable.
 */
export function Calendar({ selected, onSelect, className }: CalendarProps) {
  const today = React.useMemo(() => new Date(), []);
  const [viewMonth, setViewMonth] = React.useState<Date>(() =>
    startOfMonth(selected ?? today),
  );

  // Si cambia la selección desde afuera, sincroniza el mes visible.
  // Dependemos de un primitivo estable (año*12+mes) — NO del objeto Date, que
  // se recrea en cada render (parseYmd) y dispararía un loop de re-render.
  const selectedMonthKey = selected ? selected.getFullYear() * 12 + selected.getMonth() : null;
  React.useEffect(() => {
    if (selectedMonthKey == null) return;
    setViewMonth(
      new Date(Math.floor(selectedMonthKey / 12), selectedMonthKey % 12, 1),
    );
  }, [selectedMonthKey]);

  const monthLabel = new Intl.DateTimeFormat('es', {
    month: 'long',
    year: 'numeric',
  }).format(viewMonth);

  const firstDay = startOfMonth(viewMonth);
  const leadingBlanks = mondayIndex(firstDay.getDay());
  const daysInMonth = new Date(
    viewMonth.getFullYear(),
    viewMonth.getMonth() + 1,
    0,
  ).getDate();

  // 6 filas × 7 columnas = 42 celdas (algunas vacías al inicio).
  const cells: Array<Date | null> = [];
  for (let i = 0; i < leadingBlanks; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const goMonth = (delta: number) =>
    setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));

  return (
    <div className={cn('w-[17rem] select-none', className)}>
      {/* Header: navegación de mes */}
      <div className="flex items-center justify-between pb-2">
        <button
          type="button"
          aria-label="Mes anterior"
          onClick={() => goMonth(-1)}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-input text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium capitalize">{monthLabel}</span>
        <button
          type="button"
          aria-label="Mes siguiente"
          onClick={() => goMonth(1)}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-input text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Encabezado de días de la semana */}
      <div className="grid grid-cols-7 gap-1 pb-1">
        {WEEKDAYS.map((w, i) => (
          <div
            key={i}
            className="flex h-8 items-center justify-center text-xs font-medium text-muted-foreground"
          >
            {w}
          </div>
        ))}
      </div>

      {/* Grilla de días */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <div key={i} className="h-8 w-8" />;
          const isSelected = selected != null && sameYmd(date, selected);
          const isToday = sameYmd(date, today);
          return (
            <button
              key={i}
              type="button"
              aria-label={formatYmd(date)}
              aria-pressed={isSelected}
              onClick={() => onSelect(date)}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring',
                isSelected
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'hover:bg-accent hover:text-accent-foreground',
                !isSelected && isToday && 'border border-input font-medium',
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
