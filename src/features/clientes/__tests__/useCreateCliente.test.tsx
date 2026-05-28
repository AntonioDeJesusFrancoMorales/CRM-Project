import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useCreateCliente } from '../hooks/useCreateCliente';
import { clientesKeys } from '../hooks/useClientes';
import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';

describe('useCreateCliente', () => {
  it('crea un cliente e invalida la query de lista', async () => {
    const { Wrapper, queryClient } = setupTestWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useCreateCliente(), { wrapper: Wrapper });

    result.current.mutate({
      nombre_contacto: 'Nuevo Cliente Test',
      empresa_id: 'a1111111-aaaa-1111-aaaa-111111111111',
      responsable_id: '11111111-1111-1111-1111-111111111111',
      correo_contacto: '',
      telefono_contacto: '',
      cargo_contacto: '',
      notas: '',
      como_nos_conocio: undefined,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.nombre_contacto).toBe('Nuevo Cliente Test');
    // El cliente creado manualmente debe tener prospecto_origen_id null
    expect(result.current.data?.prospecto_origen_id).toBeNull();
    // Verifica invalidación de todas las queries de clientes (prefix-match via clientesKeys.all)
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: clientesKeys.all });
  });

  it('propaga error 422 con details cuando hay validación fallida', async () => {
    server.use(
      http.post('/api/clientes', () =>
        HttpResponse.json(
          {
            status: 422,
            error: 'VALIDATION_ERROR',
            message: 'Datos inválidos',
            details: [{ field: 'nombre_contacto', message: 'Ya existe un cliente con ese nombre' }],
          },
          { status: 422 },
        ),
      ),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useCreateCliente(), { wrapper: Wrapper });

    result.current.mutate({
      nombre_contacto: 'Duplicado',
      empresa_id: 'a1111111-aaaa-1111-aaaa-111111111111',
      responsable_id: '11111111-1111-1111-1111-111111111111',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const error = result.current.error as Error & {
      status?: number;
      details?: Array<{ field: string; message: string }>;
    };
    expect(error.status).toBe(422);
    expect(error.details?.[0]?.field).toBe('nombre_contacto');
  });
});

