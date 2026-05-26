// KanbanBoard.test.tsx
// Lote 3: sección de fixtures (REQ: fixtures incluyen ganado y perdido)
// Lote 4: integración completa — DndContext, distribución, mutations, modal-interrupt.
//
// ESTRATEGIA JSDOM: jsdom no puede simular gestos pointer de @dnd-kit.
// KanbanBoard exporta handleDragEnd a través de un prop de seam (onHandleDragEndReady)
// para que los tests invoquen el handler directamente con un DragEndEvent sintético.
//
// GOTCHA: jsdom no define PointerEvent — usar un MouseEvent en el activatorEvent.
// GOTCHA: Los overrides de MSW aplican a partir del momento de instalación; instalar
// DESPUÉS de que la data inicial cargó para no afectar el primer GET.

import { describe, it, expect } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router';
import type { DragEndEvent } from '@dnd-kit/core';

import { tratosFixture } from '@/mocks/fixtures/tratos';
import { server } from '@/test/server';
import { KanbanBoard } from '../components/KanbanBoard';

// ─── IDs de fixture ─────────────────────────────────────────────────────────
const ID_ABIERTO_1 = 'd1111111-dddd-1111-dddd-111111111111'; // "Implementación CRM Innovatech"
const ID_GANADO    = 'd4444444-dddd-4444-dddd-444444444444'; // "Portal B2B Innovatech"
const ID_PERDIDO   = 'd5555555-dddd-5555-dddd-555555555555'; // "Automatización logística Maya"

// ─── Helper para construir DragEndEvent sintético ────────────────────────────
// GOTCHA: jsdom no define PointerEvent — usar MouseEvent como activatorEvent.
function makeDragEndEvent(activeId: string, overId: string | null): DragEndEvent {
  return {
    active: {
      id: activeId,
      data: { current: undefined },
      rect: { current: { initial: null, translated: null } },
    },
    over: overId
      ? {
          id: overId,
          rect: { width: 200, height: 400, top: 0, left: 0, bottom: 400, right: 200 },
          data: { current: undefined },
          disabled: false,
        }
      : null,
    activatorEvent: new MouseEvent('mousedown'),
    collisions: null,
    delta: { x: 0, y: 0, scaleX: 1, scaleY: 1 },
  } as unknown as DragEndEvent;
}

// ─── Helper de render ─────────────────────────────────────────────────────────
// handleDragEndRef.current se llena cuando KanbanBoard llama onHandleDragEndReady
function renderBoard() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  const handleDragEndRef: { current: ((event: DragEndEvent) => void) | undefined } = {
    current: undefined,
  };

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/tratos']}>
        <Routes>
          <Route
            path="/tratos"
            element={
              <KanbanBoard
                onHandleDragEndReady={(fn) => {
                  handleDragEndRef.current = fn;
                }}
              />
            }
          />
          <Route path="/tratos/:id" element={<div>Detalle del trato</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );

  return { queryClient, handleDragEndRef };
}

