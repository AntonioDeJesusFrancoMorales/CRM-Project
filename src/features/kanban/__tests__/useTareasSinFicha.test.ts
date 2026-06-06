// Tests de integración para useTareasSinFicha — hook derivado.
// Strict TDD: RED escrito ANTES de crear el archivo de producción.
// Layer: Integration (hook con React Query + MSW — misma capa que useTratosSinFicha).

import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';
import type { Ficha } from '@/features/kanban/schemas/ficha.schema';
import type { Tarea } from '@/api/types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TAREA_BASE: Tarea = {
  id: 'ta1111111-tttt-1111-tttt-111111111111',
  tratoId: 'd1111111-dddd-1111-dddd-111111111111',
  responsableId: '22222222-2222-2222-2222-222222222222',
  titulo: 'Tarea sin ficha',
  descripcion: null,
  tipo: 'GENERAL',
  prioridad: 'MEDIA',
  fechaLimite: '2026-12-31',
  fechaCompletada: null,
  creadoEn: '2026-01-01T00:00:00Z',
  actualizadoEn: '2026-01-01T00:00:00Z',
};

const TAREA_CON_FICHA: Tarea = {
  ...TAREA_BASE,
  id: 'ta2222222-tttt-2222-tttt-222222222222',
  titulo: 'Tarea con ficha activa',
};

const TAREA_SIN_FICHA: Tarea = {
  ...TAREA_BASE,
  id: 'ta3333333-tttt-3333-tttt-333333333333',
  titulo: 'Tarea disponible',
};

const FICHA_DE_TAREA: Ficha = {
  id: 'h1111111-hhhh-1111-hhhh-111111111111',
  columnaId: 'a1111111-aaaa-1111-aaaa-111111111111',
  tipoFicha: 'TAREA',
  tratoId: null,
  tareaId: 'ta2222222-tttt-2222-tttt-222222222222', // referencia a TAREA_CON_FICHA
  actualizadoEn: '2026-04-10T08:00:00Z',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useTareasSinFicha', () => {
  it('tareas con ficha TAREA activa quedan excluidas del resultado', async () => {
    // TAREA_CON_FICHA tiene ficha de tipo TAREA → debe excluirse
    // TAREA_SIN_FICHA no tiene ficha → debe incluirse
    server.use(
      http.get('/api/tareas/get-all', () => HttpResponse.json([TAREA_CON_FICHA, TAREA_SIN_FICHA])),
      http.get('/api/fichas/get-all', () => HttpResponse.json([FICHA_DE_TAREA])),
    );

    const { Wrapper } = setupTestWrapper();
    const { useTareasSinFicha } = await import('../lib/useTareasSinFicha');
    const { result } = renderHook(() => useTareasSinFicha(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const tareas = result.current.data!;
    expect(tareas).toHaveLength(1);
    expect(tareas[0]!.id).toBe('ta3333333-tttt-3333-tttt-333333333333');
    expect(tareas[0]!.titulo).toBe('Tarea disponible');
  });

  it('tareas sin ficha aparecen en el resultado', async () => {
    // Ninguna tarea tiene ficha → todas deben retornarse
    server.use(
      http.get('/api/tareas/get-all', () =>
        HttpResponse.json([TAREA_CON_FICHA, TAREA_SIN_FICHA]),
      ),
      http.get('/api/fichas/get-all', () => HttpResponse.json([])),
    );

    const { Wrapper } = setupTestWrapper();
    const { useTareasSinFicha } = await import('../lib/useTareasSinFicha');
    const { result } = renderHook(() => useTareasSinFicha(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const tareas = result.current.data!;
    expect(tareas).toHaveLength(2);
  });

  it('resultado es undefined mientras las queries cargan', async () => {
    // Con un server que no responde de inmediato, isSuccess=false y data=undefined
    server.use(
      http.get('/api/tareas/get-all', async () => {
        // Delay para simular loading
        await new Promise<void>((resolve) => setTimeout(resolve, 5000));
        return HttpResponse.json([]);
      }),
      http.get('/api/fichas/get-all', async () => {
        await new Promise<void>((resolve) => setTimeout(resolve, 5000));
        return HttpResponse.json([]);
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { useTareasSinFicha } = await import('../lib/useTareasSinFicha');
    const { result } = renderHook(() => useTareasSinFicha(), { wrapper: Wrapper });

    // Immediately after render (before any data loads), data must be undefined
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('fichas de tipo TRATO no ocultan tareas (solo filtra tipoFicha=TAREA)', async () => {
    // Una ficha de tipo TRATO con tareaId != null no debe ocultar tareas
    const FICHA_TRATO_CON_TAREA_ID: Ficha = {
      ...FICHA_DE_TAREA,
      id: 'h9999999-hhhh-9999-hhhh-999999999999',
      tipoFicha: 'TRATO', // tipo TRATO — no debe contar como ficha de tarea
      tareaId: 'ta2222222-tttt-2222-tttt-222222222222',
    };

    server.use(
      http.get('/api/tareas/get-all', () => HttpResponse.json([TAREA_CON_FICHA, TAREA_SIN_FICHA])),
      http.get('/api/fichas/get-all', () => HttpResponse.json([FICHA_TRATO_CON_TAREA_ID])),
    );

    const { Wrapper } = setupTestWrapper();
    const { useTareasSinFicha } = await import('../lib/useTareasSinFicha');
    const { result } = renderHook(() => useTareasSinFicha(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // TRATO ficha does NOT count → both tareas should appear
    const tareas = result.current.data!;
    expect(tareas).toHaveLength(2);
  });
});
