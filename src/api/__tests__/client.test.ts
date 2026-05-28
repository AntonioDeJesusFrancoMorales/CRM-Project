// Test de apiClient.put — verifica que emite PUT con body correcto.
// Usa un handler MSW ad-hoc (server.use) para interceptar la petición.

import { describe, it, expect } from 'vitest';
import { server } from '@/test/server';
import { http, HttpResponse } from 'msw';
import { apiClient } from '@/api/client';

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
