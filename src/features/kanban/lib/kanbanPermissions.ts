import type { PermissionCheck } from '@/features/permissions/context';
import type { TipoFicha } from '../schemas/ficha.schema';

export const KANBAN_MOVE_FICHA_CHECKS: readonly PermissionCheck[] = [
  { resource: 'FICHA', action: 'ACTUALIZAR' },
  { resource: 'COLUMNA', action: 'LEER' },
];

export const KANBAN_REORDER_COLUMN_CHECKS: readonly PermissionCheck[] = [
  { resource: 'TABLERO', action: 'ACTUALIZAR' },
  { resource: 'COLUMNA', action: 'LEER' },
];

export const KANBAN_CREATE_COLUMN_CHECKS: readonly PermissionCheck[] = [
  { resource: 'COLUMNA', action: 'CREAR' },
  ...KANBAN_REORDER_COLUMN_CHECKS,
];

export function getKanbanEntityCreationChecks(tipoFicha: TipoFicha): readonly PermissionCheck[] {
  return [
    {
      resource: tipoFicha === 'TAREA' ? 'TAREA' : 'TRATO',
      action: 'CREAR',
    },
    ...KANBAN_MOVE_FICHA_CHECKS,
  ];
}

export function getKanbanEntityDeletionChecks(tipoFicha: TipoFicha): readonly PermissionCheck[] {
  return [
    {
      resource: tipoFicha === 'TAREA' ? 'TAREA' : 'TRATO',
      action: 'ELIMINAR',
    },
    { resource: 'FICHA', action: 'ELIMINAR' },
  ];
}