// ─── Lote 3: fixture ─────────────────────────────────────────────────────────
describe('tratosFixture', () => {
  it('incluye al menos 1 trato con estado ganado', () => {
    const ganados = tratosFixture.filter((t) => t.estado === 'ganado');
    expect(ganados.length).toBeGreaterThanOrEqual(1);
  });

  it('incluye al menos 1 trato con estado perdido', () => {
    const perdidos = tratosFixture.filter((t) => t.estado === 'perdido');
    expect(perdidos.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── Lote 4: integración KanbanBoard ─────────────────────────────────────────
describe('KanbanBoard', () => {
  // ── 4.1 Columnas + distribución ───────────────────────────────────────────

  it('4.1a — renderiza las 3 columnas con headers correctos', async () => {
    renderBoard();

    await waitFor(() => {
      expect(screen.getByText(/^Abierto \(\d+\)$/)).toBeInTheDocument();
      expect(screen.getByText(/^Ganado \(\d+\)$/)).toBeInTheDocument();
      expect(screen.getByText(/^Perdido \(\d+\)$/)).toBeInTheDocument();
    });
  });

  it('4.1b — WIP counters correctos: Abierto(3) Ganado(1) Perdido(1)', async () => {
    renderBoard();

    await waitFor(() => {
      expect(screen.getByText('Abierto (3)')).toBeInTheDocument();
      expect(screen.getByText('Ganado (1)')).toBeInTheDocument();
      expect(screen.getByText('Perdido (1)')).toBeInTheDocument();
    });
  });

  it('4.1c — tarjetas distribuidas en columna correcta', async () => {
    renderBoard();

    await waitFor(() => {
      // Portal B2B → Ganado; Automatización logística → Perdido
      expect(screen.getByText('Portal B2B Innovatech')).toBeInTheDocument();
      expect(screen.getByText('Automatización logística Maya')).toBeInTheDocument();
      // Uno de los abiertos visible
      expect(screen.getByText('Implementación CRM Innovatech')).toBeInTheDocument();
    });
  });

  // ── 4.3 modal-interrupt: drag a perdido ───────────────────────────────────

  it('4.3a — drag abierto→perdido abre TratoPerderDialog', async () => {
    const { handleDragEndRef } = renderBoard();

    // Esperar a que los datos carguen y el seam esté disponible
    await waitFor(() => expect(screen.getByText('Abierto (3)')).toBeInTheDocument());
    await waitFor(() => expect(handleDragEndRef.current).toBeDefined());

    act(() => {
      handleDragEndRef.current!(makeDragEndEvent(ID_ABIERTO_1, 'perdido'));
    });

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('4.3b — cancelar en modal no llama al endpoint y card permanece en abierto', async () => {
    const user = userEvent.setup();
    let endpointCalled = false;

    const { handleDragEndRef } = renderBoard();

    // Esperar datos iniciales antes de instalar el override
    await waitFor(() => expect(screen.getByText('Abierto (3)')).toBeInTheDocument());
    await waitFor(() => expect(handleDragEndRef.current).toBeDefined());

    // Instalar override DESPUÉS de que cargó el estado inicial
    server.use(
      http.patch(`/api/v1/tratos/${ID_ABIERTO_1}/perder`, () => {
        endpointCalled = true;
        return HttpResponse.json({ id: ID_ABIERTO_1, estado: 'perdido' });
      }),
    );

    act(() => {
      handleDragEndRef.current!(makeDragEndEvent(ID_ABIERTO_1, 'perdido'));
    });

    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

    // Cancelar
    await user.click(screen.getByRole('button', { name: /cancelar/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    expect(endpointCalled).toBe(false);
    // La tarjeta sigue en abierto (WIP counter no cambió)
    expect(screen.getByText('Abierto (3)')).toBeInTheDocument();
  });

  // ── 4.5 drag sin modal ────────────────────────────────────────────────────

  it('4.5a — drag abierto→ganado llama PATCH /ganar y tarjeta se mueve', async () => {
    let endpointCalled = false;

    const { handleDragEndRef } = renderBoard();

    // Esperar datos iniciales antes de instalar el override
    await waitFor(() => expect(screen.getByText('Abierto (3)')).toBeInTheDocument());
    await waitFor(() => expect(handleDragEndRef.current).toBeDefined());

    // Override PATCH y GET tras la mutación
    server.use(
      http.patch(`/api/v1/tratos/${ID_ABIERTO_1}/ganar`, () => {
        endpointCalled = true;
        return HttpResponse.json({
          ...tratosFixture.find((t) => t.id === ID_ABIERTO_1)!,
          estado: 'ganado' as const,
        });
      }),
      http.get('/api/v1/tratos', () => {
        return HttpResponse.json(
          tratosFixture.map((t) =>
            t.id === ID_ABIERTO_1 ? { ...t, estado: 'ganado' as const } : t,
          ),
        );
      }),
    );

    act(() => {
      handleDragEndRef.current!(makeDragEndEvent(ID_ABIERTO_1, 'ganado'));
    });

    await waitFor(() => expect(endpointCalled).toBe(true));
    // Tras invalidación + refetch con override, el WIP cambia
    await waitFor(() => {
      expect(screen.getByText('Abierto (2)')).toBeInTheDocument();
      expect(screen.getByText('Ganado (2)')).toBeInTheDocument();
    });
  });

  it('4.5b — drag perdido→ganado (terminal→terminal) no llama ningún endpoint', async () => {
    let endpointCalled = false;

    const { handleDragEndRef } = renderBoard();

    await waitFor(() => expect(screen.getByText('Perdido (1)')).toBeInTheDocument());
    await waitFor(() => expect(handleDragEndRef.current).toBeDefined());

    server.use(
      http.patch(`/api/v1/tratos/${ID_PERDIDO}/ganar`, () => {
        endpointCalled = true;
        return HttpResponse.json({});
      }),
    );

    act(() => {
      handleDragEndRef.current!(makeDragEndEvent(ID_PERDIDO, 'ganado'));
    });

    // Esperar para que cualquier efecto asíncrono se estabilice
    await new Promise((r) => setTimeout(r, 150));

    expect(endpointCalled).toBe(false);
    expect(screen.getByText('Perdido (1)')).toBeInTheDocument();
  });

  it('4.5c — drag ganado→abierto (reabrir) llama PATCH /tratos/:id con estado abierto', async () => {
    let endpointCalled = false;
    let sentBody: unknown = null;

    const { handleDragEndRef } = renderBoard();

    // Esperar datos iniciales
    await waitFor(() => expect(screen.getByText('Ganado (1)')).toBeInTheDocument());
    await waitFor(() => expect(handleDragEndRef.current).toBeDefined());

    server.use(
      http.patch(`/api/v1/tratos/${ID_GANADO}`, async ({ request }) => {
        endpointCalled = true;
        sentBody = await request.json();
        return HttpResponse.json({
          ...tratosFixture.find((t) => t.id === ID_GANADO)!,
          estado: 'abierto' as const,
          motivo_perdida: null,
        });
      }),
      http.get('/api/v1/tratos', () => {
        return HttpResponse.json(
          tratosFixture.map((t) =>
            t.id === ID_GANADO ? { ...t, estado: 'abierto' as const, motivo_perdida: null } : t,
          ),
        );
      }),
    );

    act(() => {
      handleDragEndRef.current!(makeDragEndEvent(ID_GANADO, 'abierto'));
    });

    await waitFor(() => expect(endpointCalled).toBe(true));
    expect(sentBody).toMatchObject({ estado: 'abierto', motivo_perdida: null });
    await waitFor(() => {
      expect(screen.getByText('Abierto (4)')).toBeInTheDocument();
      expect(screen.getByText('Ganado (0)')).toBeInTheDocument();
    });
  });
});
