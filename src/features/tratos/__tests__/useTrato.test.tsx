import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useTrato } from '../hooks/useTrato';
import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';
import type { Trato } from '@/api/types';

const TRATO_ID = 'd2222222-dddd-2222-dddd-222222222222';

const TRATO_FIXTURE: Trato = {
  id: TRATO_ID,
  contactoId: 'c1111111-cccc-1111-cccc-111111111111',
  responsableId: '22222222-2222-2222-2222-222222222222',
  nombre: 'Renovación licencia anual Innovatech',
  valorEstimado: 180000,
  probabilidad: 90,
  fechaCierreEsperada: '2026-09-15',
  tipoContrato: 'LICENCIA',
  motivoPerdida: null,
  creadoEn: '2026-04-25T11:00:00.000Z',
  actualizadoEn: '2026-05-05T09:30:00.000Z',
};

describe('useTrato', () => {
  it('invoca GET /api/tratos/get-by-id?id= con el id correcto', async () => {
    let capturedUrl: string | null = null;
    server.use(
      http.get('/api/tratos/get-by-id', ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(TRATO_FIXTURE);
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useTrato(TRATO_ID), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(capturedUrl).toContain(`/tratos/get-by-id?id=${TRATO_ID}`);
  });

  it('devuelve el trato con campos camelCase del modelo nuevo', async () => {
    server.use(
      http.get('/api/tratos/get-by-id', () => HttpResponse.json(TRATO_FIXTURE)),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useTrato(TRATO_ID), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.id).toBe(TRATO_ID);
    expect(result.current.data?.nombre).toBeDefined();
    expect(result.current.data?.contactoId).toBeDefined();
    expect(result.current.data?.responsableId).toBeDefined();
    expect(result.current.data).not.toHaveProperty('estado');
    expect(result.current.data).not.toHaveProperty('prospecto_id');
  });

  it('reporta error 404 cuando el trato no existe', async () => {
    server.use(
      http.get('/api/tratos/get-by-id', () =>
        HttpResponse.json(
          { status: 404, error: 'NOT_FOUND', message: 'Trato no encontrado' },
          { status: 404 },
        ),
      ),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(
      () => useTrato('ffffffff-ffff-ffff-ffff-ffffffffffff'),
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));

    const error = result.current.error as Error & { status?: number };
    expect(error.status).toBe(404);
  });

  it('no hace fetch cuando id es undefined', async () => {
    let called = false;
    server.use(
      http.get('/api/tratos/get-by-id', () => {
        called = true;
        return HttpResponse.json(TRATO_FIXTURE);
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useTrato(undefined), { wrapper: Wrapper });

    // Esperar un tick para verificar que no se llama
    await new Promise((r) => setTimeout(r, 100));

    expect(result.current.isSuccess).toBe(false);
    expect(called).toBe(false);
  });
});
