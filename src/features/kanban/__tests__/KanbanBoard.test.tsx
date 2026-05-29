// Tests de integración para KanbanBoard — Strict TDD B6.5 (RED).
// Estrategia DnD en jsdom: @dnd-kit no soporta arrastre real en jsdom.
// Testeamos la función pura handleDragEnd que se extrae del componente.
// Tests de render: columnas visibles, fichas distribuidas, no hay reordenamiento intra-columna.

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import type { DragEndEvent } from '@dnd-kit/core';

import { server } from '@/test/server';
import { setupTestWrapper } from '@/test/wrappers';
import type { ColumnaTablero } from '@/features/kanban/schemas/tablero.schema';
import type { Ficha } from '@/features/kanban/schemas/ficha.schema';

// Importar la función pura de lógica de drag para testear aislada
import { buildDragEndHandler } from '../components/KanbanBoard';
import { KanbanBoard } from '../components/KanbanBoard';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const COLUMNA_A: ColumnaTablero = {
  id: 'col-a',
  nombre: 'Por contactar',
  color: '#94a3b8',
  limiteWip: null,
  nota: null,
  estadoTarea: null,
  estadoTrato: 'ABIERTO',
  totalValorEstimado: 0,
};

const COLUMNA_B: ColumnaTablero = {
  id: 'col-b',
  nombre: 'En negociación',
  color: '#fbbf24',
  limiteWip: null,
  nota: null,
  estadoTarea: null,
  estadoTrato: 'ABIERTO',
  totalValorEstimado: 0,
};

const FICHA_1: Ficha = {
  id: 'ficha-1',
  columnaId: 'col-a',
  tipoFicha: 'TRATO',
  tratoId: 'd1111111-dddd-1111-dddd-111111111111',
  tareaId: null,
  responsableId: 'usr1',
  creadoPor: 'usr1',
  creadoEn: '2026-04-10T08:00:00Z',
  actualizadoEn: '2026-04-10T08:00:00Z',
};

const FICHA_2: Ficha = {
  id: 'ficha-2',
  columnaId: 'col-b',
  tipoFicha: 'TRATO',
  tratoId: 'd2222222-dddd-2222-dddd-222222222222',
  tareaId: null,
  responsableId: 'usr1',
  creadoPor: 'usr1',
  creadoEn: '2026-04-11T09:00:00Z',
  actualizadoEn: '2026-04-11T09:00:00Z',
};

// ---------------------------------------------------------------------------
// Tests de la función pura buildDragEndHandler
// ---------------------------------------------------------------------------

describe('buildDragEndHandler — lógica pura de onDragEnd', () => {
  it('(a) drag a OTRA columna llama mutate con el nuevo columnaId', () => {
    const mutate = vi.fn();
    const fichas = [FICHA_1, FICHA_2];

    const handler = buildDragEndHandler({ fichas, mutate });

    handler({
      active: { id: 'ficha-1' },
      over: { id: 'col-b' },
    } as unknown as DragEndEvent);

    expect(mutate).toHaveBeenCalledTimes(1);
    expect(mutate).toHaveBeenCalledWith({
      id: 'ficha-1',
      data: expect.objectContaining({ columnaId: 'col-b' }),
    });
  });

  it('(b) drag a la MISMA columna NO llama mutate (no-op)', () => {
    const mutate = vi.fn();
    const fichas = [FICHA_1, FICHA_2];

    const handler = buildDragEndHandler({ fichas, mutate });

    handler({
      active: { id: 'ficha-1' },
      over: { id: 'col-a' }, // misma columna que FICHA_1
    } as unknown as DragEndEvent);

    expect(mutate).not.toHaveBeenCalled();
  });

  it('(c) drag sin destino (over = null) NO llama mutate', () => {
    const mutate = vi.fn();
    const fichas = [FICHA_1];

    const handler = buildDragEndHandler({ fichas, mutate });

    handler({
      active: { id: 'ficha-1' },
      over: null,
    } as unknown as DragEndEvent);

    expect(mutate).not.toHaveBeenCalled();
  });

  it('(d) drag de ficha inexistente NO llama mutate', () => {
    const mutate = vi.fn();
    const fichas = [FICHA_1];

    const handler = buildDragEndHandler({ fichas, mutate });

    handler({
      active: { id: 'ficha-inexistente' },
      over: { id: 'col-b' },
    } as unknown as DragEndEvent);

    expect(mutate).not.toHaveBeenCalled();
  });

  it('(e) el payload incluye todos los campos de FichaEditInput (sin creadoPor)', () => {
    const mutate = vi.fn();
    const fichas = [FICHA_1];

    const handler = buildDragEndHandler({ fichas, mutate });

    handler({
      active: { id: 'ficha-1' },
      over: { id: 'col-b' },
    } as unknown as DragEndEvent);

    const llamada = mutate.mock.calls[0]![0] as { id: string; data: Record<string, unknown> };
    expect(llamada.id).toBe('ficha-1');
    expect(llamada.data).toHaveProperty('columnaId', 'col-b');
    expect(llamada.data).toHaveProperty('tipoFicha');
    expect(llamada.data).toHaveProperty('responsableId');
    // creadoPor NO debe estar en FichaEditInput
    expect(llamada.data).not.toHaveProperty('creadoPor');
  });
});

