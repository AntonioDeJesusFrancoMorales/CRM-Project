import { describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { Empresa } from '@/api/types';
import { empresasFixture } from '@/mocks/fixtures/empresas';
import { server } from '@/test/server';
import { setupTestWrapper } from '@/test/wrappers';
import { empresasKeys } from '../hooks/useEmpresas';
import { useUpdateEmpresa } from '../hooks/useUpdateEmpresa';

const EMPRESA_ID = 'a1111111-aaaa-1111-aaaa-111111111111';

describe('useUpdateEmpresa', () => {
  it('trims and normalizes values before sending an edit payload', async () => {
    let requestBody: Record<string, unknown> | undefined;
    server.use(
      http.put('/api/empresas/edit', async ({ request }) => {
        requestBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({
          ...empresasFixture[0],
          id: EMPRESA_ID,
          nombre: 'Acme Editada',
        });
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useUpdateEmpresa(EMPRESA_ID), { wrapper: Wrapper });

    result.current.mutate({
      nombre: '  Acme Editada  ',
      paginaWeb: 'http://pagina.com/contacto',
      instagram: '@qa_example_01',
      notas: '   ',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(requestBody).toEqual({
      nombre: 'Acme Editada',
      paginaWeb: 'http://pagina.com/contacto',
      instagram: 'https://instagram.com/qa_example_01',
      notas: null,
    });
  });

  it('replaces the updated entity in the unpaged list cache', async () => {
    const updatedEmpresa: Empresa = {
      ...empresasFixture[0]!,
      id: EMPRESA_ID,
      nombre: 'Empresa actualizada',
    };
    const staleEmpresa: Empresa = {
      ...empresasFixture[0]!,
      id: EMPRESA_ID,
      nombre: 'Empresa anterior',
    };
    server.use(
      http.put('/api/empresas/edit', () => HttpResponse.json(updatedEmpresa)),
    );

    const { Wrapper, queryClient } = setupTestWrapper();
    queryClient.setQueryDefaults(empresasKeys.list(), { gcTime: 60_000 });
    queryClient.setQueryData<Empresa[]>(empresasKeys.list(), [staleEmpresa]);
    const { result } = renderHook(() => useUpdateEmpresa(EMPRESA_ID), { wrapper: Wrapper });

    result.current.mutate({
      nombre: updatedEmpresa.nombre,
      estadoRelacion: updatedEmpresa.estadoRelacion,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryData<Empresa[]>(empresasKeys.list())).toEqual([updatedEmpresa]);
  });
});
