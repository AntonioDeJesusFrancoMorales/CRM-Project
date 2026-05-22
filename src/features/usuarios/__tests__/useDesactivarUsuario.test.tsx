import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useDesactivarUsuario } from '../hooks/useDesactivarUsuario';
import { usuariosKeys } from '../hooks/useUsuarios';
import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';

const EXISTING_ID = '11111111-1111-1111-1111-111111111111';

describe('useDesactivarUsuario', () => {
  it('desactiva un usuario e invalida la query de lista', async () => {
    const { Wrapper, queryClient } = setupTestWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useDesactivarUsuario(), { wrapper: Wrapper });

    result.current.mutate(EXISTING_ID);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verifica que el usuario retornado tiene activo: false.
    expect(result.current.data?.activo).toBe(false);
    // Verifica que se invalidó la query key de la lista.
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: usuariosKeys.list() });
  });

  it('muestra toast de error cuando el usuario no existe (404)', async () => {
    server.use(
      http.patch('/api/v1/usuarios/:id/desactivar', () =>
        HttpResponse.json(
          { status: 404, error: 'NOT_FOUND', message: 'Usuario no encontrado' },
          { status: 404 },
        ),
      ),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useDesactivarUsuario(), { wrapper: Wrapper });

    result.current.mutate('id-inexistente');

    await waitFor(() => expect(result.current.isError).toBe(true));

    const error = result.current.error as Error & { status?: number };
    expect(error.status).toBe(404);
  });
});
