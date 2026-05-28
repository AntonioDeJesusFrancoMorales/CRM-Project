import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useUpdateCliente } from '../hooks/useUpdateCliente';
import { clientesKeys } from '../hooks/useClientes';
import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';

const EXISTING_ID = 'c1111111-cccc-1111-cccc-111111111111';

describe('useUpdateCliente', () => {
  it('actualiza un cliente e invalida la lista y el detalle', async () => {
    const { Wrapper, queryClient } = setupTestWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useUpdateCliente(), { wrapper: Wrapper });

    result.current.mutate({
      id: EXISTING_ID,
      data: { nombre_contacto: 'Ana Rodríguez Modificada' },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.nombre_contacto).toBe('Ana Rodríguez Modificada');
    // Debe invalidar AMBAS keys: todas las queries de clientes + detalle
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: clientesKeys.all });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: clientesKeys.detail(EXISTING_ID) });
  });

  it('propaga error 422 cuando hay datos inválidos', async () => {
    server.use(
      http.patch('/api/clientes/:id', () =>
        HttpResponse.json(
          {
            status: 422,
            error: 'VALIDATION_ERROR',
            message: 'Datos inválidos',
            details: [{ field: 'correo_contacto', message: 'Correo inválido' }],
          },
          { status: 422 },
        ),
      ),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useUpdateCliente(), { wrapper: Wrapper });

    result.current.mutate({
      id: EXISTING_ID,
      data: { correo_contacto: 'not-an-email' },
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const error = result.current.error as Error & {
      status?: number;
      details?: Array<{ field: string; message: string }>;
    };
    expect(error.status).toBe(422);
    expect(error.details?.[0]?.field).toBe('correo_contacto');
  });
});

