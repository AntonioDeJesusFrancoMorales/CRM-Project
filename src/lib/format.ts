// Formato de fechas para la UI. Default a español de México neutro.

const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
const dtf = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

/**
 * Formato relativo si la fecha es reciente (< 30 días), absoluto si más viejo.
 * Ejemplos:
 *  - "hace 3 horas"
 *  - "hace 5 días"
 *  - "15 ene 2026"
 */
export function formatRelativeDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';

  const now = Date.now();
  const diffMs = date.getTime() - now;
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (Math.abs(diffDays) > 30) return dtf.format(date);

  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, 'hour');
  return rtf.format(diffDays, 'day');
}

/** Fecha absoluta SIEMPRE (para tooltips o columnas estrictas). */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return dtf.format(date);
}
