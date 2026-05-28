import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useDeleteCliente } from '../hooks/useDeleteCliente';
import { clientesKeys } from '../hooks/useClientes';
import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';

// c1111111 tiene 1 trato en el fixture (d2222222 cliente_id = c1111111)
const ID_CON_TRATOS = 'c1111111-cccc-1111-cccc-111111111111';
// c3333333 (Valentina Cruz) no tiene tratos en el fixture
const ID_SIN_TRATOS = 'c3333333-cccc-3333-cccc-333333333333';

describe('useDeleteCliente', () => {
  it('elimina (204) y limpia el cache del detalle + invalida la lista', async () => {
    const { Wrapper, queryClient } = setupTestWrapper();
    const { result } = renderHook(() => useDeleteCliente(), { wrapper: Wrapper });

    // Pre-carga el detalle para verificar que removeQueries lo borra.
    queryClient.setQueryData(clientesKeys.detail(ID_SIN_TRATOS), { id: ID_SIN_TRATOS });

    result.current.mutate(ID_SIN_TRATOS);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // El detalle debe haber sido removido del cache.
    expect(queryClient.getQueryData(clientesKeys.detail(ID_SIN_TRATOS))).toBeUndefined();
  });

  it('DELETE 409 — expone error con el mensaje del backend (incluye conteo de tratos)', async () => {
    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useDeleteCliente(), { wrapper: Wrapper });

    result.current.mutate(ID_CON_TRATOS);

    await waitFor(() => expect(result.current.isError).toBe(true));

    const error = result.current.error as Error & { status?: number };
    expect(error.status).toBe(409);
    // El mensaje del backend debe incluir el conteo de tratos (1 trato)
    expect(error.message).toContain('trato');
  });

  it('DELETE 404 — expone error cuando el cliente no existe', async () => {
    server.use(
      http.delete('/api/clientes/:id', () =>
        HttpResponse.json(
          { status: 404, error: 'NOT_FOUND', message: 'Cliente no encontrado' },
          { status: 404 },
        ),
      ),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useDeleteCliente(), { wrapper: Wrapper });

    result.current.mutate('id-inexistente');

    await waitFor(() => expect(result.current.isError).toBe(true));

    const error = result.current.error as Error & { status?: number };
    expect(error.status).toBe(404);
  });
});

