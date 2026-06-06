// Tests para useCrearTareaConFicha — hook de composición que crea tarea + ficha automáticamente.
// TDD: estos tests se escribieron ANTES de la implementación (ciclo RED → GREEN).
// Cubre: flujo feliz, sin tablero TAREAS, tablero sin columnas.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';
import type { Tarea } from '@/api/types';
import type { Tablero } from '@/features/kanban/schemas/tablero.schema';
import type { Ficha } from '@/features/kanban/schemas/ficha.schema';
import type { TareaCreateInput } from '../schemas/tarea.schema';
import { MOCK_USER_ID } from '@/features/kanban/lib/mockUser';

// ---------------------------------------------------------------------------
// Fixtures de test (locales — no dependen del array mutable global)
// ---------------------------------------------------------------------------

const TAREA_CREADA: Tarea = {
  id: 'tarea-nueva-uuid-1111',
  tratoId: 'd1111111-dddd-1111-dddd-111111111111',
  responsableId: MOCK_USER_ID,
  titulo: 'Test tarea nueva',
  descripcion: null,
  tipo: 'GENERAL',
  prioridad: 'MEDIA',
  fechaLimite: '2026-12-31T00:00:00.000Z',
  fechaCompletada: null,
  creadoEn: '2026-05-30T00:00:00.000Z',
  actualizadoEn: '2026-05-30T00:00:00.000Z',
};

const COLUMNA_PENDIENTE_ID = 'b1111111-bbbb-1111-bbbb-111111111111';

const TABLERO_TAREAS: Tablero = {
  id: 'e1111111-eeee-1111-eeee-111111111111',
  nombre: 'Pipeline de Tareas',
  descripcion: null,
  tipoTablero: 'TAREAS',
  columnas: [
    {
      id: COLUMNA_PENDIENTE_ID,
      nombre: 'Pendiente',
      color: '#94a3b8',
      limiteWip: null,
      nota: null,
      estadoTarea: 'PENDIENTE',
      estadoTrato: null,
      totalValorEstimado: 0,
    },
    {
      id: 'b2222222-bbbb-2222-bbbb-222222222222',
      nombre: 'En Curso',
      color: '#fbbf24',
      limiteWip: 3,
      nota: null,
      estadoTarea: 'EN_CURSO',
      estadoTrato: null,
      totalValorEstimado: 0,
    },
  ],
  creadoEn: '2026-04-01T08:00:00',
};

const TABLERO_TRATOS: Tablero = {
  id: 'f1111111-ffff-1111-ffff-111111111111',
  nombre: 'Pipeline de Tratos',
  descripcion: null,
  tipoTablero: 'TRATOS',
  columnas: [
    {
      id: 'a1111111-aaaa-1111-aaaa-111111111111',
      nombre: 'Por contactar',
      color: '#94a3b8',
      limiteWip: null,
      nota: null,
      estadoTarea: null,
      estadoTrato: 'ABIERTO',
      totalValorEstimado: 0,
    },
  ],
  creadoEn: '2026-04-01T08:00:00',
};

const FICHA_CREADA: Ficha = {
  id: 'ficha-nueva-uuid-2222',
  columnaId: COLUMNA_PENDIENTE_ID,
  tipoFicha: 'TAREA',
  tratoId: null,
  tareaId: TAREA_CREADA.id,
  actualizadoEn: '2026-05-30T00:00:00.000Z',
};

const INPUT_TAREA: TareaCreateInput = {
  tratoId: 'd1111111-dddd-1111-dddd-111111111111',
  responsableId: MOCK_USER_ID,
  titulo: 'Test tarea nueva',
  tipo: 'GENERAL',
  prioridad: 'MEDIA',
  descripcion: null,
  fechaLimite: '2026-12-31T00:00:00.000Z',
};

// ---------------------------------------------------------------------------
// Helpers MSW por test — NO dependen del fixture mutable global
// ---------------------------------------------------------------------------

function mockTareasCreate(tarea: Tarea = TAREA_CREADA) {
  return http.post('/api/tareas/create', () => HttpResponse.json(tarea, { status: 201 }));
}

function mockTablerosGetAll(tableros: Tablero[]) {
  return http.get('/api/tableros/get-all', () => HttpResponse.json(tableros));
}

