// useBackfillFichas — Strict TDD Lote 8 (RED → GREEN)
// Cubre:
//   1. Crea fichas SOLO para entidades sin ficha
//   2. NO crea para entidades que ya tienen ficha
//   3. No loopea — si se re-renderiza con las fichas ya creadas, NO dispara más POSTs
//   4. Maneja error de una creación sin romper el resto

import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/server';
import { setupTestWrapper } from '@/test/wrappers';
import type { Ficha } from '@/features/kanban/schemas/ficha.schema';
import type { Trato } from '@/api/types';

import { useBackfillFichas } from '../hooks/useBackfillFichas';

// ---------------------------------------------------------------------------
// Fixtures locales — controlados por test
// ---------------------------------------------------------------------------

// Trato con ficha existente
const TRATO_CON_FICHA: Trato = {
  id: 'd1111111-dddd-1111-dddd-111111111111',
  contactoId: 'c-001',
  responsableId: 'usr-001',
  nombre: 'Trato con ficha',
  valorEstimado: null,
  probabilidad: null,
  fechaCierreEsperada: null,
  tipoContrato: 'SERVICIO',
  motivoPerdida: null,
  creadoEn: '2026-01-01T00:00:00Z',
  actualizadoEn: null,
};

// Trato SIN ficha — debe crear ficha
const TRATO_SIN_FICHA: Trato = {
  id: 'dnew-0001-backfill-test',
  contactoId: 'c-002',
  responsableId: 'usr-002',
  nombre: 'Trato sin ficha (backfill)',
  valorEstimado: null,
  probabilidad: null,
  fechaCierreEsperada: null,
  tipoContrato: 'OTRO',
  motivoPerdida: null,
  creadoEn: '2026-05-30T00:00:00Z',
  actualizadoEn: null,
};

// Otro trato SIN ficha — para verificar backfill múltiple
const TRATO_SIN_FICHA_2: Trato = {
  id: 'dnew-0002-backfill-test',
  contactoId: 'c-003',
  responsableId: 'usr-003',
  nombre: 'Trato sin ficha 2 (backfill)',
  valorEstimado: null,
  probabilidad: null,
  fechaCierreEsperada: null,
  tipoContrato: 'OTRO',
  motivoPerdida: null,
  creadoEn: '2026-05-30T00:00:00Z',
  actualizadoEn: null,
};

// Ficha que referencia TRATO_CON_FICHA
const FICHA_TRATO_EXISTENTE: Ficha = {
  id: 'h-bf-001',
  columnaId: 'a1111111-aaaa-1111-aaaa-111111111111',
  tipoFicha: 'TRATO',
  tratoId: 'd1111111-dddd-1111-dddd-111111111111',
  tareaId: null,
  responsableId: 'usr-001',
  creadoPor: 'usr-001',
  creadoEn: '2026-04-10T08:00:00Z',
  actualizadoEn: '2026-04-10T08:00:00Z',
};

// Tablero TRATOS con una columna
const PRIMERA_COLUMNA_ID = 'a1111111-aaaa-1111-aaaa-111111111111';

const TABLERO_TRATOS = {
  id: 'f1111111-ffff-1111-ffff-111111111111',
  nombre: 'Pipeline de Tratos',
  descripcion: null,
  tipoTablero: 'TRATOS',
  creadoEn: '2026-01-01T00:00:00',
  columnas: [
    {
      id: PRIMERA_COLUMNA_ID,
      nombre: 'Por contactar',
      color: '#94a3b8',
      limiteWip: null,
      nota: null,
      estadoTarea: null,
      estadoTrato: 'ABIERTO',
      totalValorEstimado: 0,
    },
  ],
};

// ---------------------------------------------------------------------------
// Helpers MSW
// ---------------------------------------------------------------------------

function setupTratosHandlers(tratos: Trato[], fichas: Ficha[]) {
  server.use(
    http.get('/api/tratos/get-all', () => HttpResponse.json(tratos)),
    http.get('/api/fichas/get-all', () => HttpResponse.json(fichas)),
    http.get('/api/tableros/get-all', () => HttpResponse.json([TABLERO_TRATOS])),
  );
}

