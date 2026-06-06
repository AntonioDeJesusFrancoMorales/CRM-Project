// Tests para useCrearTratoConFicha — hook de composición que crea trato + ficha automáticamente.
// TDD: estos tests se escribieron ANTES de la implementación (ciclo RED → GREEN).
// Cubre: flujo feliz, sin tablero TRATOS, tablero sin columnas, toast correcto.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { setupTestWrapper } from '@/test/wrappers';
import { server } from '@/test/server';
import type { Trato } from '@/api/types';
import type { Tablero } from '@/features/kanban/schemas/tablero.schema';
import type { Ficha } from '@/features/kanban/schemas/ficha.schema';
import type { TratoCreateInput } from '../schemas/trato.schema';
import { MOCK_USER_ID } from '@/features/kanban/lib/mockUser';

// ---------------------------------------------------------------------------
// Fixtures de test (locales — no dependen del array mutable global)
// ---------------------------------------------------------------------------

const TRATO_CREADO: Trato = {
  id: 'trato-nuevo-uuid-3333',
  contactoId: 'c1111111-cccc-1111-cccc-111111111111',
  responsableId: MOCK_USER_ID,
  nombre: 'Test trato nuevo',
  valorEstimado: 5000,
  probabilidad: 70,
  fechaCierreEsperada: '2026-12-31T00:00:00.000Z',
  tipoContrato: 'SERVICIO',
  motivoPerdida: null,
  creadoEn: '2026-05-30T00:00:00.000Z',
  actualizadoEn: null,
};

const COLUMNA_ABIERTO_ID = 'a1111111-aaaa-1111-aaaa-111111111111';

const TABLERO_TRATOS: Tablero = {
  id: 'f1111111-ffff-1111-ffff-111111111111',
  nombre: 'Pipeline de Tratos',
  descripcion: null,
  tipoTablero: 'TRATOS',
  columnas: [
    {
      id: COLUMNA_ABIERTO_ID,
      nombre: 'Por contactar',
      color: '#94a3b8',
      limiteWip: null,
      nota: null,
      estadoTarea: null,
      estadoTrato: 'ABIERTO',
      totalValorEstimado: 0,
    },
    {
      id: 'a2222222-aaaa-2222-aaaa-222222222222',
      nombre: 'Ganado',
      color: '#22c55e',
      limiteWip: null,
      nota: null,
      estadoTarea: null,
      estadoTrato: 'GANADO',
      totalValorEstimado: 0,
    },
  ],
  creadoEn: '2026-04-01T08:00:00',
};

const TABLERO_TAREAS: Tablero = {
  id: 'e1111111-eeee-1111-eeee-111111111111',
  nombre: 'Pipeline de Tareas',
  descripcion: null,
  tipoTablero: 'TAREAS',
  columnas: [
    {
      id: 'b1111111-bbbb-1111-bbbb-111111111111',
      nombre: 'Pendiente',
      color: '#94a3b8',
      limiteWip: null,
      nota: null,
      estadoTarea: 'PENDIENTE',
      estadoTrato: null,
      totalValorEstimado: 0,
    },
  ],
  creadoEn: '2026-04-01T08:00:00',
};

const FICHA_CREADA: Ficha = {
  id: 'ficha-nueva-uuid-4444',
  columnaId: COLUMNA_ABIERTO_ID,
  tipoFicha: 'TRATO',
  tratoId: TRATO_CREADO.id,
  tareaId: null,
  actualizadoEn: '2026-05-30T00:00:00.000Z',
};

const INPUT_TRATO: TratoCreateInput = {
  contactoId: 'c1111111-cccc-1111-cccc-111111111111',
  responsableId: MOCK_USER_ID,
  nombre: 'Test trato nuevo',
  tipoContrato: 'SERVICIO',
  valorEstimado: 5000,
  probabilidad: 70,
  fechaCierreEsperada: '2026-12-31T00:00:00.000Z',
};

// ---------------------------------------------------------------------------
// Helpers MSW por test — NO dependen del fixture mutable global
// ---------------------------------------------------------------------------

