import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useEditRol } from '../hooks/useEditRol';
import { rolesKeys } from '../hooks/useRoles';
import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';

const ROL_ID = 'rol-admin-uuid-1111-111111111111';

describe('useEditRol', () => {
  it('envia PUT /api/roles/edit?id= (id como query param, no path)', async () => {
    let capturedUrl: string | null = null;

    server.use(
      http.put('/api/roles/edit', ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({
          id: ROL_ID,
          nombre: 'Administrador editado',
          descripcion: null,
          activo: true,
        });
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useEditRol(ROL_ID), { wrapper: Wrapper });

    result.current.mutate({ nombre: 'Administrador editado' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(capturedUrl).toContain(`id=${ROL_ID}`);
    expect(capturedUrl).not.toContain(`/roles/${ROL_ID}`);
  });

  it('invalida la lista y el detalle tras editar', async () => {
    const { Wrapper, queryClient } = setupTestWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useEditRol(ROL_ID), { wrapper: Wrapper });

    result.current.mutate({ nombre: 'Administrador 2' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: rolesKeys.list() });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: rolesKeys.detail(ROL_ID) });
  });
});
