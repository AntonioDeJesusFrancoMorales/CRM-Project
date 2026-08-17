// Badges de tarea — fuente única de labels + clases de color con variantes dark.
// Replica EXACTA del criterio de colores de KanbanColumn (prioridadBadgeClasses, tipo)
// para mantener consistencia visual entre la tabla de tareas y el tablero Kanban.

import type { PrioridadTarea, TipoTarea } from '@/api/types';

/** Etiquetas legibles para la prioridad de una tarea. */
export const prioridadLabels: Record<PrioridadTarea, string> = {
  BAJA: 'Baja',
  MEDIA: 'Media',
  ALTA: 'Alta',
  URGENTE: 'Urgente',
};

/**
 * Clases de color para el badge de prioridad.
 * Mismo criterio que KanbanColumn.prioridadBadgeClasses:
 * light tintes suaves, dark fondos 900/800 con opacidad y texto 300/700.
 */
export const prioridadBadgeClass: Record<PrioridadTarea, string> = {
  BAJA: 'bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-400/10 dark:text-slate-300 dark:ring-slate-400/20',
  MEDIA: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-400/20',
  ALTA: 'bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-500/10 dark:text-orange-400 dark:ring-orange-400/20',
  URGENTE: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-400/20',
};

export const tareaBadgeBaseClass =
  'inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset';

/** Etiquetas legibles para el tipo de una tarea. */
export const tipoLabels: Record<TipoTarea, string> = {
  GENERAL: 'General',
  SEGUIMIENTO: 'Seguimiento',
  NEGOCIACION: 'Negociación',
  CIERRE: 'Cierre',
};
