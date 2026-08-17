import type { TipoContrato } from '@/api/types';

/** Etiquetas legibles de cada tipo de contrato. Fuente única para tabla y detalle. */
export const tipoContratoLabels: Record<TipoContrato, string> = {
  SERVICIO: 'Servicio',
  LICENCIA: 'Licencia',
  SUSCRIPCION: 'Suscripción',
  PERMANENTE: 'Permanente',
  OTRO: 'Otro',
};

/**
 * Clases de color para el badge de cada tipo de contrato.
 * Light: tintes suaves. Dark: fondos 900/800 con opacidad y texto 300 para contraste WCAG AA.
 */
export const tipoContratoBadgeClass: Record<TipoContrato, string> = {
  SERVICIO:
    'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-400/20',
  LICENCIA:
    'bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-500/10 dark:text-violet-400 dark:ring-violet-400/20',
  SUSCRIPCION:
    'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/20',
  PERMANENTE:
    'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-400/20',
  OTRO:
    'bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-400/10 dark:text-slate-300 dark:ring-slate-400/20',
};

export const tipoContratoBadgeBaseClass =
  'inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset';
