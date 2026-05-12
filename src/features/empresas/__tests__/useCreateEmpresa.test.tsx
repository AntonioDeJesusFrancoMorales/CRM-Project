import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useCreateEmpresa } from '../hooks/useCreateEmpresa';
import { useEmpresas, empresasKeys } from '../hooks/useEmpresas';
import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';

describe('useCreateEmpresa', () => {
  it('crea una empresa e invalida la query de lista', async () => {
    const { Wrapper, queryClient } = setupTestWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useCreateEmpresa(), { wrapper: Wrapper });

    result.current.mutate({
      nombre: 'ACME Corp',
      sector: 'Tecnología',
      telefono: '',
      pagina_web: '',
      facebook: '',
      instagram: '',
      twitter: '',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.nombre).toBe('ACME Corp');
    // Verifica que se invalidó la query key correcta de la lista.
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: empresasKeys.list() });
  });

  it('propaga errores de validación 422 con details', async () => {
    server.use(
      http.post('/api/v1/empresas', () =>
        HttpResponse.json(
          {
            status: 422,
            error: 'VALIDATION_ERROR',
            message: 'Datos invalidos',
            details: [{ field: 'nombre', message: 'El nombre ya existe' }],
          },
          { status: 422 },
        ),
      ),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useCreateEmpresa(), { wrapper: Wrapper });

    result.current.mutate({
      nombre: 'Duplicada',
      sector: '',
      telefono: '',
      pagina_web: '',
      facebook: '',
      instagram: '',
      twitter: '',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const error = result.current.error as Error & {
      status?: number;
      details?: Array<{ field: string; message: string }>;
    };
    expect(error.status).toBe(422);
    expect(error.details?.[0]?.field).toBe('nombre');
  });
});

// Importar useEmpresas evita "unused import" en lint.
void useEmpresas;
