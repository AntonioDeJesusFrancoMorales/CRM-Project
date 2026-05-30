import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useDeleteUsuario } from '../hooks/useDeleteUsuario';
import { usuariosKeys } from '../hooks/useUsuarios';
import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';

const EXISTING_ID = '11111111-1111-1111-1111-111111111111';

describe('useDeleteUsuario', () => {
  it('envia DELETE /api/usuarios/delete?id= (id como query param, no path)', async () => {
    let capturedUrl: string | null = null;

    server.use(
      http.delete('/api/usuarios/delete', ({ request }) => {
        capturedUrl = request.url;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useDeleteUsuario(), { wrapper: Wrapper });

    result.current.mutate(EXISTING_ID);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(capturedUrl).toContain(`id=${EXISTING_ID}`);
    expect(capturedUrl).not.toContain(`/usuarios/${EXISTING_ID}`);
  });

  it('elimina y limpia el cache del detalle + invalida la lista', async () => {
    const { Wrapper, queryClient } = setupTestWrapper();
    const { result } = renderHook(() => useDeleteUsuario(), { wrapper: Wrapper });

    // Precarga detail para verificar removeQueries.
    queryClient.setQueryData(usuariosKeys.detail(EXISTING_ID), { id: EXISTING_ID });

    result.current.mutate(EXISTING_ID);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryData(usuariosKeys.detail(EXISTING_ID))).toBeUndefined();
  });

  it('muestra toast "Usuario eliminado" en éxito', async () => {
    // Forzamos 204 para que el test no dependa del estado mutable del fixture.
    server.use(
      http.delete('/api/usuarios/delete', () => new HttpResponse(null, { status: 204 })),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useDeleteUsuario(), { wrapper: Wrapper });

    result.current.mutate(EXISTING_ID);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('maneja 404 graciosamente cuando el usuario ya fue eliminado', async () => {
    server.use(
      http.delete('/api/usuarios/delete', () =>
        HttpResponse.json(
          { status: 404, error: 'NOT_FOUND', message: 'Usuario no encontrado' },
          { status: 404 },
        ),
      ),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useDeleteUsuario(), { wrapper: Wrapper });

    result.current.mutate('id-inexistente');

    await waitFor(() => expect(result.current.isError).toBe(true));

    const error = result.current.error as Error & { status?: number };
    expect(error.status).toBe(404);
  });
});
