import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useCreateUsuario } from '../hooks/useCreateUsuario';
import { usuariosKeys } from '../hooks/useUsuarios';
import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';

describe('useCreateUsuario', () => {
  it('crea un usuario e invalida la query de lista', async () => {
    const { Wrapper, queryClient } = setupTestWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useCreateUsuario(), { wrapper: Wrapper });

    result.current.mutate({
      nombre: 'Carlos Pérez',
      correo: 'carlos@crm.test',
      rol_sistema: 'usuario',
      rol_empresa: 'Analista',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.nombre).toBe('Carlos Pérez');
    // Verifica que se invalidó la query key correcta de la lista.
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: usuariosKeys.list() });
  });

  it('propaga errores de validación 422 con details', async () => {
    server.use(
      http.post('/api/v1/usuarios', () =>
        HttpResponse.json(
          {
            status: 422,
            error: 'VALIDATION_ERROR',
            message: 'Datos inválidos',
            details: [{ field: 'correo', message: 'El correo ya existe' }],
          },
          { status: 422 },
        ),
      ),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useCreateUsuario(), { wrapper: Wrapper });

    result.current.mutate({
      nombre: 'Duplicado',
      correo: 'admin@crm.test',
      rol_sistema: 'usuario',
      rol_empresa: '',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const error = result.current.error as Error & {
      status?: number;
      details?: Array<{ field: string; message: string }>;
    };
    expect(error.status).toBe(422);
    expect(error.details?.[0]?.field).toBe('correo');
  });
});