// ---------------------------------------------------------------------------
// Escenario 1: crea fichas SOLO para entidades sin ficha
// ---------------------------------------------------------------------------

describe('useBackfillFichas — TRATOS — crea fichas solo para entidades faltantes', () => {
  it('(a) crea ficha para el trato sin ficha y NO crea para el que ya tiene', async () => {
    const postsCalled: string[] = [];

    setupTratosHandlers(
      [TRATO_CON_FICHA, TRATO_SIN_FICHA],
      [FICHA_TRATO_EXISTENTE],
    );

    server.use(
      http.post('/api/fichas/create', async ({ request }) => {
        const body = await request.json() as { tratoId?: string };
        postsCalled.push(body.tratoId ?? 'unknown');
        const newFicha: Ficha = {
          id: `created-${body.tratoId}`,
          columnaId: PRIMERA_COLUMNA_ID,
          tipoFicha: 'TRATO',
          tratoId: body.tratoId ?? null,
          tareaId: null,
          responsableId: 'usr-001',
          creadoPor: 'usr-001',
          creadoEn: '2026-05-30T00:00:00Z',
          actualizadoEn: '2026-05-30T00:00:00Z',
        };
        return HttpResponse.json(newFicha, { status: 201 });
      }),
    );

    const { Wrapper } = setupTestWrapper();
    renderHook(() => useBackfillFichas('TRATOS', 'TRATO'), { wrapper: Wrapper });

    await waitFor(() => {
      expect(postsCalled).toContain(TRATO_SIN_FICHA.id);
    }, { timeout: 5000 });

    // El trato con ficha NO debe haber generado un POST
    expect(postsCalled).not.toContain(TRATO_CON_FICHA.id);
    // Solo 1 POST en total
    expect(postsCalled).toHaveLength(1);
  });

  it('(b) crea fichas para MÚLTIPLES tratos sin ficha', async () => {
    const postsCalled: string[] = [];

    setupTratosHandlers(
      [TRATO_CON_FICHA, TRATO_SIN_FICHA, TRATO_SIN_FICHA_2],
      [FICHA_TRATO_EXISTENTE],
    );

    server.use(
      http.post('/api/fichas/create', async ({ request }) => {
        const body = await request.json() as { tratoId?: string };
        postsCalled.push(body.tratoId ?? 'unknown');
        const newFicha: Ficha = {
          id: `created-${body.tratoId}`,
          columnaId: PRIMERA_COLUMNA_ID,
          tipoFicha: 'TRATO',
          tratoId: body.tratoId ?? null,
          tareaId: null,
          responsableId: 'usr-001',
          creadoPor: 'usr-001',
          creadoEn: '2026-05-30T00:00:00Z',
          actualizadoEn: '2026-05-30T00:00:00Z',
        };
        return HttpResponse.json(newFicha, { status: 201 });
      }),
    );

    const { Wrapper } = setupTestWrapper();
    renderHook(() => useBackfillFichas('TRATOS', 'TRATO'), { wrapper: Wrapper });

    await waitFor(() => {
      expect(postsCalled).toHaveLength(2);
    }, { timeout: 5000 });

    expect(postsCalled).toContain(TRATO_SIN_FICHA.id);
    expect(postsCalled).toContain(TRATO_SIN_FICHA_2.id);
    expect(postsCalled).not.toContain(TRATO_CON_FICHA.id);
  });
});

// ---------------------------------------------------------------------------
// Escenario 2: NO crea para entidades que ya tienen ficha
// ---------------------------------------------------------------------------

