// Tests del handler MSW de roles — contrato RPC del back.
// GET /api/roles/get-all retorna lista con campos id, nombre, descripcion, activo.

import { describe, it, expect } from 'vitest';

describe('GET /api/roles/get-all — retorna lista de roles', () => {
  it('responde 200 con un array de al menos 2 roles', async () => {
    const res = await fetch('/api/roles/get-all');
    expect(res.status).toBe(200);
    const data = (await res.json()) as unknown[];
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(2);
  });

  it('los roles tienen los campos id, nombre, descripcion y activo', async () => {
    const res = await fetch('/api/roles/get-all');
    const data = (await res.json()) as Record<string, unknown>[];
    data.forEach((r) => {
      expect('id' in r).toBe(true);
      expect('nombre' in r).toBe(true);
      expect('descripcion' in r).toBe(true);
      expect('activo' in r).toBe(true);
    });
  });

  it('descripcion puede ser string o null', async () => {
    const res = await fetch('/api/roles/get-all');
    const data = (await res.json()) as { descripcion: string | null }[];
    data.forEach((r) => {
      expect(r.descripcion === null || typeof r.descripcion === 'string').toBe(true);
    });
  });

  it('activo es boolean', async () => {
    const res = await fetch('/api/roles/get-all');
    const data = (await res.json()) as { activo: unknown }[];
    data.forEach((r) => {
      expect(typeof r.activo).toBe('boolean');
    });
  });
});