function mockTratosCreate(trato: Trato = TRATO_CREADO) {
  return http.post('/api/tratos/create', () => HttpResponse.json(trato, { status: 201 }));
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

describe('useCrearTratoConFicha', () => {
  beforeEach(() => {
    // Asegura handlers por defecto que devuelven listas vacías para evitar fugas entre tests
    server.use(
      http.get('/api/tableros/get-all', () => HttpResponse.json([])),
      http.get('/api/fichas/get-all', () => HttpResponse.json([])),
      http.get('/api/tratos/get-all', () => HttpResponse.json([])),
    );
  });

  // -------------------------------------------------------------------------
  // Flujo feliz: crea trato y luego ficha con el payload correcto
  // -------------------------------------------------------------------------
  it('crea el trato y luego crea la ficha con columnaId de columnas[0] del tablero TRATOS', async () => {
    let capturedFichaBody: Record<string, unknown> | null = null;

    server.use(
      mockTratosCreate(),
      mockTablerosGetAll([TABLERO_TAREAS, TABLERO_TRATOS]),
      http.post('/api/fichas/create', async ({ request }) => {
        capturedFichaBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(FICHA_CREADA, { status: 201 });
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { useCrearTratoConFicha } = await import('../hooks/useCrearTratoConFicha');
    const { result } = renderHook(() => useCrearTratoConFicha(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.crear(INPUT_TRATO);
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));

    // El payload de la ficha debe ser correcto
    expect(capturedFichaBody).not.toBeNull();
    expect(capturedFichaBody!['columnaId']).toBe(COLUMNA_ABIERTO_ID);
    expect(capturedFichaBody!['tipoFicha']).toBe('TRATO');
    expect(capturedFichaBody!['tratoId']).toBe(TRATO_CREADO.id);
    expect(capturedFichaBody!['tareaId']).toBeNull();
  });

  it('usa la PRIMERA columna (columnas[0]) del tablero TRATOS como columnaId de la ficha', async () => {
    // Tablero con 2 columnas — debe elegir la primera (ABIERTO)
    let capturedFichaBody: Record<string, unknown> | null = null;

    server.use(
      mockTratosCreate(),
      mockTablerosGetAll([TABLERO_TRATOS]),
      http.post('/api/fichas/create', async ({ request }) => {
        capturedFichaBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(FICHA_CREADA, { status: 201 });
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { useCrearTratoConFicha } = await import('../hooks/useCrearTratoConFicha');
    const { result } = renderHook(() => useCrearTratoConFicha(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.crear(INPUT_TRATO);
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));

    // Primera columna es ABIERTO (COLUMNA_ABIERTO_ID), NO la segunda (Ganado)
    expect(capturedFichaBody!['columnaId']).toBe(COLUMNA_ABIERTO_ID);
    expect(capturedFichaBody!['columnaId']).not.toBe('a2222222-aaaa-2222-aaaa-222222222222');
  });

  // -------------------------------------------------------------------------
  // Edge case: sin tablero TRATOS → NO crea ficha, trato sigue creándose
  // -------------------------------------------------------------------------
  it('NO crea ficha si no existe tablero con tipoTablero TRATOS — y no lanza error', async () => {
    let fichaCreated = false;

    server.use(
      mockTratosCreate(),
      mockTablerosGetAll([TABLERO_TAREAS]), // solo tablero TAREAS, no hay TRATOS
      http.post('/api/fichas/create', () => {
        fichaCreated = true;
        return HttpResponse.json(FICHA_CREADA, { status: 201 });
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { useCrearTratoConFicha } = await import('../hooks/useCrearTratoConFicha');
    const { result } = renderHook(() => useCrearTratoConFicha(), { wrapper: Wrapper });

    // No debe lanzar
    await act(async () => {
      await expect(result.current.crear(INPUT_TRATO)).resolves.not.toThrow();
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));

    expect(fichaCreated).toBe(false);
    expect(result.current.error).toBeNull();
  });

  // -------------------------------------------------------------------------
  // Edge case: tablero TRATOS existe pero sin columnas → NO crea ficha
  // -------------------------------------------------------------------------
  it('NO crea ficha si el tablero TRATOS tiene columnas vacías — y no lanza error', async () => {
    let fichaCreated = false;

    const tableroSinColumnas: Tablero = {
      ...TABLERO_TRATOS,
      columnas: [],
    };

    server.use(
      mockTratosCreate(),
      mockTablerosGetAll([tableroSinColumnas]),
      http.post('/api/fichas/create', () => {
        fichaCreated = true;
        return HttpResponse.json(FICHA_CREADA, { status: 201 });
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { useCrearTratoConFicha } = await import('../hooks/useCrearTratoConFicha');
    const { result } = renderHook(() => useCrearTratoConFicha(), { wrapper: Wrapper });

    await act(async () => {
      await expect(result.current.crear(INPUT_TRATO)).resolves.not.toThrow();
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
      mockTratosCreate(),
      mockTablerosGetAll([]), // lista vacía
      http.post('/api/fichas/create', () => {
        fichaCreated = true;
        return HttpResponse.json(FICHA_CREADA, { status: 201 });
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { useCrearTratoConFicha } = await import('../hooks/useCrearTratoConFicha');
    const { result } = renderHook(() => useCrearTratoConFicha(), { wrapper: Wrapper });

    await act(async () => {
      await expect(result.current.crear(INPUT_TRATO)).resolves.not.toThrow();
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
      mockTratosCreate(),
      mockTablerosGetAll([TABLERO_TRATOS]),
      mockFichasCreate(),
    );

    const { Wrapper } = setupTestWrapper();
    const { useCrearTratoConFicha } = await import('../hooks/useCrearTratoConFicha');
    const { result } = renderHook(() => useCrearTratoConFicha(), { wrapper: Wrapper });

    expect(result.current.isPending).toBe(false);

    await act(async () => {
      await result.current.crear(INPUT_TRATO);
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));
  });

  // -------------------------------------------------------------------------
  // El payload de ficha usa tratoId del trato creado (back infiere actor del JWT)
  // -------------------------------------------------------------------------
  it('el payload de ficha usa tratoId del trato creado (no responsableId — back infiere del JWT)', async () => {
    const tratoConResponsable: Trato = {
      ...TRATO_CREADO,
      responsableId: '99999999-9999-9999-9999-999999999999',
    };
    let capturedFichaBody: Record<string, unknown> | null = null;

    server.use(
      http.post('/api/tratos/create', () => HttpResponse.json(tratoConResponsable, { status: 201 })),
      mockTablerosGetAll([TABLERO_TRATOS]),
      http.post('/api/fichas/create', async ({ request }) => {
        capturedFichaBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(FICHA_CREADA, { status: 201 });
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { useCrearTratoConFicha } = await import('../hooks/useCrearTratoConFicha');
    const { result } = renderHook(() => useCrearTratoConFicha(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.crear(INPUT_TRATO);
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));

    // El payload de ficha incluye tratoId del trato creado
    expect(capturedFichaBody!['tratoId']).toBe(tratoConResponsable.id);
    // responsableId NO se envía — el back lo infiere del JWT (ActorContext)
    expect(capturedFichaBody).not.toHaveProperty('responsableId');
  });

  // -------------------------------------------------------------------------
  // UX de toasts: al crear un trato solo se confirma el trato, NO la ficha.
  // La ficha se crea en silencio para evitar un segundo toast.
  // -------------------------------------------------------------------------
  it('muestra el toast del trato pero NO el de "Ficha creada"', async () => {
    const { toast } = await import('sonner');
    const toastSuccessSpy = vi.spyOn(toast, 'success');

    server.use(
      mockTratosCreate(),
      mockTablerosGetAll([TABLERO_TRATOS]),
      mockFichasCreate(),
    );

    const { Wrapper } = setupTestWrapper();
    const { useCrearTratoConFicha } = await import('../hooks/useCrearTratoConFicha');
    const { result } = renderHook(() => useCrearTratoConFicha(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.crear(INPUT_TRATO);
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));

    // Se confirma el trato, pero la ficha se crea en silencio
    expect(toastSuccessSpy).toHaveBeenCalledWith(`Trato "${TRATO_CREADO.nombre}" creado`);
    expect(toastSuccessSpy).not.toHaveBeenCalledWith('Ficha creada');
  });
});
