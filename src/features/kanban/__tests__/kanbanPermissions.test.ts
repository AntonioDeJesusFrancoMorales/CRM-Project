import { describe, expect, it } from 'vitest';
import {
  KANBAN_CREATE_COLUMN_CHECKS,
  KANBAN_MOVE_FICHA_CHECKS,
  KANBAN_REORDER_COLUMN_CHECKS,
  getKanbanEntityCreationChecks,
  getKanbanEntityDeletionChecks,
} from '../lib/kanbanPermissions';

describe('Kanban permission gates', () => {
  it('requires ficha update and column read to move a ficha', () => {
    expect(KANBAN_MOVE_FICHA_CHECKS).toEqual([
      { resource: 'FICHA', action: 'ACTUALIZAR' },
      { resource: 'COLUMNA', action: 'LEER' },
    ]);
  });

  it('requires board update and column read to reorder or remove columns', () => {
    expect(KANBAN_REORDER_COLUMN_CHECKS).toEqual([
      { resource: 'TABLERO', action: 'ACTUALIZAR' },
      { resource: 'COLUMNA', action: 'LEER' },
    ]);
  });

  it('requires column create in addition to the assignment permissions', () => {
    expect(KANBAN_CREATE_COLUMN_CHECKS).toEqual([
      { resource: 'COLUMNA', action: 'CREAR' },
      ...KANBAN_REORDER_COLUMN_CHECKS,
    ]);
  });

  it('requires entity creation and ficha movement to create from a board', () => {
    expect(getKanbanEntityCreationChecks('TRATO')).toEqual([
      { resource: 'TRATO', action: 'CREAR' },
      ...KANBAN_MOVE_FICHA_CHECKS,
    ]);
    expect(getKanbanEntityCreationChecks('TAREA')[0]).toEqual({
      resource: 'TAREA',
      action: 'CREAR',
    });
  });

  it('requires entity deletion and ficha deletion to delete a card', () => {
    expect(getKanbanEntityDeletionChecks('TRATO')).toEqual([
      { resource: 'TRATO', action: 'ELIMINAR' },
      { resource: 'FICHA', action: 'ELIMINAR' },
    ]);
    expect(getKanbanEntityDeletionChecks('TAREA')).toEqual([
      { resource: 'TAREA', action: 'ELIMINAR' },
      { resource: 'FICHA', action: 'ELIMINAR' },
    ]);
  });
});
