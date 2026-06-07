// Estilos del badge de estado de un usuario (activo / inactivo).
// Réplica del molde de estadoRelacion: tinte suave en light, fondo 900/40 en dark.

/** Etiqueta legible según el flag `activo`. */
export function estadoUsuarioLabel(activo: boolean): string {
  return activo ? 'Activo' : 'Inactivo';
}

/**
 * Clases de color para el badge de estado del usuario.
 * Light: tintes suaves. Dark: fondos 900/40 (o 800/60) con texto 300 para contraste WCAG AA.
 */
export function estadoUsuarioBadgeClass(activo: boolean): string {
  return activo
    ? 'border-transparent bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
    : 'border-transparent bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300';
}
