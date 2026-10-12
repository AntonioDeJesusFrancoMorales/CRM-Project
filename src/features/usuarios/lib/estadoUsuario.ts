// Estilos del badge de estado de un usuario (activo / inactivo).
// Réplica del molde de estadoRelacion: tinte suave en light, fondo 900/40 en dark.

/** Etiqueta legible según el flag `activo`. */
export function estadoUsuarioLabel(activo: boolean): string {
  return activo ? 'Activo' : 'Inactivo';
}

/**
 * Clases de color para el badge de estado del usuario.
 * Tinte suave compartido con el estado visual de la referencia Pipely.
 */
export function estadoUsuarioBadgeClass(activo: boolean): string {
  return activo
    ? 'border-transparent bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
    : 'border-transparent bg-slate-500/10 text-slate-600 dark:text-slate-400';
}
