import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useCreateUsuario } from '../hooks/useCreateUsuario';
import { usuariosKeys } from '../hooks/useUsuarios';
import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';

describe('useCreateUsuario', () => {
  it('envia POST /api/usuarios/create con rolId e initialPassword y valida la query de lista', async () => {
    const { Wrapper, queryClient } = setupTestWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useCreateUsuario(), { wrapper: Wrapper });

    result.current.mutate({
      nombre: 'Carlos Pérez',
      correo: 'carlos@crm.test',
      rolId: 'rol-admin-uuid-1111-111111111111',
      initialPassword: 'Password123!',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.nombre).toBe('Carlos Pérez');
    // La response no incluye campos de auth
    expect(result.current.data).not.toHaveProperty('rol_sistema');
    expect(result.current.data).not.toHaveProperty('rol_empresa');
    // Invalida la query key de lista
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: usuariosKeys.list() });
  });

  it('el body NO incluye rol_sistema, rol_empresa ni activo', async () => {
    let capturedBody: Record<string, unknown> | null = null;

    server.use(
      http.post('/api/usuarios/create', async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          { id: 'new-uuid', nombre: 'Test', correo: 't@t.com', rolId: 'rol-admin-uuid-1111-111111111111', creadoEn: '2026-01-01T00:00:00Z', activo: true, keycloakId: null },
          { status: 201 },
        );
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useCreateUsuario(), { wrapper: Wrapper });

    result.current.mutate({
      nombre: 'Test',
      correo: 't@t.com',
      rolId: 'rol-admin-uuid-1111-111111111111',
      initialPassword: 'Pass123!',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(capturedBody).not.toBeNull();
    expect('rol_sistema' in capturedBody!).toBe(false);
    expect('rol_empresa' in capturedBody!).toBe(false);
    expect('activo' in capturedBody!).toBe(false);
    expect(capturedBody!['rolId']).toBe('rol-admin-uuid-1111-111111111111');
    expect(capturedBody!['initialPassword']).toBe('Pass123!');
  });

  it('propaga errores de validación 422 con details', async () => {
    server.use(
      http.post('/api/usuarios/create', () =>
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
      rolId: 'rol-admin-uuid-1111-111111111111',
      initialPassword: 'Pass123!',
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
