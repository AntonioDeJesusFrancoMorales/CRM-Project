// useMoverFicha — Strict TDD Phase 3.3 (RED → GREEN)
// Cubre:
//   (a) PUT /fichas/mover-columna?id= con body { targetColumnaId }
//   (b) optimistic update: columnaId cambia antes de que el servidor responda
//   (c) rollback si el servidor falla: columnaId vuelve al original
//   (d) invalida ['fichas'] tras éxito

import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';
import type { Ficha } from '@/features/kanban/schemas/ficha.schema';

import { useMoverFicha } from '../hooks/useMoverFicha';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const FICHA_ID = 'h1111111-hhhh-1111-hhhh-111111111111';
const COLUMNA_ORIGEN = 'a1111111-aaaa-1111-aaaa-111111111111';
const COLUMNA_DESTINO = 'a2222222-aaaa-2222-aaaa-222222222222';

const FICHAS_INICIAL: Ficha[] = [
  {
    id: FICHA_ID,
    columnaId: COLUMNA_ORIGEN,
    tipoFicha: 'TRATO',
    tratoId: 'd1111111-dddd-1111-dddd-111111111111',
    tareaId: null,
    actualizadoEn: '2026-04-10T08:00:00Z',
  },
];

const FICHA_MOVIDA: Ficha = {
  ...FICHAS_INICIAL[0]!,
  columnaId: COLUMNA_DESTINO,
  actualizadoEn: '2026-06-01T10:00:00Z',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useMoverFicha', () => {
  it('(a) PUT /fichas/mover-columna?id= con body { targetColumnaId }', async () => {
    let capturedUrl: string | null = null;
    let capturedBody: Record<string, unknown> | null = null;

    server.use(
      http.put('/api/fichas/mover-columna', async ({ request }) => {
        capturedUrl = request.url;
        capturedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(FICHA_MOVIDA);
      }),
      http.get('/api/fichas/get-all', () => HttpResponse.json(FICHAS_INICIAL)),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useMoverFicha(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate({ id: FICHA_ID, targetColumnaId: COLUMNA_DESTINO });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verifica que se llamó al endpoint correcto con el query param ?id=
    expect(capturedUrl).toContain(`id=${FICHA_ID}`);
    // Verifica el body
    expect(capturedBody).toEqual({ targetColumnaId: COLUMNA_DESTINO });
  });

  it('(b) optimistic update: la cache de fichas refleja el nuevo columnaId ANTES de que el servidor responda', async () => {
    let resolveRequest!: () => void;
    const requestStarted = new Promise<void>((res) => { resolveRequest = res; });

    server.use(
      http.put('/api/fichas/mover-columna', async () => {
        resolveRequest();
        // Retener la respuesta para verificar el estado optimista
        await new Promise<void>((r) => setTimeout(r, 200));
        return HttpResponse.json(FICHA_MOVIDA);
      }),
      http.get('/api/fichas/get-all', () => HttpResponse.json(FICHAS_INICIAL)),
    );

    const { Wrapper, queryClient } = setupTestWrapper();

    // Pre-seed la cache con las fichas iniciales
    queryClient.setQueryData(['fichas'], FICHAS_INICIAL);

    const { result } = renderHook(() => useMoverFicha(), { wrapper: Wrapper });

    // Lanzar mutación sin await (para verificar estado optimista)
    result.current.mutate({ id: FICHA_ID, targetColumnaId: COLUMNA_DESTINO });

    // Esperar a que el request se inicie
    await requestStarted;

    // El optimistic update debe haber cambiado el columnaId en cache
    const cachedFichas = queryClient.getQueryData<Ficha[]>(['fichas']);
    const fichaOptimista = cachedFichas?.find((f) => f.id === FICHA_ID);
    expect(fichaOptimista?.columnaId).toBe(COLUMNA_DESTINO);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('(c) rollback si el servidor falla: setQueryData se llama con los datos previos', async () => {
    server.use(
      http.put('/api/fichas/mover-columna', () =>
        HttpResponse.json({ error: 'Server error' }, { status: 500 }),
      ),
      http.get('/api/fichas/get-all', () => HttpResponse.json(FICHAS_INICIAL)),
    );

    const { Wrapper, queryClient } = setupTestWrapper();

    // Pre-seed la cache con las fichas iniciales
    queryClient.setQueryData(['fichas'], FICHAS_INICIAL);

    // Spy en setQueryData para verificar que el rollback restaura los datos previos
    const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData');

    const { result } = renderHook(() => useMoverFicha(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate({ id: FICHA_ID, targetColumnaId: COLUMNA_DESTINO });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // setQueryData fue llamado al menos 2 veces:
    //   1. optimistic update (columnaId = DESTINO)
    //   2. rollback (restaura al estado previo con COLUMNA_ORIGEN)
    const rollbackCall = setQueryDataSpy.mock.calls.find((call) => {
      const data = call[1] as Ficha[] | undefined;
      return Array.isArray(data) && data.some((f) => f.id === FICHA_ID && f.columnaId === COLUMNA_ORIGEN);
    });
    expect(rollbackCall).toBeDefined();
  });

  it('(d) invalida ["fichas"] tras éxito para refrescar desde el servidor', async () => {
    server.use(
      http.put('/api/fichas/mover-columna', () => HttpResponse.json(FICHA_MOVIDA)),
      http.get('/api/fichas/get-all', () => HttpResponse.json(FICHAS_INICIAL)),
    );

    const { Wrapper, queryClient } = setupTestWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useMoverFicha(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate({ id: FICHA_ID, targetColumnaId: COLUMNA_DESTINO });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: expect.arrayContaining(['fichas']) }),
    );
  });
});
