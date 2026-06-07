// AgendaEventoRow — fila presentacional de un evento en la lista cronológica.
// Muestra hora (inicio–fin), icono según tipo, asunto, ubicación/link, badge read-only
// del estado del recordatorio, y acciones editar/eliminar.

import { Phone, Video, MapPin, Link2, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import type { Agenda } from '../schemas/agenda.schema';
import { RECORDATORIO_ESTADO_LABEL } from '../schemas/agenda.schema';

interface AgendaEventoRowProps {
  agenda: Agenda;
  onEdit: (agenda: Agenda) => void;
  onDelete: (agenda: Agenda) => void;
}

// Badges con variantes dark (bg-*-50/700 → dark:bg-*-900/40 dark:text-*-300),
// alineado al patrón de estadoRelacion.ts.
const recordatorioBadgeClasses: Record<string, string> = {
  PENDIENTE: 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  ENVIADO: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  FALLIDO: 'bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

/** Recorta "HH:mm:ss" → "HH:mm". */
function hhmm(hora: string | null): string | null {
  return hora ? hora.slice(0, 5) : null;
}

export function AgendaEventoRow({ agenda, onEdit, onDelete }: AgendaEventoRowProps) {
  const Icono = agenda.tipo === 'LLAMADA' ? Phone : Video;
  const inicio = hhmm(agenda.horaInicio);
  const fin = hhmm(agenda.horaFin);

  return (
    <div className="flex items-start gap-3 rounded-md border bg-card px-3 py-2.5 transition-colors hover:border-primary/40">
      {/* Hora */}
      <div className="w-24 flex-shrink-0 pt-0.5 text-sm font-medium tabular-nums text-foreground">
        {inicio}
        {fin && <span className="text-muted-foreground"> – {fin}</span>}
      </div>

      {/* Icono tipo */}
      <Icono className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" aria-hidden="true" />

      {/* Contenido */}
      <div className="min-w-0 flex-1 space-y-1">
        <p className="truncate text-sm font-medium text-foreground" title={agenda.asunto}>
          {agenda.asunto}
        </p>

        {/* Detalles: ubicación / link */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {agenda.ubicacion && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" aria-hidden="true" />
              {agenda.ubicacion}
            </span>
          )}
          {agenda.linkVideollamada && (
            <a
              href={agenda.linkVideollamada}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              <Link2 className="h-3 w-3" aria-hidden="true" />
              Videollamada
            </a>
          )}
        </div>

        {/* Badge read-only del recordatorio */}
        {agenda.recordatorioHabilitado && agenda.recordatorioEstado && (
          <span
            className={[
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
              recordatorioBadgeClasses[agenda.recordatorioEstado] ??
                'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300',
            ].join(' ')}
          >
            <Bell className="h-3 w-3" aria-hidden="true" />
            {RECORDATORIO_ESTADO_LABEL[agenda.recordatorioEstado]}
            {agenda.minutosAntes ? ` · ${agenda.minutosAntes} min antes` : ''}
          </span>
        )}
      </div>

      {/* Acciones */}
      <div className="flex flex-shrink-0 items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          aria-label="Editar evento"
          onClick={() => onEdit(agenda)}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          aria-label="Eliminar evento"
          onClick={() => onDelete(agenda)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
