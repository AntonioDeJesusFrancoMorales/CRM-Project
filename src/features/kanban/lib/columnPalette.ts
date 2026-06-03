// Paleta predefinida de colores para columnas del kanban.
// Los colores son hex #RRGGBB coherentes con el sistema de diseño del board.
// Se usan en columnaCreateSchema (validación) y en ColorPaletteField (UI).

export const COLUMN_PALETTE = [
  '#94a3b8', // slate-400   — neutro / pendiente
  '#60a5fa', // blue-400    — en proceso
  '#34d399', // emerald-400 — éxito / ganado
  '#fbbf24', // amber-400   — advertencia / negociación
  '#f87171', // red-400     — riesgo / perdido
  '#a78bfa', // violet-400  — bloqueado / especial
  '#fb923c', // orange-400  — urgente
  '#38bdf8', // sky-400     — seguimiento
  '#4ade80', // green-400   — listo
  '#f472b6', // pink-400    — personalizado
] as const;

export type PaletteColor = (typeof COLUMN_PALETTE)[number];
