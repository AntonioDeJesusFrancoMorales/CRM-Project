// Tests de la fuente única de rutas RPC del back.
// F1.1: endpoints.empresas — getAll, create, edit, delete (sin getById)
// F1.2: endpoints.tareas  — getAll, getById, create, edit, delete
// B1.1: endpoints.contactos — getAll, getById, create, edit, delete

import { describe, it, expect } from 'vitest';
import { endpoints } from '@/api/endpoints';

describe('endpoints.empresas — rutas RPC', () => {
  it('getAll() retorna /empresas/get-all', () => {
    expect(endpoints.empresas.getAll()).toBe('/empresas/get-all');
  });

  it('create() retorna /empresas/create', () => {
    expect(endpoints.empresas.create()).toBe('/empresas/create');
  });

  it('edit(id) retorna /empresas/edit?id=abc', () => {
    expect(endpoints.empresas.edit('abc')).toBe('/empresas/edit?id=abc');
  });

  it('delete(id) retorna /empresas/delete?id=abc', () => {
    expect(endpoints.empresas.delete('abc')).toBe('/empresas/delete?id=abc');
  });

  it('NO expone propiedad getById en endpoints.empresas', () => {
    expect('getById' in endpoints.empresas).toBe(false);
  });
});

describe('endpoints.tareas — rutas RPC', () => {
  it('getAll() retorna /tareas/get-all', () => {
    expect(endpoints.tareas.getAll()).toBe('/tareas/get-all');
  });

  it('getById(id) retorna /tareas/get-by-id?id=t1', () => {
    expect(endpoints.tareas.getById('t1')).toBe('/tareas/get-by-id?id=t1');
  });

  it('create() retorna /tareas/create', () => {
    expect(endpoints.tareas.create()).toBe('/tareas/create');
  });

  it('edit(id) retorna /tareas/edit?id=t1', () => {
    expect(endpoints.tareas.edit('t1')).toBe('/tareas/edit?id=t1');
  });

  it('delete(id) retorna /tareas/delete?id=t1', () => {
    expect(endpoints.tareas.delete('t1')).toBe('/tareas/delete?id=t1');
  });
});

describe('endpoints.contactos — rutas RPC', () => {
  it('getAll() retorna /contactos/get-all', () => {
    expect(endpoints.contactos.getAll()).toBe('/contactos/get-all');
  });

  it('getById(id) retorna /contactos/get-by-id?id=c1', () => {
    expect(endpoints.contactos.getById('c1')).toBe('/contactos/get-by-id?id=c1');
  });

  it('create() retorna /contactos/create', () => {
    expect(endpoints.contactos.create()).toBe('/contactos/create');
  });

  it('edit(id) retorna /contactos/edit?id=c1', () => {
    expect(endpoints.contactos.edit('c1')).toBe('/contactos/edit?id=c1');
  });

  it('delete(id) retorna /contactos/delete?id=c1', () => {
    expect(endpoints.contactos.delete('c1')).toBe('/contactos/delete?id=c1');
  });
});
