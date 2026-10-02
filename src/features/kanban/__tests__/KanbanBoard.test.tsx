// Tests de integración para KanbanBoard — Strict TDD B6.5 (RED).
// Estrategia DnD en jsdom: @dnd-kit no soporta arrastre real en jsdom.
// Testeamos la función pura handleDragEnd que se extrae del componente.
// Tests de render: columnas visibles, fichas distribuidas, no hay reordenamiento intra-columna.

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  totalValorEstimado: 0,
};

const COLUMNA_B: ColumnaTablero = {
  id: 'col-b',
  nombre: 'En negociación',
  color: '#fbbf24',
  limiteWip: null,
  nota: null,
  totalValorEstimado: 0,
};

const FICHA_1: Ficha = {
  id: 'ficha-1',
  columnaId: 'col-a',
  tipoFicha: 'TRATO',
  tratoId: 'd1111111-dddd-1111-dddd-111111111111',
  tareaId: null,
  actualizadoEn: '2026-04-10T08:00:00Z',
};

const FICHA_2: Ficha = {
  id: 'ficha-2',
  columnaId: 'col-b',
  tipoFicha: 'TRATO',
  tratoId: 'd2222222-dddd-2222-dddd-222222222222',
  tareaId: null,
  actualizadoEn: '2026-04-11T09:00:00Z',
};

// ---------------------------------------------------------------------------
// Tests de la función pura buildDragEndHandler
// ---------------------------------------------------------------------------

describe('buildDragEndHandler — lógica pura de onDragEnd', () => {
  it('(a) drag a OTRA columna llama mutate con el nuevo targetColumnaId', () => {
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
      targetColumnaId: 'col-b',
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

  it('(e) el payload usa MoverFichaVars: { id, targetColumnaId } (sin data extra)', () => {
    const mutate = vi.fn();
    const fichas = [FICHA_1];

    const handler = buildDragEndHandler({ fichas, mutate });

    handler({
      active: { id: 'ficha-1' },
      over: { id: 'col-b' },
    } as unknown as DragEndEvent);

    const llamada = mutate.mock.calls[0]![0] as Record<string, unknown>;
    expect(llamada['id']).toBe('ficha-1');
    expect(llamada['targetColumnaId']).toBe('col-b');
    // No hay 'data' ni campos de FichaEditInput — el endpoint mover-columna solo necesita targetColumnaId
    expect(llamada).not.toHaveProperty('data');
    expect(llamada).not.toHaveProperty('responsableId');
    expect(llamada).not.toHaveProperty('creadoPor');
  });
});

// ---------------------------------------------------------------------------
// Tests de render del KanbanBoard (integración con MSW)
// ---------------------------------------------------------------------------

const TABLERO_ID = 'f1111111-ffff-1111-ffff-111111111111';

function renderBoard(
  columnas: ColumnaTablero[],
  fichas: Ficha[],
  tableroId = TABLERO_ID,
  tipoFicha?: 'TRATO' | 'TAREA',
) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <KanbanBoard columnas={columnas} fichas={fichas} tableroId={tableroId} tipoFicha={tipoFicha} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('KanbanBoard — tableroId threading', () => {
  it('(f-tableroId) recibe tableroId como prop y lo pasa a cada KanbanColumn (los botones Quitar columna aparecen por columna PERSONALIZADA)', async () => {
    const user = userEvent.setup();
    // COLUMNA_A y COLUMNA_B tienen ids que no existen en el catálogo fixture (col-a, col-b)
    // → esPredeterminada devuelve false → ambas son PERSONALIZADA → ambas muestran Trash2
    renderBoard([COLUMNA_A, COLUMNA_B], [], TABLERO_ID);
    // Esperar a que el catálogo cargue (async via MSW)
    const actionButtons = screen.getAllByRole('button', { name: /acciones de la columna/i });
    for (const actionButton of actionButtons) {
      await user.click(actionButton);
      expect(await screen.findByRole('menuitem', { name: /eliminar columna/i })).toBeInTheDocument();
      await user.keyboard('{Escape}');
    }
    expect(actionButtons).toHaveLength(2);
  });
});

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
// Batch 5 — prop tipoFicha: filtro por tipo
// ---------------------------------------------------------------------------

describe('KanbanBoard — Batch 5: prop tipoFicha filtra fichas por tipo', () => {
  it("(j) con tipoFicha='TAREA' solo muestra fichas de tipo TAREA", () => {
    const fichasTarea: Ficha[] = [
      {
        id: 'ficha-tarea-1',
        columnaId: 'col-a',
        tipoFicha: 'TAREA',
        tratoId: null,
        tareaId: 'ta-abc',
        actualizadoEn: '2026-04-10T08:00:00Z',
      },
    ];

    // FICHA_1 es tipo TRATO; fichasTarea[0] es tipo TAREA
    // Con tipoFicha='TAREA', solo debe aparecer la tarea (1 card), no el TRATO
    renderBoard([COLUMNA_A, COLUMNA_B], [FICHA_1, fichasTarea[0]!], TABLERO_ID, 'TAREA');

    const cards = screen.getAllByTestId('kanban-card');
    expect(cards).toHaveLength(1);
    // El card es el de tipo TAREA (no muestra d1111111 que es el tratoId de FICHA_1)
    expect(screen.queryByText(/d1111111/)).not.toBeInTheDocument();
  });

  it("(k) el test (h) sigue verde: con tipoFicha='TRATO' (default) fichas TAREA no aparecen", () => {
    const fichaTarea: Ficha = {
      ...FICHA_1,
      id: 'ficha-tarea',
      tipoFicha: 'TAREA',
      tratoId: null,
      tareaId: 'e1234',
    };
    renderBoard([COLUMNA_A], [FICHA_1, fichaTarea], TABLERO_ID, 'TRATO');
    expect(screen.getByText(/d1111111/)).toBeInTheDocument();
    const cards = screen.getAllByTestId('kanban-card');
    expect(cards).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Test de integración HTTP: drag a otra columna → PUT fichas/edit
// ---------------------------------------------------------------------------

describe('KanbanBoard — integración HTTP (drag → PUT mover-columna)', () => {
  it('(i) drag a otra columna invoca PUT /api/fichas/mover-columna?id= con { targetColumnaId }', async () => {
    const { Wrapper } = setupTestWrapper();
    let capturedBody: unknown = null;
    let capturedUrl: string | null = null;

    server.use(
      http.put('/api/fichas/mover-columna', async ({ request }) => {
        capturedUrl = request.url;
        capturedBody = await request.json();
        return HttpResponse.json({ ...FICHA_1, columnaId: 'col-b', actualizadoEn: new Date().toISOString() });
      }),
      http.get('/api/fichas/get-all', () => HttpResponse.json([FICHA_1, FICHA_2])),
    );

    // Testeamos el handler directamente (no el drag DOM que jsdom no soporta)
    const { renderHook } = await import('@testing-library/react');
    const { useMoverFicha } = await import('../hooks/useMoverFicha');

    const { result } = renderHook(() => useMoverFicha(), { wrapper: Wrapper });

    result.current.mutate({
      id: 'ficha-1',
      targetColumnaId: 'col-b',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(capturedUrl).toContain('id=ficha-1');
    expect(capturedBody).toEqual({ targetColumnaId: 'col-b' });
  });
});
