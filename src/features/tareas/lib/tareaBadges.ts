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
  BAJA: 'border-transparent bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300',
  MEDIA: 'border-transparent bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  ALTA: 'border-transparent bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  URGENTE: 'border-transparent bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

/** Etiquetas legibles para el tipo de una tarea. */
export const tipoLabels: Record<TipoTarea, string> = {
  GENERAL: 'General',
  SEGUIMIENTO: 'Seguimiento',
  NEGOCIACION: 'Negociación',
  CIERRE: 'Cierre',
};
