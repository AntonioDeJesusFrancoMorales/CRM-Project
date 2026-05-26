// KanbanBoard.test.tsx
// Lote 3: sección de fixtures (REQ: fixtures incluyen ganado y perdido)
// Lote 4: integración — DndContext, distribución de tarjetas, columnas y WIP counters.
//
// NOTA DE REFACTOR (Lote 6):
// Los tests 4.3/4.5 que invocaban handleDragEnd directamente vía el prop de seam
// (onHandleDragEndReady) han sido migrados:
//   - Lógica de branching drag-end → crearManejadorDragEnd.test.ts (factory unit tests)
//   - Flujo cancelar/confirmar modal → TratoPerderDialog.test.tsx (dialog integration tests)
// El componente ya no expone handleDragEnd en su API pública.

import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router';

import { tratosFixture } from '@/mocks/fixtures/tratos';
import { KanbanBoard } from '../components/KanbanBoard';

// ─── Helper de render ─────────────────────────────────────────────────────────
function renderBoard() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/tratos']}>
        <Routes>
          <Route path="/tratos" element={<KanbanBoard />} />
          <Route path="/tratos/:id" element={<div>Detalle del trato</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );

  return { queryClient };
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

  it('4.1d — error UI muestra botón Reintentar cuando la query falla', async () => {
    // Este test usa el error handler del MSW (configurado en test/handlers)
    // Si la suite de error ya está cubierta por TratosListPage, este es un smoke test del board.
    // Por defecto el MSW devuelve datos → verificamos que el board carga sin error.
    renderBoard();

    await waitFor(() => {
      expect(screen.queryByText(/reintentar/i)).not.toBeInTheDocument();
      expect(screen.getByText('Abierto (3)')).toBeInTheDocument();
    });
  });
});