describe('useBackfillFichas — NO crea ficha cuando ya existe', () => {
  it('(c) NO dispara POST si TODOS los tratos ya tienen ficha', async () => {
    const postCalled = vi.fn();

    setupTratosHandlers(
      [TRATO_CON_FICHA],
      [FICHA_TRATO_EXISTENTE],
    );

    server.use(
      http.post('/api/fichas/create', () => {
        postCalled();
        return HttpResponse.json({}, { status: 201 });
      }),
    );

    const { Wrapper } = setupTestWrapper();
    renderHook(() => useBackfillFichas('TRATOS', 'TRATO'), { wrapper: Wrapper });

    // Esperar a que las queries estén cargadas y el efecto haya corrido
    await new Promise((r) => setTimeout(r, 300));

    expect(postCalled).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Escenario 3: Anti-loop — no re-dispara para ids ya procesados
// ---------------------------------------------------------------------------

describe('useBackfillFichas — anti-loop (no re-procesa ids ya enviados)', () => {
  it('(d) no dispara más POSTs si re-renderiza después de que las fichas fueron creadas', async () => {
    const postsCalled: string[] = [];

    // Fichas inicialmente vacías → hay un trato sin ficha
    setupTratosHandlers(
      [TRATO_SIN_FICHA],
      [], // sin fichas al inicio
    );

    let fichasActuales: Ficha[] = [];

    server.use(
      http.get('/api/fichas/get-all', () => HttpResponse.json(fichasActuales)),
      http.post('/api/fichas/create', async ({ request }) => {
        const body = await request.json() as { tratoId?: string; columnaId?: string; responsableId?: string; creadoPor?: string };
        postsCalled.push(body.tratoId ?? 'unknown');
        const newFicha: Ficha = {
          id: `created-${body.tratoId}`,
          columnaId: body.columnaId ?? PRIMERA_COLUMNA_ID,
          tipoFicha: 'TRATO',
          tratoId: body.tratoId ?? null,
          tareaId: null,
          responsableId: body.responsableId ?? 'usr-001',
          creadoPor: body.creadoPor ?? 'usr-001',
          creadoEn: '2026-05-30T00:00:00Z',
          actualizadoEn: '2026-05-30T00:00:00Z',
        };
        // Simular que la ficha ahora existe
        fichasActuales = [newFicha];
        return HttpResponse.json(newFicha, { status: 201 });
      }),
    );

    const { Wrapper, queryClient } = setupTestWrapper();
    renderHook(() => useBackfillFichas('TRATOS', 'TRATO'), { wrapper: Wrapper });

    // Esperar a que se dispare el primer POST
    await waitFor(() => {
      expect(postsCalled).toHaveLength(1);
    }, { timeout: 5000 });

    // Invalidar la query de fichas para simular re-render con fichas actualizadas
    await act(async () => {
      await queryClient.invalidateQueries({ queryKey: ['fichas'] });
    });

    // Dar tiempo para un posible segundo disparo
    await new Promise((r) => setTimeout(r, 300));

    // El POST no debe haberse disparado de nuevo
    expect(postsCalled).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Escenario 4: error en una creación no rompe el resto
// ---------------------------------------------------------------------------

describe('useBackfillFichas — error en una creación no rompe el resto', () => {
  it('(e) si el primer POST falla, el segundo igual se intenta', async () => {
    const postsCalled: string[] = [];
    let callCount = 0;

    setupTratosHandlers(
      [TRATO_SIN_FICHA, TRATO_SIN_FICHA_2],
      [], // sin fichas → ambos necesitan backfill
    );

    server.use(
      http.post('/api/fichas/create', async ({ request }) => {
        const body = await request.json() as { tratoId?: string };
        const id = body.tratoId ?? 'unknown';
        postsCalled.push(id);
        callCount++;

        // Primer POST falla, el resto son OK
        if (callCount === 1) {
          return HttpResponse.json({ error: 'Server error' }, { status: 500 });
        }

        const newFicha: Ficha = {
          id: `created-${id}`,
          columnaId: PRIMERA_COLUMNA_ID,
          tipoFicha: 'TRATO',
          tratoId: id === 'unknown' ? null : id,
          tareaId: null,
          responsableId: 'usr-001',
          creadoPor: 'usr-001',
          creadoEn: '2026-05-30T00:00:00Z',
          actualizadoEn: '2026-05-30T00:00:00Z',
        };
        return HttpResponse.json(newFicha, { status: 201 });
      }),
    );

    const { Wrapper } = setupTestWrapper();
    renderHook(() => useBackfillFichas('TRATOS', 'TRATO'), { wrapper: Wrapper });

    // Ambos deben haberse intentado (incluso si uno falló)
    await waitFor(() => {
      expect(postsCalled).toHaveLength(2);
    }, { timeout: 5000 });
  });
});