// ---------------------------------------------------------------------------
// Tests de render del KanbanBoard (integración con MSW)
// ---------------------------------------------------------------------------

function renderBoard(columnas: ColumnaTablero[], fichas: Ficha[]) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <KanbanBoard columnas={columnas} fichas={fichas} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('KanbanBoard — render', () => {
  it('(f) renderiza una columna por cada elemento del array', () => {
    renderBoard([COLUMNA_A, COLUMNA_B], []);
    expect(screen.getByText('Por contactar')).toBeInTheDocument();
    expect(screen.getByText('En negociación')).toBeInTheDocument();
  });

  it('(g) ficha aparece en su columna correcta', () => {
    renderBoard([COLUMNA_A, COLUMNA_B], [FICHA_1, FICHA_2]);
    // FICHA_1 está en col-a (Por contactar), FICHA_2 en col-b (En negociación)
    // Las fichas muestran su tratoId
    expect(screen.getByText(/d1111111/)).toBeInTheDocument();
    expect(screen.getByText(/d2222222/)).toBeInTheDocument();
  });

  it('(h) fichas con tipoFicha TAREA no aparecen en el tablero', () => {
    const fichaTarea: Ficha = {
      ...FICHA_1,
      id: 'ficha-tarea',
      tipoFicha: 'TAREA',
      tratoId: null,
      tareaId: 'e1234',
    };
    renderBoard([COLUMNA_A], [FICHA_1, fichaTarea]);
    // d1111111 aparece (TRATO), la tarea no debería aparecer
    expect(screen.getByText(/d1111111/)).toBeInTheDocument();
    // Solo hay 1 kanban-card (el TRATO), el de TAREA no se renderiza
    const cards = screen.getAllByTestId('kanban-card');
    expect(cards).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Test de integración HTTP: drag a otra columna → PUT fichas/edit
// ---------------------------------------------------------------------------

describe('KanbanBoard — integración HTTP (drag → PUT)', () => {
  it('(i) drag a otra columna invoca PUT /api/fichas/edit?id= con nuevo columnaId', async () => {
    const { Wrapper } = setupTestWrapper();
    let capturedBody: unknown = null;

    server.use(
      http.put('/api/fichas/edit', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ ...FICHA_1, columnaId: 'col-b' });
      }),
      http.get('/api/fichas/get-all', () => HttpResponse.json([FICHA_1, FICHA_2])),
    );

    // Testeamos el handler directamente (no el drag DOM que jsdom no soporta)
    // Importamos y usamos renderHook para obtener la mutación y simularla
    const { renderHook } = await import('@testing-library/react');
    const { useUpdateFicha } = await import('../hooks/useUpdateFicha');

    const { result } = renderHook(() => useUpdateFicha(), { wrapper: Wrapper });

    result.current.mutate({
      id: 'ficha-1',
      data: {
        columnaId: 'col-b',
        tipoFicha: 'TRATO',
        tratoId: 'd1111111-dddd-1111-dddd-111111111111',
        tareaId: null,
        responsableId: 'usr1',
      },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(capturedBody).toEqual(
      expect.objectContaining({ columnaId: 'col-b', tipoFicha: 'TRATO' }),
    );
  });
});
