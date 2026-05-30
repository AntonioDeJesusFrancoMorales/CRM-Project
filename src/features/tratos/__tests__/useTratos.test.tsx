import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { useTratos } from '../hooks/useTratos';
import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';
import type { Trato } from '@/api/types';

const TRATOS_FIXTURE: Trato[] = [
  {
    id: 'd1111111-dddd-1111-dddd-111111111111',
    contactoId: 'b1111111-bbbb-1111-bbbb-111111111111',
    responsableId: '22222222-2222-2222-2222-222222222222',
    nombre: 'Implementación CRM Innovatech',
    valorEstimado: 250000,
    probabilidad: 70,
    fechaCierreEsperada: '2026-06-30',
    tipoContrato: 'SERVICIO',
    motivoPerdida: null,
    creadoEn: '2026-04-05T10:00:00.000Z',
    actualizadoEn: '2026-05-08T15:00:00.000Z',
  },
  {
    id: 'd2222222-dddd-2222-dddd-222222222222',
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
  },
];

describe('useTratos', () => {
  it('invoca GET /api/tratos/get-all sin query params y queryKey es ["tratos"]', async () => {
    let capturedUrl: string | null = null;
    server.use(
      http.get('/api/tratos/get-all', ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(TRATOS_FIXTURE);
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useTratos(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(capturedUrl).toContain('/tratos/get-all');
    // Sin filtros: la URL no debe tener query params de filtro
    const url = new URL(capturedUrl!);
    expect(url.search).toBe('');
  });

  it('devuelve la lista de tratos con campos camelCase del modelo nuevo', async () => {
    server.use(
      http.get('/api/tratos/get-all', () => HttpResponse.json(TRATOS_FIXTURE)),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useTratos(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeDefined();
    expect(Array.isArray(result.current.data)).toBe(true);
    expect(result.current.data!.length).toBe(2);

    const primero = result.current.data![0]!;
    expect(primero).toHaveProperty('nombre');
    expect(primero).toHaveProperty('contactoId');
    expect(primero).toHaveProperty('responsableId');
    // El modelo nuevo NO tiene estado
    expect(primero).not.toHaveProperty('estado');
    expect(primero).not.toHaveProperty('prospecto_id');
    expect(primero).not.toHaveProperty('cliente_id');
  });

  it('queryKey plana ["tratos"] sin filtros embebidos', async () => {
    server.use(
      http.get('/api/tratos/get-all', () => HttpResponse.json(TRATOS_FIXTURE)),
    );

    const { Wrapper, queryClient } = setupTestWrapper();
    const { result } = renderHook(() => useTratos(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // La queryKey debe ser exactamente ['tratos']
    const queryCache = queryClient.getQueryCache().findAll();
    const tratosQuery = queryCache.find((q) => q.queryKey[0] === 'tratos');
    expect(tratosQuery).toBeDefined();
    expect(tratosQuery!.queryKey).toEqual(['tratos']);
  });
});
