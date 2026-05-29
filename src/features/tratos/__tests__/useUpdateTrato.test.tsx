import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useUpdateTrato } from '../hooks/useUpdateTrato';
import { tratosKeys } from '../hooks/useTratos';
import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';
import type { TratoUpdatePayload } from '@/api/types';

const TRATO_ID = 'd2222222-dddd-2222-dddd-222222222222';

describe('useUpdateTrato', () => {
  it('invoca PUT /api/tratos/edit?id= (no PATCH) con TratoUpdatePayload', async () => {
    let capturedMethod: string | null = null;
    let capturedUrl: string | null = null;
    let capturedBody: Record<string, unknown> | null = null;

    server.use(
      http.put('/api/tratos/edit', async ({ request }) => {
        capturedMethod = request.method;
        capturedUrl = request.url;
        capturedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({
          id: TRATO_ID,
          contactoId: 'c1111111-cccc-1111-cccc-111111111111',
          responsableId: capturedBody['responsableId'],
          nombre: capturedBody['nombre'] ?? 'sin nombre',
          valorEstimado: null,
          probabilidad: null,
          fechaCierreEsperada: null,
          tipoContrato: 'SERVICIO',
          motivoPerdida: null,
          creadoEn: '2026-04-25T11:00:00.000Z',
          actualizadoEn: '2026-05-28T00:00:00.000Z',
        });
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useUpdateTrato(), { wrapper: Wrapper });

    const payload: TratoUpdatePayload = {
      responsableId: '11111111-1111-1111-1111-111111111111',
      nombre: 'Demo CTO v2',
      valorEstimado: 60000,
      probabilidad: 80,
      fechaCierreEsperada: '2026-07-30',
      tipoContrato: 'SERVICIO',
    };

    result.current.mutate({ id: TRATO_ID, data: payload });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(capturedMethod).toBe('PUT');
    expect(capturedUrl).toContain(`/tratos/edit?id=${TRATO_ID}`);
    expect(capturedBody!['nombre']).toBe('Demo CTO v2');
    // TratoUpdatePayload NO tiene contactoId
    expect(capturedBody).not.toHaveProperty('contactoId');
    expect(capturedBody).not.toHaveProperty('estado');
  });

  it('invalida ["tratos"] y ["tratos", id] tras mutación exitosa', async () => {
    server.use(
      http.put('/api/tratos/edit', async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({
          id: TRATO_ID,
          contactoId: 'c1111111-cccc-1111-cccc-111111111111',
          responsableId: '11111111-1111-1111-1111-111111111111',
          nombre: body['nombre'] ?? 'sin nombre',
          valorEstimado: null,
          probabilidad: null,
          fechaCierreEsperada: null,
          tipoContrato: 'LICENCIA',
          motivoPerdida: null,
          creadoEn: '2026-04-25T11:00:00.000Z',
          actualizadoEn: '2026-05-28T00:00:00.000Z',
        });
      }),
    );

    const { Wrapper, queryClient } = setupTestWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateTrato(), { wrapper: Wrapper });

    result.current.mutate({
      id: TRATO_ID,
      data: {
        responsableId: '11111111-1111-1111-1111-111111111111',
        nombre: 'Demo CTO v2',
        valorEstimado: null,
        probabilidad: null,
        fechaCierreEsperada: null,
        tipoContrato: 'LICENCIA',
      },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: tratosKeys.all });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: tratosKeys.detail(TRATO_ID) });
  });
});
