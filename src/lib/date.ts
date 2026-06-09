// Helpers de fecha/hora para los pickers — sin dependencias externas.
// Trabajan SIEMPRE en hora local (no UTC) para evitar corrimientos de día.
//
// Formatos del back (LocalDate/LocalTime/LocalDateTime, sin timezone):
//   - fecha     → "YYYY-MM-DD"
//   - hora      → "HH:mm"
//   - fechaHora → "YYYY-MM-DDTHH:mm"

const pad2 = (n: number): string => String(n).padStart(2, '0');

/** Date → "YYYY-MM-DD" (local). */
export function formatYmd(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** "YYYY-MM-DD" → Date local (medianoche). Devuelve null si no parsea. */
export function parseYmd(s: string | null | undefined): Date | null {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (!m) return null;
  const [, y, mo, d] = m;
  const date = new Date(Number(y), Number(mo) - 1, Number(d));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Separa "YYYY-MM-DDTHH:mm" en sus partes. Tolera segundos/fracción del back. */
export function splitDateTime(s: string | null | undefined): {
  date: string | null;
  time: string | null;
} {
  if (!s) return { date: null, time: null };
  const [datePart, timePart] = s.split('T');
  const time = timePart ? timePart.slice(0, 5) : null; // "HH:mm"
  return { date: datePart || null, time: time && /^\d{2}:\d{2}$/.test(time) ? time : null };
}

/** Une fecha "YYYY-MM-DD" + hora "HH:mm" en "YYYY-MM-DDTHH:mm". */
export function joinDateTime(date: string | null, time: string | null): string {
  if (!date) return '';
  return `${date}T${time ?? '09:00'}`;
}

/** Date → texto legible en español, p. ej. "10 jun 2026". */
export function formatDisplayDate(d: Date): string {
  return new Intl.DateTimeFormat('es', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}
