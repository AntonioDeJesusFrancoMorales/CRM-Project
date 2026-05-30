import { describe, it, expect } from 'vitest';
import { resolveRolNombre } from '../lib/rolLookup';
import type { Rol } from '@/api/types';

const roles: Rol[] = [
  { id: 'rol-admin-uuid', nombre: 'Administrador', descripcion: 'Acceso total', activo: true },
  { id: 'rol-user-uuid', nombre: 'Usuario', descripcion: null, activo: true },
];

describe('resolveRolNombre', () => {
  it('retorna el nombre del rol cuando el id existe en la lista', () => {
    expect(resolveRolNombre('rol-admin-uuid', roles)).toBe('Administrador');
    expect(resolveRolNombre('rol-user-uuid', roles)).toBe('Usuario');
  });

  it('retorna el rolId como fallback cuando el array está vacío', () => {
    expect(resolveRolNombre('rol-unknown-uuid', [])).toBe('rol-unknown-uuid');
  });

  it('retorna el rolId como fallback cuando el id no se encuentra en la lista', () => {
    expect(resolveRolNombre('rol-inexistente-uuid', roles)).toBe('rol-inexistente-uuid');
  });

  it('diferencia entre ids similares (no hace partial match)', () => {
    expect(resolveRolNombre('rol-admin', roles)).toBe('rol-admin');
  });
});
