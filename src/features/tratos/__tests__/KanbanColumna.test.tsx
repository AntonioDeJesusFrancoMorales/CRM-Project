// KanbanColumna.test.tsx — Lote 3
// Pruebas unitarias para KanbanColumna (columna droppable con WIP counter y lista de tarjetas).
// Gotcha: useDroppable requiere un <DndContext> ancestro — se envuelve en uno.

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';

import { KanbanColumna } from '../components/KanbanColumna';
import { tratosFixture } from '@/mocks/fixtures/tratos';

// Columna de prueba que simula la estructura de ColumnaKanban
const columnaAbierto = {
  id: 'abierto' as const,
  label: 'Abierto',
  color: 'blue',
  esTerminal: false,
  requiereModal: false,
};

const columnaGanado = {
  id: 'ganado' as const,
  label: 'Ganado',
  color: 'green',
  esTerminal: true,
  requiereModal: false,
};

// Helper: envuelve en todo lo que KanbanColumna necesita
function renderColumna(
  columna: typeof columnaAbierto,
  tratos: typeof tratosFixture,
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <DndContext>
          <KanbanColumna columna={columna} tratos={tratos} />
        </DndContext>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('KanbanColumna', () => {
  it('muestra el título de la columna en el header', () => {
    renderColumna(columnaAbierto, []);
    expect(screen.getByText(/abierto/i)).toBeInTheDocument();
  });

  it('WIP counter muestra 0 cuando no hay tarjetas', () => {
    renderColumna(columnaAbierto, []);
    // El header debe mostrar "Abierto (0)"
    expect(screen.getByText('Abierto (0)')).toBeInTheDocument();
  });

  it('WIP counter muestra el número correcto de tarjetas', () => {
    // 3 tratos con estado 'abierto' en el fixture
    const abiertos = tratosFixture.filter((t) => t.estado === 'abierto');
    renderColumna(columnaAbierto, abiertos);
    expect(screen.getByText(`Abierto (${abiertos.length})`)).toBeInTheDocument();
  });

  it('renderiza las tarjetas pasadas (nombres visibles)', () => {
    const ganados = tratosFixture.filter((t) => t.estado === 'ganado');
    renderColumna(columnaGanado, ganados);
    // tratosFixture[3] = "Portal B2B Innovatech" (estado: ganado)
    expect(screen.getByText('Portal B2B Innovatech')).toBeInTheDocument();
  });

  it('WIP counter muestra 1 para columna Ganado con 1 trato (triangulación)', () => {
    const ganados = tratosFixture.filter((t) => t.estado === 'ganado');
    renderColumna(columnaGanado, ganados);
    expect(screen.getByText('Ganado (1)')).toBeInTheDocument();
  });
});
