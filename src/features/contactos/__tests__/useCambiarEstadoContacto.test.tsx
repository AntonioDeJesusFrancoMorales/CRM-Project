import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useCambiarEstadoContacto } from '../hooks/useCambiarEstadoContacto';
import { contactosKeys } from '../hooks/useContactos';
import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';

const EXISTING_ID = 'c0111111-cccc-0001-cccc-000000000001'; // PROSPECTO

describe('useCambiarEstadoContacto', () => {
  it('envía PUT /contactos/cambiar-estado?id= con body { nuevoEstado }', async () => {
    let capturedUrl = '';
    let capturedBody: Record<string, unknown> | null = null;

    server.use(
      http.put('/api/contactos/cambiar-estado', async ({ request }) => {
        capturedUrl = request.url;
        capturedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({
          id: EXISTING_ID, nombre: 'Lucía', correo: null, telefono: null,
          empresaId: 'a1111111-aaaa-1111-aaaa-111111111111',
          estadoRelacion: 'ACTIVO', cargo: null, comoNosConocio: null,
          responsableId: null, creadoPor: null,
          creadoEn: '2026-01-01T00:00:00.000Z', actualizadoEn: '2026-01-01T00:00:00.000Z',
        });
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useCambiarEstadoContacto(), { wrapper: Wrapper });

    result.current.mutate({ id: EXISTING_ID, nuevoEstado: 'ACTIVO' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(capturedUrl).toContain(`id=${EXISTING_ID}`);
    expect(capturedBody).toEqual({ nuevoEstado: 'ACTIVO' });
    // El body NO debe incluir nombre ni el resto del contacto.
    expect(capturedBody).not.toHaveProperty('nombre');
  });

  it('invalida list y detail tras éxito', async () => {
    const { Wrapper, queryClient } = setupTestWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCambiarEstadoContacto(), { wrapper: Wrapper });

    result.current.mutate({ id: EXISTING_ID, nuevoEstado: 'ACTIVO' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: contactosKeys.list() });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: contactosKeys.detail(EXISTING_ID) });
  });

  it('reporta isError cuando el endpoint falla', async () => {
    server.use(
      http.put('/api/contactos/cambiar-estado', () =>
        HttpResponse.json(
          { status: 404, error: 'NOT_FOUND', message: 'Contacto no encontrado' },
          { status: 404 },
        ),
      ),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useCambiarEstadoContacto(), { wrapper: Wrapper });

    result.current.mutate({ id: 'id-inexistente', nuevoEstado: 'ACTIVO' });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error & { status?: number }).status).toBe(404);
  });
});
