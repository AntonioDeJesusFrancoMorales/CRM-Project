import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';

import { useDeleteRol, ROL_CON_USUARIOS_MSG } from '../hooks/useDeleteRol';
import { rolesKeys } from '../hooks/useRoles';
import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), message: vi.fn() },
}));

const ROL_ID = 'rol-admin-uuid-1111-111111111111';

describe('useDeleteRol', () => {
  it('envia DELETE /api/roles/delete?id= y limpia el detalle + invalida la lista', async () => {
    server.use(http.delete('/api/roles/delete', () => new HttpResponse(null, { status: 204 })));

    const { Wrapper, queryClient } = setupTestWrapper();
    queryClient.setQueryData(rolesKeys.detail(ROL_ID), { id: ROL_ID });
    const { result } = renderHook(() => useDeleteRol(), { wrapper: Wrapper });

    result.current.mutate(ROL_ID);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryData(rolesKeys.detail(ROL_ID))).toBeUndefined();
  });

  it('en 409 muestra el toast "rol con usuarios asignados" y queda en isError', async () => {
    server.use(
      http.delete('/api/roles/delete', () =>
        HttpResponse.json(
          { status: 409, error: 'CONFLICT', message: 'tiene usuarios' },
          { status: 409 },
        ),
      ),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useDeleteRol(), { wrapper: Wrapper });

    result.current.mutate(ROL_ID);

    await waitFor(() => expect(result.current.isError).toBe(true));

    const error = result.current.error as Error & { status?: number };
    expect(error.status).toBe(409);
    expect(toast.error).toHaveBeenCalledWith(ROL_CON_USUARIOS_MSG);
  });
});
