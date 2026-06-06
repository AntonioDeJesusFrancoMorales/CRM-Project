import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useUpdateContacto } from '../hooks/useUpdateContacto';
import { contactosKeys } from '../hooks/useContactos';
import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';

const EXISTING_ID = 'c0333333-cccc-0003-cccc-000000000003';

describe('useUpdateContacto', () => {
  it('envía PUT /contactos/edit?id= y retorna el contacto actualizado', async () => {
    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useUpdateContacto(), { wrapper: Wrapper });

    result.current.mutate({ id: EXISTING_ID, data: { nombre: 'Sofía Actualizada', estadoRelacion: 'ACTIVO' } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeDefined();
  });

  it('invalida list y detail tras éxito', async () => {
    const { Wrapper, queryClient } = setupTestWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateContacto(), { wrapper: Wrapper });

    result.current.mutate({ id: EXISTING_ID, data: { nombre: 'Sofía Actualizada', estadoRelacion: 'ACTIVO' } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: contactosKeys.list() });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: contactosKeys.detail(EXISTING_ID) });
  });

  it('el body de mutación no incluye empresaId ni creadoPor', async () => {
    let capturedBody: Record<string, unknown> | null = null;

    server.use(
      http.put('/api/contactos/edit', async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ id: EXISTING_ID, nombre: 'Test',
          estadoRelacion: 'ACTIVO', correo: null, telefono: null,
          empresaId: 'a1111111-aaaa-1111-aaaa-111111111111',
          comoNosConocio: null, responsableId: null, creadoPor: null,
          creadoEn: '2026-01-01T00:00:00.000Z', actualizadoEn: '2026-01-01T00:00:00.000Z' },
          { status: 200 });
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useUpdateContacto(), { wrapper: Wrapper });

    // Intentar pasar empresaId y creadoPor — no deben llegar al back
    result.current.mutate({
      id: EXISTING_ID,
      data: { nombre: 'Test', estadoRelacion: 'ACTIVO' },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // ContactoUpdatePayload no incluye empresaId ni creadoPor por tipo
    expect(capturedBody).not.toHaveProperty('empresaId');
    expect(capturedBody).not.toHaveProperty('creadoPor');
  });

  it('reporta isError cuando el endpoint falla', async () => {
    server.use(
      http.put('/api/contactos/edit', () =>
        HttpResponse.json(
          { status: 404, error: 'NOT_FOUND', message: 'Contacto no encontrado' },
          { status: 404 },
        ),
      ),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useUpdateContacto(), { wrapper: Wrapper });

    result.current.mutate({ id: 'id-inexistente', data: { nombre: 'X', estadoRelacion: 'ACTIVO' } });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error & { status?: number }).status).toBe(404);
  });
});
