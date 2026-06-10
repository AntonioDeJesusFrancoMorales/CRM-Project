// Pickers de fecha/hora construidos sobre Calendar + Select, con el calendario
// renderizado INLINE (toggle de estado), no en un Popover/portal.
//
// ¿Por qué inline y no Popover? El form de Tarea vive dentro de un Dialog modal.
// Un Popover (portal + overlay) anidado en un Dialog es frágil de testear en jsdom
// (el trigger no togglea) y propenso a conflictos de capa. Inline = mismo
// comportamiento en jsdom y navegador, sin portales anidados.
//
// Exporta:
//   - DatePicker      → valor "YYYY-MM-DD"        (LocalDate del back)
//   - TimeField       → valor "HH:mm"             (LocalTime del back)
//   - DateTimePicker  → valor "YYYY-MM-DDTHH:mm"  (LocalDateTime del back)

import * as React from 'react';
import { Calendar as CalendarIcon, Clock, X, ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  formatYmd,
  parseYmd,
  formatDisplayDate,
  splitDateTime,
  joinDateTime,
} from '@/lib/date';
import { Calendar } from './calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';

// Estilo del trigger — homologa SelectTrigger.
const TRIGGER_CLASS =
  'flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

// Contenedor del panel inline (calendario / calendario+hora).
// Se despliega HACIA ARRIBA: posicionado en absolute sobre el trigger (bottom-full)
// dentro de un wrapper relative. Sigue siendo inline (sin portal) — solo cambia la
// dirección de apertura para no empujar el contenido de abajo ni quedar tapado por
// el borde inferior de los Dialogs.
const PANEL_CLASS =
  'absolute bottom-full left-0 z-50 mb-2 w-max rounded-md border border-border bg-popover p-3 shadow-md';

const HOURS = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0'));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

// ---------------------------------------------------------------------------
// TimeField — hora "HH:mm" mediante dos Selects (hora + minuto).
// ---------------------------------------------------------------------------

interface TimeFieldProps {
  value: string | null;
  onChange: (value: string | null) => void;
  /** Permite limpiar el valor (p. ej. hora de fin opcional). */
  allowClear?: boolean;
  disabled?: boolean;
  /** Prefijo para los aria-label de los selects (p. ej. "Hora de inicio"). */
  label?: string;
}

export function TimeField({
  value,
  onChange,
  allowClear = false,
  disabled = false,
  label = 'Hora',
}: TimeFieldProps) {
  const [hh, mm] = value ? value.split(':') : ['', ''];

  const setHour = (h: string) => onChange(`${h}:${mm || '00'}`);
  const setMinute = (m: string) => onChange(`${hh || '00'}:${m}`);

  return (
    <div className="flex items-center gap-1.5">
      <Clock className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <Select value={hh || ''} onValueChange={setHour} disabled={disabled}>
        <SelectTrigger aria-label={`${label} (hora)`} className="w-[4.5rem]">
          <SelectValue placeholder="--" />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {HOURS.map((h) => (
            <SelectItem key={h} value={h}>
              {h}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-muted-foreground">:</span>
      <Select value={mm || ''} onValueChange={setMinute} disabled={disabled}>
        <SelectTrigger aria-label={`${label} (minutos)`} className="w-[4.5rem]">
          <SelectValue placeholder="--" />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {MINUTES.map((m) => (
            <SelectItem key={m} value={m}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {allowClear && value && (
        <button
          type="button"
          aria-label={`Limpiar ${label.toLowerCase()}`}
          onClick={() => onChange(null)}
          disabled={disabled}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// DatePicker — fecha "YYYY-MM-DD"; calendario inline.
// ---------------------------------------------------------------------------

interface DatePickerProps
  extends Omit<React.ComponentPropsWithoutRef<'button'>, 'onChange' | 'value'> {
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const DatePicker = React.forwardRef<HTMLButtonElement, DatePickerProps>(
  ({ value, onChange, placeholder = 'Elegí una fecha', className, disabled, ...props }, ref) => {
    const [open, setOpen] = React.useState(false);
    const selected = parseYmd(value);

    return (
      <div className="relative">
        <button
          ref={ref}
          type="button"
          disabled={disabled}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className={cn(TRIGGER_CLASS, !selected && 'text-muted-foreground', className)}
          {...props}
        >
          <span className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
            {selected ? formatDisplayDate(selected) : placeholder}
          </span>
          <ChevronDown
            className={cn('h-4 w-4 shrink-0 opacity-50 transition-transform', open && 'rotate-180')}
            aria-hidden="true"
          />
        </button>
        {open && (
          <div className={PANEL_CLASS}>
            <Calendar
              selected={selected}
              onSelect={(date) => {
                onChange(formatYmd(date));
                setOpen(false);
              }}
            />
          </div>
        )}
      </div>
    );
  },
);
DatePicker.displayName = 'DatePicker';

// ---------------------------------------------------------------------------
// DateTimePicker — "YYYY-MM-DDTHH:mm"; calendario + hora inline.
// ---------------------------------------------------------------------------

interface DateTimePickerProps
  extends Omit<React.ComponentPropsWithoutRef<'button'>, 'onChange' | 'value'> {
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const DateTimePicker = React.forwardRef<HTMLButtonElement, DateTimePickerProps>(
  ({ value, onChange, placeholder = 'Elegí fecha y hora', className, disabled, ...props }, ref) => {
    const [open, setOpen] = React.useState(false);
    const { date, time } = splitDateTime(value);
    const selected = parseYmd(date);

    return (
      <div className="relative">
        <button
          ref={ref}
          type="button"
          disabled={disabled}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className={cn(TRIGGER_CLASS, !selected && 'text-muted-foreground', className)}
          {...props}
        >
          <span className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
            {selected ? `${formatDisplayDate(selected)}, ${time ?? '09:00'}` : placeholder}
          </span>
          <ChevronDown
            className={cn('h-4 w-4 shrink-0 opacity-50 transition-transform', open && 'rotate-180')}
            aria-hidden="true"
          />
        </button>
        {open && (
          <div className={cn(PANEL_CLASS, 'space-y-3')}>
            <Calendar
              selected={selected}
              onSelect={(picked) => {
                // Conserva la hora elegida; si no hay, usa 09:00 por defecto.
                onChange(joinDateTime(formatYmd(picked), time ?? '09:00'));
              }}
            />
            <div className="border-t border-border pt-3">
              <TimeField
                label="Hora"
                value={time}
                onChange={(t) => {
                  // Si aún no hay día elegido, asume hoy.
                  const baseDate = date ?? formatYmd(new Date());
                  onChange(joinDateTime(baseDate, t ?? '09:00'));
                }}
              />
            </div>
          </div>
        )}
      </div>
    );
  },
);
DateTimePicker.displayName = 'DateTimePicker';
