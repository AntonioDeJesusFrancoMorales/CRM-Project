import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import type { Empresa } from '@/api/types';
import { useCreateEmpresa } from '../hooks/useCreateEmpresa';
import { useEmpresas, empresasKeys } from '../hooks/useEmpresas';
import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';
import { empresasFixture } from '@/mocks/fixtures/empresas';

describe('useCreateEmpresa', () => {
  it('crea una empresa e invalida la query de lista', async () => {
    const { Wrapper, queryClient } = setupTestWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useCreateEmpresa(), { wrapper: Wrapper });

    result.current.mutate({
      nombre: 'ACME Corp',
      sector: 'Tecnología',
      telefono: '',
      paginaWeb: '',
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
      http.post('/api/empresas/create', () =>
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
      paginaWeb: '',
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

  it('trims and normalizes web and social values before sending the payload', async () => {
    let requestBody: Record<string, unknown> | undefined;
    server.use(
      http.post('/api/empresas/create', async ({ request }) => {
        requestBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          { ...empresasFixture[0], id: 'normalized-create', nombre: 'Acme' },
          { status: 201 },
        );
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useCreateEmpresa(), { wrapper: Wrapper });

    result.current.mutate({
      nombre: '  Acme  ',
      sector: '   ',
      telefono: '   ',
      paginaWeb: 'www.pagina.com',
      facebook: '@qa_example_01',
      instagram: '@qa_example_01',
      twitter: '@qa_example_01',
      notas: '   ',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(requestBody).toEqual({
      nombre: 'Acme',
      sector: null,
      telefono: null,
      paginaWeb: 'https://www.pagina.com/',
      facebook: 'https://facebook.com/qa_example_01',
      instagram: 'https://instagram.com/qa_example_01',
      twitter: 'https://x.com/qa_example_01',
      notas: null,
    });
  });

  it('updates the unpaged list cache with the created entity before invalidation', async () => {
    const createdEmpresa: Empresa = {
      ...empresasFixture[0]!,
      id: 'cache-created',
      nombre: 'Cache Created Empresa',
    };
    server.use(
      http.post('/api/empresas/create', () =>
        HttpResponse.json(createdEmpresa, { status: 201 }),
      ),
    );

    const { Wrapper, queryClient } = setupTestWrapper();
    queryClient.setQueryDefaults(empresasKeys.list(), { gcTime: 60_000 });
    queryClient.setQueryData<Empresa[]>(empresasKeys.list(), [empresasFixture[0]!]);
    const { result } = renderHook(() => useCreateEmpresa(), { wrapper: Wrapper });

    result.current.mutate({
      nombre: createdEmpresa.nombre,
      sector: '',
      telefono: '',
      paginaWeb: '',
      facebook: '',
      instagram: '',
      twitter: '',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryData<Empresa[]>(empresasKeys.list())).toEqual([
      empresasFixture[0],
      createdEmpresa,
    ]);
  });
});

// Importar useEmpresas evita "unused import" en lint.
void useEmpresas;
