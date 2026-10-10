import { describe, expect, it } from 'vitest';
import type { PermisoRecurso } from '@/api/types';
import {
  canFromPermisos,
  canReadGroupFromPermisos,
  canWriteGroupFromPermisos,
  applyPermissionTemplate,
  getSupportedScopes,
  normalizePermisos,
} from './permissions';

const tratoPermission: PermisoRecurso = {
  recurso: 'TRATO',
  acciones: ['LEER', 'ACTUALIZAR'],
  alcance: 'TODO_COMPARTIDO',
  idsPermitidos: null,
  gruposLectura: ['FINANCIERO'],
  gruposEscritura: ['FINANCIERO'],
};

describe('permission normalization and evaluation', () => {
  it('keeps null sensitive groups distinct from an explicit empty list', () => {
    const normalized = normalizePermisos([
      { ...tratoPermission, gruposLectura: null, gruposEscritura: null },
      { ...tratoPermission, recurso: 'TAREA', gruposLectura: [], gruposEscritura: [] },
    ]);

    expect(normalized[0]?.gruposLectura).toBeNull();
    expect(normalized[1]?.gruposLectura).toEqual([]);
    expect(canReadGroupFromPermisos(normalized, 'TRATO', 'FINANCIERO')).toBe(false);
    expect(canReadGroupFromPermisos(normalized, 'TAREA', 'FINANCIERO')).toBe(false);
  });

  it('evaluates actions and sensitive read/write groups from the backend matrix', () => {
    expect(canFromPermisos([tratoPermission], 'TRATO', 'LEER')).toBe(true);
    expect(canFromPermisos([tratoPermission], 'TRATO', 'ELIMINAR')).toBe(false);
    expect(canReadGroupFromPermisos([tratoPermission], 'TRATO', 'FINANCIERO')).toBe(true);
    expect(canWriteGroupFromPermisos([tratoPermission], 'TRATO', 'FINANCIERO')).toBe(true);
    expect(canWriteGroupFromPermisos([tratoPermission], 'TRATO', 'CONTACTO_PRIVADO')).toBe(false);
  });

  it('drops malformed permission rows instead of broadening access', () => {
    const normalized = normalizePermisos([
      { recurso: 'UNKNOWN', acciones: ['ADMINISTRAR'] },
      { recurso: 'TRATO', acciones: ['LEER'], alcance: 'UNKNOWN' },
      {
        recurso: 'ROL',
        acciones: ['LEER'],
        alcance: 'PROPIOS_O_ASIGNADOS',
        idsPermitidos: null,
      },
    ]);

    expect(normalized).toHaveLength(0);
    expect(canFromPermisos(normalized, 'EMPRESA', 'LEER')).toBe(false);
  });

  it('preserves only valid UUIDs for TABLEROS_PERMITIDOS rows', () => {
    const normalized = normalizePermisos([
      {
        recurso: 'TABLERO',
        acciones: ['LEER'],
        alcance: 'TABLEROS_PERMITIDOS',
        idsPermitidos: ['not-a-uuid'],
      },
    ]);

    expect(normalized).toHaveLength(0);
  });

  it('limits supported scopes to the backend resource boundaries', () => {
    expect(getSupportedScopes('TRATO')).toEqual(['TODO_COMPARTIDO', 'PROPIOS_O_ASIGNADOS']);
    expect(getSupportedScopes('TABLERO')).toEqual(['TODO_COMPARTIDO', 'TABLEROS_PERMITIDOS']);
    expect(getSupportedScopes('ROL')).toEqual(['TODO_COMPARTIDO']);
  });

  it('creates the OPERATIVO template with shared work grants only', () => {
    const template = applyPermissionTemplate('OPERATIVO');

    expect(template.find((permission) => permission.recurso === 'TRATO')).toMatchObject({
      acciones: ['LEER', 'CREAR', 'ACTUALIZAR'],
      alcance: 'TODO_COMPARTIDO',
    });
    expect(template.find((permission) => permission.recurso === 'ROL')).toMatchObject({
      acciones: [],
      alcance: 'TODO_COMPARTIDO',
    });
  });
});
