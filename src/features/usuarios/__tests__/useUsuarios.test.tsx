import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useUsuarios } from '../hooks/useUsuarios';
import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';

describe('useUsuarios', () => {
  it('devuelve la lista de usuarios desde el endpoint', async () => {
    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useUsuarios(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeDefined();
    expect(Array.isArray(result.current.data)).toBe(true);
    expect(result.current.data!.length).toBeGreaterThan(0);
    expect(result.current.data![0]).toHaveProperty('nombre');
    expect(result.current.data![0]).toHaveProperty('correo');
    expect(result.current.data![0]).toHaveProperty('rol_sistema');
  });

  it('reporta error cuando el endpoint responde 500', async () => {
    server.use(
      http.get('/api/v1/usuarios', () =>
        HttpResponse.json(
          { status: 500, error: 'INTERNAL_SERVER_ERROR', message: 'Error interno' },
          { status: 500 },
        ),
      ),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useUsuarios(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });
});
