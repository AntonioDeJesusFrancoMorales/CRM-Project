// Test de apiClient.put — verifica que emite PUT con body correcto.
// Usa un handler MSW ad-hoc (server.use) para interceptar la petición.

import { describe, it, expect } from 'vitest';
import { server } from '@/test/server';
import { http, HttpResponse } from 'msw';
import { apiClient } from '@/api/client';
import { HttpError } from '@/api/http-error';

describe('apiClient.put', () => {
  it('emite PUT /api/empresas/edit?id=e1 con el body correcto', async () => {
    let capturedMethod = '';
    let capturedBody: unknown = null;

    server.use(
      http.put('/api/empresas/edit', async ({ request }) => {
        capturedMethod = request.method;
        capturedBody = await request.json();
        return HttpResponse.json({ id: 'e1', nombre: 'X' });
      }),
    );

    const result = await apiClient.put<{ id: string; nombre: string }>(
      '/empresas/edit?id=e1',
      { nombre: 'X' },
    );

    expect(capturedMethod).toBe('PUT');
    expect(capturedBody).toEqual({ nombre: 'X' });
    expect(result).toEqual({ id: 'e1', nombre: 'X' });
  });
});

describe('apiClient.get', () => {
  it('deshabilita HTTP cache en GET para evitar respuestas 304 sin body', async () => {
    let capturedCache: RequestCache | undefined;

    server.use(
      http.get('/api/empresas/get-all', ({ request }) => {
        capturedCache = request.cache;
        return HttpResponse.json([]);
      }),
    );

    await expect(apiClient.get('/empresas/get-all')).resolves.toEqual([]);
    expect(capturedCache).toBe('no-store');
  });
});

describe('apiClient — manejo de errores de autorización', () => {
  it('propaga HttpError honesto ante 403 (sin desloguear ni mensaje de rol)', async () => {
    server.use(
      http.get('/api/empresas', () =>
        HttpResponse.json({ error: 'FORBIDDEN', message: 'No permitido' }, { status: 403 }),
      ),
    );

    await expect(apiClient.get('/empresas')).rejects.toMatchObject({
      status: 403,
      code: 'FORBIDDEN',
    });
    await expect(apiClient.get('/empresas')).rejects.toBeInstanceOf(HttpError);
  });

  it('ante 401 sin sesión activa lanza HttpError sin entrar en loop', async () => {
    // Sin Keycloak autenticado y sin token persistido, el 401 no dispara retry ni corte:
    // solo propaga el error (un único fetch, sin recursión).
    let calls = 0;
    server.use(
      http.get('/api/empresas', () => {
        calls += 1;
        return HttpResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
      }),
    );

    await expect(apiClient.get('/empresas')).rejects.toMatchObject({ status: 401 });
    expect(calls).toBe(1); // un solo intento: sin loop
  });
});