function mockFichasCreate(ficha: Ficha = FICHA_CREADA) {
  return http.post('/api/fichas/create', () => HttpResponse.json(ficha, { status: 201 }));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useCrearTareaConFicha', () => {
  beforeEach(() => {
    // Asegura handlers por defecto que devuelven listas vacías para evitar fugas entre tests
    server.use(
      http.get('/api/tableros/get-all', () => HttpResponse.json([])),
      http.get('/api/fichas/get-all', () => HttpResponse.json([])),
      http.get('/api/tareas/get-all', () => HttpResponse.json([])),
    );
  });

  // -------------------------------------------------------------------------
  // Flujo feliz: crea tarea y luego ficha con el payload correcto
  // -------------------------------------------------------------------------
  it('crea la tarea y luego crea la ficha con columnaId de columnas[0] del tablero TAREAS', async () => {
    let capturedFichaBody: Record<string, unknown> | null = null;

    server.use(
      mockTareasCreate(),
      mockTablerosGetAll([TABLERO_TRATOS, TABLERO_TAREAS]),
      http.post('/api/fichas/create', async ({ request }) => {
        capturedFichaBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(FICHA_CREADA, { status: 201 });
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { useCrearTareaConFicha } = await import('../hooks/useCrearTareaConFicha');
    const { result } = renderHook(() => useCrearTareaConFicha(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.crear(INPUT_TAREA);
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));

    // El payload de la ficha debe ser correcto
    expect(capturedFichaBody).not.toBeNull();
    expect(capturedFichaBody!['columnaId']).toBe(COLUMNA_PENDIENTE_ID);
    expect(capturedFichaBody!['tipoFicha']).toBe('TAREA');
    expect(capturedFichaBody!['tareaId']).toBe(TAREA_CREADA.id);
    expect(capturedFichaBody!['tratoId']).toBeNull();
  });

  it('usa la PRIMERA columna (columnas[0]) del tablero TAREAS como columnaId de la ficha', async () => {
    // Tablero con 2 columnas — debe elegir la primera (PENDIENTE)
    let capturedFichaBody: Record<string, unknown> | null = null;

    server.use(
      mockTareasCreate(),
      mockTablerosGetAll([TABLERO_TAREAS]),
      http.post('/api/fichas/create', async ({ request }) => {
        capturedFichaBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(FICHA_CREADA, { status: 201 });
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { useCrearTareaConFicha } = await import('../hooks/useCrearTareaConFicha');
    const { result } = renderHook(() => useCrearTareaConFicha(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.crear(INPUT_TAREA);
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));

    // Primera columna es PENDIENTE (COLUMNA_PENDIENTE_ID), NO la segunda (En Curso)
    expect(capturedFichaBody!['columnaId']).toBe(COLUMNA_PENDIENTE_ID);
    expect(capturedFichaBody!['columnaId']).not.toBe('b2222222-bbbb-2222-bbbb-222222222222');
  });

  // -------------------------------------------------------------------------
  // Edge case: sin tablero TAREAS → NO crea ficha, tarea sigue creándose
  // -------------------------------------------------------------------------
  it('NO crea ficha si no existe tablero con tipoTablero TAREAS — y no lanza error', async () => {
    let fichaCreated = false;

    server.use(
      mockTareasCreate(),
      mockTablerosGetAll([TABLERO_TRATOS]), // solo tablero TRATOS, no hay TAREAS
      http.post('/api/fichas/create', () => {
        fichaCreated = true;
        return HttpResponse.json(FICHA_CREADA, { status: 201 });
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { useCrearTareaConFicha } = await import('../hooks/useCrearTareaConFicha');
    const { result } = renderHook(() => useCrearTareaConFicha(), { wrapper: Wrapper });

    // No debe lanzar
    await act(async () => {
      await expect(result.current.crear(INPUT_TAREA)).resolves.not.toThrow();
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(fichaCreated).toBe(false);
    expect(result.current.error).toBeNull();
  });

  // -------------------------------------------------------------------------
  // Edge case: tablero TAREAS existe pero sin columnas → NO crea ficha
  // -------------------------------------------------------------------------
  it('NO crea ficha si el tablero TAREAS tiene columnas vacías — y no lanza error', async () => {
    let fichaCreated = false;

    const tableroSinColumnas: Tablero = {
      ...TABLERO_TAREAS,
      columnas: [],
    };

    server.use(
      mockTareasCreate(),
      mockTablerosGetAll([tableroSinColumnas]),
      http.post('/api/fichas/create', () => {
        fichaCreated = true;
        return HttpResponse.json(FICHA_CREADA, { status: 201 });
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { useCrearTareaConFicha } = await import('../hooks/useCrearTareaConFicha');
    const { result } = renderHook(() => useCrearTareaConFicha(), { wrapper: Wrapper });

    await act(async () => {
      await expect(result.current.crear(INPUT_TAREA)).resolves.not.toThrow();
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(fichaCreated).toBe(false);
    expect(result.current.error).toBeNull();
  });

  // -------------------------------------------------------------------------
  // Edge case: /tableros/get-all devuelve lista vacía → NO crea ficha
  // -------------------------------------------------------------------------
  it('NO crea ficha si el servidor devuelve lista vacía de tableros', async () => {
    let fichaCreated = false;

    server.use(
      mockTareasCreate(),
      mockTablerosGetAll([]), // lista vacía
      http.post('/api/fichas/create', () => {
        fichaCreated = true;
        return HttpResponse.json(FICHA_CREADA, { status: 201 });
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { useCrearTareaConFicha } = await import('../hooks/useCrearTareaConFicha');
    const { result } = renderHook(() => useCrearTareaConFicha(), { wrapper: Wrapper });

    await act(async () => {
      await expect(result.current.crear(INPUT_TAREA)).resolves.not.toThrow();
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(fichaCreated).toBe(false);
    expect(result.current.error).toBeNull();
  });

  // -------------------------------------------------------------------------
  // Estado isPending refleja la operación en curso
  // -------------------------------------------------------------------------
  it('expone isPending=false tras completar el flujo', async () => {
    server.use(
      mockTareasCreate(),
      mockTablerosGetAll([TABLERO_TAREAS]),
      mockFichasCreate(),
    );

    const { Wrapper } = setupTestWrapper();
    const { useCrearTareaConFicha } = await import('../hooks/useCrearTareaConFicha');
    const { result } = renderHook(() => useCrearTareaConFicha(), { wrapper: Wrapper });

    expect(result.current.isPending).toBe(false);

    await act(async () => {
      await result.current.crear(INPUT_TAREA);
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));
  });

  // -------------------------------------------------------------------------
  // El payload de ficha incluye tareaId de la tarea creada (back infiere actor del JWT)
  // -------------------------------------------------------------------------
  it('el payload de ficha usa tareaId de la tarea creada (no responsableId — back infiere del JWT)', async () => {
    const tareaConResponsable: Tarea = {
      ...TAREA_CREADA,
      responsableId: '99999999-9999-9999-9999-999999999999',
    };
    let capturedFichaBody: Record<string, unknown> | null = null;

    server.use(
      http.post('/api/tareas/create', () => HttpResponse.json(tareaConResponsable, { status: 201 })),
      mockTablerosGetAll([TABLERO_TAREAS]),
      http.post('/api/fichas/create', async ({ request }) => {
        capturedFichaBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(FICHA_CREADA, { status: 201 });
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { useCrearTareaConFicha } = await import('../hooks/useCrearTareaConFicha');
    const { result } = renderHook(() => useCrearTareaConFicha(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.crear(INPUT_TAREA);
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));

    // El payload de ficha incluye tareaId de la tarea creada
    expect(capturedFichaBody!['tareaId']).toBe(tareaConResponsable.id);
    // responsableId NO se envía — el back lo infiere del JWT (ActorContext)
    expect(capturedFichaBody).not.toHaveProperty('responsableId');
  });

  // -------------------------------------------------------------------------
  // UX de toasts: al crear una tarea solo se confirma la tarea, NO la ficha.
  // La ficha se crea en silencio para evitar un segundo toast.
  // -------------------------------------------------------------------------
  it('muestra el toast de tarea pero NO el de "Ficha creada"', async () => {
    const { toast } = await import('sonner');
    const toastSuccessSpy = vi.spyOn(toast, 'success');

    server.use(
      mockTareasCreate(),
      mockTablerosGetAll([TABLERO_TAREAS]),
      mockFichasCreate(),
    );

    const { Wrapper } = setupTestWrapper();
    const { useCrearTareaConFicha } = await import('../hooks/useCrearTareaConFicha');
    const { result } = renderHook(() => useCrearTareaConFicha(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.crear(INPUT_TAREA);
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));

    // Se confirma la tarea, pero la ficha se crea en silencio
    expect(toastSuccessSpy).toHaveBeenCalledWith(`Tarea "${TAREA_CREADA.titulo}" creada`);
    expect(toastSuccessSpy).not.toHaveBeenCalledWith('Ficha creada');
  });
});
