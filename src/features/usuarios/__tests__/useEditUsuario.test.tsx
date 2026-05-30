import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useEditUsuario } from '../hooks/useEditUsuario';
import { usuariosKeys } from '../hooks/useUsuarios';
import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';

const USUARIO_ID = '11111111-1111-1111-1111-111111111111';

describe('useEditUsuario', () => {
  it('envia PUT /api/usuarios/edit?id= con id como query param (no path)', async () => {
    let capturedUrl: string | null = null;
    let capturedMethod: string | null = null;

    server.use(
      http.put('/api/usuarios/edit', async ({ request }) => {
        capturedUrl = request.url;
        capturedMethod = request.method;
        return HttpResponse.json({
          id: USUARIO_ID,
          nombre: 'Carlos Lopez',
          correo: 'admin@crm.test',
          rolId: 'rol-admin-uuid-1111-111111111111',
          creadoEn: '2026-01-15T10:00:00Z',
          activo: true,
          keycloakId: null,
        });
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useEditUsuario(USUARIO_ID), { wrapper: Wrapper });

    result.current.mutate({ nombre: 'Carlos Lopez', correo: 'admin@crm.test', rolId: 'rol-admin-uuid-1111-111111111111' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(capturedMethod).toBe('PUT');
    expect(capturedUrl).toContain(`id=${USUARIO_ID}`);
    expect(capturedUrl).not.toContain(`/usuarios/${USUARIO_ID}`);
  });

  it('el body NO incluye activo ni initialPassword', async () => {
    let capturedBody: Record<string, unknown> | null = null;

    server.use(
      http.put('/api/usuarios/edit', async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({
          id: USUARIO_ID,
          nombre: 'Test',
          correo: 'admin@crm.test',
          rolId: 'rol-admin-uuid-1111-111111111111',
          creadoEn: '2026-01-15T10:00:00Z',
          activo: true,
          keycloakId: null,
        });
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useEditUsuario(USUARIO_ID), { wrapper: Wrapper });

    result.current.mutate({ nombre: 'Test', correo: 'admin@crm.test', rolId: 'rol-admin-uuid-1111-111111111111' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(capturedBody).not.toBeNull();
    expect('activo' in capturedBody!).toBe(false);
    expect('initialPassword' in capturedBody!).toBe(false);
  });

  it('invalida queryKey ["usuarios"] y remueve el detalle tras éxito', async () => {
    const { Wrapper, queryClient } = setupTestWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    queryClient.setQueryData(usuariosKeys.detail(USUARIO_ID), { id: USUARIO_ID });

    const { result } = renderHook(() => useEditUsuario(USUARIO_ID), { wrapper: Wrapper });

    result.current.mutate({ nombre: 'Updated', correo: 'admin@crm.test', rolId: 'rol-admin-uuid-1111-111111111111' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: usuariosKeys.list() });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: usuariosKeys.detail(USUARIO_ID) });
  });

  it('propaga error 422 con details', async () => {
    server.use(
      http.put('/api/usuarios/edit', () =>
        HttpResponse.json(
          {
            status: 422,
            error: 'VALIDATION_ERROR',
            message: 'Datos inválidos',
            details: [{ field: 'correo', message: 'ya existe' }],
          },
          { status: 422 },
        ),
      ),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useEditUsuario(USUARIO_ID), { wrapper: Wrapper });

    result.current.mutate({ nombre: 'X', correo: 'dup@dup.com', rolId: 'rol-admin-uuid-1111-111111111111' });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const error = result.current.error as Error & {
      status?: number;
      details?: Array<{ field: string; message: string }>;
    };
    expect(error.status).toBe(422);
    expect(error.details?.[0]?.field).toBe('correo');
  });
});
