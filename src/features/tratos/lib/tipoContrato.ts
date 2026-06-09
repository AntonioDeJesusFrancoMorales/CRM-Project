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
    'border-transparent bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  LICENCIA:
    'border-transparent bg-violet-50 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  SUSCRIPCION:
    'border-transparent bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  PERMANENTE:
    'border-transparent bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  OTRO:
    'border-transparent bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300',
};
