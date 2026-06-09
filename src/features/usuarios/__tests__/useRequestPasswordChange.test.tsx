import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useRequestPasswordChange } from '../hooks/useRequestPasswordChange';
import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';

describe('useRequestPasswordChange', () => {
  it('envia POST /api/usuarios/request-password-change SIN body (el back usa el token)', async () => {
    let capturedMethod: string | null = null;
    let capturedBody: string | null = null;

    server.use(
      http.post('/api/usuarios/request-password-change', async ({ request }) => {
        capturedMethod = request.method;
        capturedBody = await request.text();
        // El back responde 202 Accepted sin cuerpo.
        return new HttpResponse(null, { status: 202 });
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useRequestPasswordChange(), { wrapper: Wrapper });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(capturedMethod).toBe('POST');
    // No mandamos contraseña: el body va vacío.
    expect(capturedBody).toBe('');
  });

  it('NO falla al parsear el 202 sin cuerpo (regresión: el cliente trata 202 como no-content)', async () => {
    server.use(
      http.post('/api/usuarios/request-password-change', () =>
        new HttpResponse(null, { status: 202 }),
      ),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useRequestPasswordChange(), { wrapper: Wrapper });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.isError).toBe(false);
  });

  it('propaga error cuando el back falla (500)', async () => {
    server.use(
      http.post('/api/usuarios/request-password-change', () =>
        HttpResponse.json(
          { status: 500, error: 'SERVER_ERROR', message: 'No fue posible enviar el correo' },
          { status: 500 },
        ),
      ),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useRequestPasswordChange(), { wrapper: Wrapper });

    result.current.mutate();

    await waitFor(() => expect(result.current.isError).toBe(true));

    const error = result.current.error as Error & { status?: number };
    expect(error.status).toBe(500);
  });
});
