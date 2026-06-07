import type { EstadoRelacion } from '@/api/types';

/** Etiquetas legibles para cada estado de relación. Fuente única para tabla y detalle. */
export const estadoRelacionLabels: Record<EstadoRelacion, string> = {
  ACTIVO: 'Activo',
  INACTIVO: 'Inactivo',
  PROSPECTO: 'Prospecto',
};

/**
 * Clases de color para el badge de estado de relación.
 * Light: tintes suaves. Dark: fondos 900/800 con opacidad y texto 300 para contraste WCAG AA.
 */
export const estadoRelacionBadgeClass: Record<EstadoRelacion, string> = {
  ACTIVO:
    'border-transparent bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  INACTIVO:
    'border-transparent bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300',
  PROSPECTO:
    'border-transparent bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
};
