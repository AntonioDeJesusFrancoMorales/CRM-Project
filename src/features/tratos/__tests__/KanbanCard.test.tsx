// KanbanCard.test.tsx — Lote 3
// Pruebas unitarias para KanbanCard (componente presentacional, arrastrable).
// Gotcha: useDraggable requiere un <DndContext> ancestro — se envuelve en uno.

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router';

import { KanbanCard } from '../components/KanbanCard';
import { tratosFixture } from '@/mocks/fixtures/tratos';

// Helper: envuelve en todo lo que KanbanCard necesita
function renderCard(tratoIdx = 0) {
  const trato = tratosFixture[tratoIdx];
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/tratos']}>
        <Routes>
          <Route
            path="/tratos"
            element={
              <DndContext>
                <KanbanCard trato={trato} />
              </DndContext>
            }
          />
          <Route path="/tratos/:id" element={<div>Detalle del trato</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('KanbanCard', () => {
  it('muestra el nombre del trato', () => {
    renderCard(0);
    // tratosFixture[0] = "Implementación CRM Innovatech"
    expect(screen.getByText('Implementación CRM Innovatech')).toBeInTheDocument();
  });

  it('el nombre es un botón <button> con type=button que navega a /tratos/:id', () => {
    renderCard(0);
    // getAllByRole porque @dnd-kit agrega role="button" al div contenedor vía attributes.
    // El elemento clickeable debe ser un <button> real (no un div), homologando TratosTable.
    const buttons = screen.getAllByRole('button', { name: /implementación crm innovatech/i });
    const btn = buttons.find((el) => el.tagName === 'BUTTON');
    expect(btn).toBeDefined();
    expect(btn).toHaveAttribute('type', 'button');
  });

  it('muestra el nombre de un trato diferente (triangulación)', () => {
    renderCard(3);
    // tratosFixture[3] = "Portal B2B Innovatech" (estado: ganado)
    expect(screen.getByText('Portal B2B Innovatech')).toBeInTheDocument();
  });
});
