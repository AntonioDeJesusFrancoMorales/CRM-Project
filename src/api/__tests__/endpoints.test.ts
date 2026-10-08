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

// F1.1 — usuarios RPC + roles
describe('endpoints.usuarios — rutas RPC', () => {
  it('getAll() retorna /usuarios/get-all', () => {
    expect(endpoints.usuarios.getAll()).toBe('/usuarios/get-all');
  });

  it('getById(id) retorna /usuarios/get-by-id?id=u1', () => {
    expect(endpoints.usuarios.getById('u1')).toBe('/usuarios/get-by-id?id=u1');
  });

  it('create() retorna /usuarios/create', () => {
    expect(endpoints.usuarios.create()).toBe('/usuarios/create');
  });

  it('edit(id) retorna /usuarios/edit?id=u1', () => {
    expect(endpoints.usuarios.edit('u1')).toBe('/usuarios/edit?id=u1');
  });

  it('delete(id) retorna /usuarios/delete?id=u1', () => {
    expect(endpoints.usuarios.delete('u1')).toBe('/usuarios/delete?id=u1');
  });
});

describe('endpoints.roles — rutas RPC', () => {
  it('getAll() retorna /roles/get-all', () => {
    expect(endpoints.roles.getAll()).toBe('/roles/get-all');
  });
});

describe('endpoints.agent — contrato del asistente', () => {
  it('messages() retorna /agent/messages sin duplicar el prefijo /api', () => {
    expect(endpoints.agent.messages()).toBe('/agent/messages');
  });
});

describe('endpoints.wa — stream runtime', () => {
  it('stream() conserva la ruta SSE /wa/stream', () => {
    expect(endpoints.wa.stream()).toBe('/wa/stream');
  });
});
