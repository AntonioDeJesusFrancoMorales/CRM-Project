import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useCliente } from '../hooks/useCliente';
import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';

const EXISTING_ID = 'c1111111-cccc-1111-cccc-111111111111';

describe('useCliente', () => {
  it('devuelve el cliente por id desde el endpoint', async () => {
    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useCliente(EXISTING_ID), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.id).toBe(EXISTING_ID);
    expect(result.current.data?.nombre_contacto).toBe('Ana Rodríguez');
  });

  it('no ejecuta la query cuando el id está vacío', () => {
    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useCliente(''), { wrapper: Wrapper });

    // enabled: !!id — con id vacío no debe fetchear
    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.isPending).toBe(true);
  });

  it('expone error 404 cuando el cliente no existe', async () => {
    server.use(
      http.get('/api/clientes/:id', () =>
        HttpResponse.json(
          { status: 404, error: 'NOT_FOUND', message: 'Cliente no encontrado' },
          { status: 404 },
        ),
      ),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useCliente('id-inexistente'), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const error = result.current.error as Error & { status?: number };
    expect(error.status).toBe(404);
  });
});

