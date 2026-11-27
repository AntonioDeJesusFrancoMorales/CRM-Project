// Tests de los handlers MSW de empresas — contrato RPC del back.
// F2.1: rutas RPC, PUT en edit, id por query param, campos camelCase, sin filtros server-side.

import { describe, it, expect, vi } from 'vitest';
import { empresasFixture } from '@/mocks/fixtures/empresas';

// IDs del fixture
const EMPRESA_ID = 'a1111111-aaaa-1111-aaaa-111111111111';
const EMPRESA_NONEXISTENT = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

describe('empresas MSW handler — GET /api/empresas/get-all', () => {
  it('retorna la lista completa sin filtros server-side', async () => {
    const res = await fetch('/api/empresas/get-all');
    expect(res.status).toBe(200);
    const data = (await res.json()) as unknown[];
    expect(data).toHaveLength(empresasFixture.length);
  });

  it('los items tienen campos camelCase: paginaWeb y estadoRelacion', async () => {
    const res = await fetch('/api/empresas/get-all');
    const data = (await res.json()) as Record<string, unknown>[];
    expect(data.length).toBeGreaterThan(0);
    // paginaWeb en camelCase (no pagina_web)
    data.forEach((e) => {
      expect('paginaWeb' in e).toBe(true);
      expect('pagina_web' in e).toBe(false);
      // estadoRelacion presente
      expect('estadoRelacion' in e).toBe(true);
    });
  });
});

describe('empresas MSW handler — POST /api/empresas/create', () => {
  it('responde 201 y retorna la empresa creada con id generado', async () => {
    const res = await fetch('/api/empresas/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'Empresa Test', estadoRelacion: 'ACTIVO' }),
    });
    expect(res.status).toBe(201);
    const data = (await res.json()) as { id: string; nombre: string };
    expect(data.id).toBeTruthy();
    expect(data.nombre).toBe('Empresa Test');
  });
});

describe('empresas MSW handler — PUT /api/empresas/edit?id=', () => {
  it('acepta PUT (no PATCH) y lee el id del query param', async () => {
    const res = await fetch(`/api/empresas/edit?id=${EMPRESA_ID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'Actualizada' }),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { id: string; nombre: string };
    expect(data.id).toBe(EMPRESA_ID);
    expect(data.nombre).toBe('Actualizada');
  });

  it('responde 404 cuando el id no existe', async () => {
    const res = await fetch(`/api/empresas/edit?id=${EMPRESA_NONEXISTENT}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'X' }),
    });
    expect(res.status).toBe(404);
  });

  it('rechaza PATCH (método no registrado — 500 o sin handler)', async () => {
    const before = await (await fetch('/api/empresas/get-all')).json();
    const expectedMessage =
      '[MSW] Error: intercepted a request without a matching request handler:\n\n' +
      `  • PATCH /api/empresas/edit?id=${EMPRESA_ID}\n\n` +
      '  • Request body: {"nombre":"X"}\n\n' +
      'If you still wish to intercept this unhandled request, please create a request handler for it.\n' +
      'Read more: https://mswjs.io/docs/http/intercepting-requests';
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      await expect(fetch(`/api/empresas/edit?id=${EMPRESA_ID}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: 'X' }),
      })).rejects.toThrow(
        '[MSW] Cannot bypass a request when using the "error" strategy for the "onUnhandledRequest" option.',
      );
      expect(consoleError.mock.calls).toEqual([[expectedMessage]]);
    } finally {
      consoleError.mockRestore();
    }
    expect(await (await fetch('/api/empresas/get-all')).json()).toEqual(before);
  });
});

describe('empresas MSW handler — DELETE /api/empresas/delete?id=', () => {
  it('responde 204 al eliminar empresa existente', async () => {
    const res = await fetch(`/api/empresas/delete?id=${EMPRESA_ID}`, {
      method: 'DELETE',
    });
    expect(res.status).toBe(204);
  });

  it('responde 404 al intentar eliminar empresa inexistente', async () => {
    const res = await fetch(`/api/empresas/delete?id=${EMPRESA_NONEXISTENT}`, {
      method: 'DELETE',
    });
    expect(res.status).toBe(404);
  });
});
