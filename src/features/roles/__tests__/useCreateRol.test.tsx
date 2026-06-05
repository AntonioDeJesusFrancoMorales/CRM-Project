import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useCreateRol } from '../hooks/useCreateRol';
import { rolesKeys } from '../hooks/useRoles';
import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';

describe('useCreateRol', () => {
  it('envia POST /api/roles/create e invalida la query de lista', async () => {
    const { Wrapper, queryClient } = setupTestWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useCreateRol(), { wrapper: Wrapper });

    result.current.mutate({ nombre: 'Coordinador', descripcion: 'Coordina ventas' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.nombre).toBe('Coordinador');
    expect(result.current.data?.activo).toBe(true);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: rolesKeys.list() });
  });

  it('propaga errores de validación 422 con details', async () => {
    server.use(
      http.post('/api/roles/create', () =>
        HttpResponse.json(
          {
            status: 422,
            error: 'VALIDATION_ERROR',
            message: 'Datos inválidos',
            details: [{ field: 'nombre', message: 'El nombre ya existe' }],
          },
          { status: 422 },
        ),
      ),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useCreateRol(), { wrapper: Wrapper });

    result.current.mutate({ nombre: 'Duplicado' });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const error = result.current.error as Error & {
      status?: number;
      details?: Array<{ field: string; message: string }>;
    };
    expect(error.status).toBe(422);
    expect(error.details?.[0]?.field).toBe('nombre');
  });
});
