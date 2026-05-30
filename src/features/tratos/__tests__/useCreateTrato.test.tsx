import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useCreateTrato } from '../hooks/useCreateTrato';
import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';
import type { TratoCreatePayload } from '@/api/types';

describe('useCreateTrato', () => {
  it('invoca POST /api/tratos/create con TratoCreatePayload (sin asociacion, con contactoId)', async () => {
    let capturedBody: Record<string, unknown> | null = null;
    server.use(
      http.post('/api/tratos/create', async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          {
            id: 'new-trato-id',
            contactoId: capturedBody['contactoId'],
            responsableId: capturedBody['responsableId'],
            nombre: capturedBody['nombre'],
            valorEstimado: null,
            probabilidad: null,
            fechaCierreEsperada: null,
            tipoContrato: 'SERVICIO',
            motivoPerdida: null,
            creadoEn: '2026-05-24T00:00:00.000Z',
            actualizadoEn: null,
          },
          { status: 201 },
        );
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useCreateTrato(), { wrapper: Wrapper });

    const payload: TratoCreatePayload = {
      contactoId: 'c1111111-cccc-1111-cccc-111111111111',
      responsableId: '11111111-1111-1111-1111-111111111111',
      nombre: 'Demo CTO',
      valorEstimado: 50000,
      probabilidad: 70,
      fechaCierreEsperada: '2026-06-30',
      tipoContrato: 'SERVICIO',
    };

    result.current.mutate(payload);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(capturedBody).not.toBeNull();
    expect(capturedBody!['contactoId']).toBe('c1111111-cccc-1111-cccc-111111111111');
    expect(capturedBody!['responsableId']).toBe('11111111-1111-1111-1111-111111111111');
    expect(capturedBody!['nombre']).toBe('Demo CTO');
    // NO debe tener campos del modelo viejo
    expect(capturedBody).not.toHaveProperty('asociacion');
    expect(capturedBody).not.toHaveProperty('prospecto_id');
    expect(capturedBody).not.toHaveProperty('cliente_id');
    expect(capturedBody).not.toHaveProperty('estado');
  });

  it('invalida la query ["tratos"] tras mutación exitosa', async () => {
    server.use(
      http.post('/api/tratos/create', async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          {
            id: 'new',
            contactoId: body['contactoId'],
            responsableId: body['responsableId'],
            nombre: body['nombre'],
            valorEstimado: null,
            probabilidad: null,
            fechaCierreEsperada: null,
            tipoContrato: 'OTRO',
            motivoPerdida: null,
            creadoEn: '2026-05-24T00:00:00.000Z',
            actualizadoEn: null,
          },
          { status: 201 },
        );
      }),
    );

    const { Wrapper, queryClient } = setupTestWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateTrato(), { wrapper: Wrapper });

    result.current.mutate({
      contactoId: 'c1111111-cccc-1111-cccc-111111111111',
      responsableId: '11111111-1111-1111-1111-111111111111',
      nombre: 'Lead nuevo',
      valorEstimado: null,
      probabilidad: null,
      fechaCierreEsperada: null,
      tipoContrato: 'OTRO',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['tratos'] });
  });
});
