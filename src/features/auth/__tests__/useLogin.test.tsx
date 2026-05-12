import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useLogin } from '../hooks/useLogin';
import { useAuthStore } from '@/store/authStore';
import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';

describe('useLogin', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null, usuario: null });
  });

  it('persiste token + usuario en authStore tras login exitoso', async () => {
    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useLogin(), { wrapper: Wrapper });

    result.current.mutate({ email: 'admin@crm.test', password: 'Admin123!' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const state = useAuthStore.getState();
    expect(state.token).toBeTruthy();
    expect(state.usuario?.correo).toBe('admin@crm.test');
    expect(state.usuario?.rol_sistema).toBe('admin');
  });

  it('NO persiste sesión cuando el backend responde 401', async () => {
    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useLogin(), { wrapper: Wrapper });

    result.current.mutate({ email: 'no@existe.com', password: 'malpass123' });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.usuario).toBeNull();
  });

  it('reporta error de validación 422 con detalles por campo', async () => {
    // Override: el backend responde 422 con un detalle por campo.
    server.use(
      http.post('/api/v1/auth/login', () =>
        HttpResponse.json(
          {
            status: 422,
            error: 'VALIDATION_ERROR',
            message: 'Datos invalidos',
            details: [{ field: 'email', message: 'Correo invalido' }],
          },
          { status: 422 },
        ),
      ),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useLogin(), { wrapper: Wrapper });

    result.current.mutate({ email: 'malformed', password: 'Admin123!' });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const error = result.current.error as Error & { status?: number; details?: Array<{ field: string; message: string }> };
    expect(error.status).toBe(422);
    expect(error.details?.[0]?.field).toBe('email');
  });
});
