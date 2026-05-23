import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useTratosByCliente } from '../hooks/useTratosByCliente';
import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';

// c1111111 tiene 1 trato en el fixture (d2222222 cliente_id = c1111111)
const ID_CON_TRATOS = 'c1111111-cccc-1111-cccc-111111111111';
// c3333333 (Valentina Cruz) no tiene tratos en el fixture
const ID_SIN_TRATOS = 'c3333333-cccc-3333-cccc-333333333333';

describe('useTratosByCliente', () => {
  it('devuelve los tratos de un cliente con tratos vinculados', async () => {
    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useTratosByCliente(ID_CON_TRATOS), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(Array.isArray(result.current.data)).toBe(true);
    expect(result.current.data!.length).toBeGreaterThan(0);
    expect(result.current.data![0]).toHaveProperty('cliente_id', ID_CON_TRATOS);
  });

  it('devuelve array vacío cuando el cliente no tiene tratos', async () => {
    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useTratosByCliente(ID_SIN_TRATOS), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([]);
  });

  it('no ejecuta la query cuando el id está vacío', () => {
    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useTratosByCliente(''), { wrapper: Wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.isPending).toBe(true);
  });

  it('reporta error cuando el endpoint responde 500', async () => {
    server.use(
      http.get('/api/v1/clientes/:id/tratos', () =>
        HttpResponse.json(
          { status: 500, error: 'INTERNAL_SERVER_ERROR', message: 'Error interno' },
          { status: 500 },
        ),
      ),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useTratosByCliente(ID_CON_TRATOS), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });
});
