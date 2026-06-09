/**
 * Etiquetas y clases de color para el badge de estado (activo/inactivo) de un rol.
 * Light: tintes suaves. Dark: fondos 900/800 con opacidad y texto 300 para contraste WCAG AA.
 * Misma convención que estadoRelacion de empresas.
 */

export const estadoRolLabel = (activo: boolean): string =>
  activo ? 'Activo' : 'Inactivo';

export const estadoRolBadgeClass = (activo: boolean): string =>
  activo
    ? 'border-transparent bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
    : 'border-transparent bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300';
