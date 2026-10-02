export function getTratoTaskConflictMessage(taskCount: number): string {
  const taskLabel = taskCount === 1 ? 'tarea' : 'tareas';
  const associatedLabel = taskCount === 1 ? 'asociada' : 'asociadas';
  return `El trato tiene ${taskCount} ${taskLabel} ${associatedLabel} y no se puede eliminar`;
}
