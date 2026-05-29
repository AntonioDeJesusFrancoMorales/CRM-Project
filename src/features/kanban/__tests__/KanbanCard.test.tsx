// Tests de componente para KanbanCard — Strict TDD B6.3 (RED).
// Cubre: renderiza tratoId, accesibilidad draggable, data-testid.
// DnD real (arrastre de browser) no es testeable en jsdom — se testea la estructura.

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Ficha } from '@/features/kanban/schemas/ficha.schema';

import { KanbanCard } from '../components/KanbanCard';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const FICHA_BASE: Ficha = {
  id: 'h1111111-hhhh-1111-hhhh-111111111111',
  columnaId: 'a1111111-aaaa-1111-aaaa-111111111111',
  tipoFicha: 'TRATO',
  tratoId: 'd1111111-dddd-1111-dddd-111111111111',
  tareaId: null,
  responsableId: '22222222-2222-2222-2222-222222222222',
  creadoPor: '22222222-2222-2222-2222-222222222222',
  creadoEn: '2026-04-10T08:00:00Z',
  actualizadoEn: '2026-04-10T08:00:00Z',
};

const FICHA_SIN_TRATO: Ficha = {
  ...FICHA_BASE,
  id: 'h2222222-hhhh-2222-hhhh-222222222222',
  tratoId: null,
  tipoFicha: 'TAREA',
  tareaId: 'e9999999-eeee-9999-eeee-999999999999',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('KanbanCard — renderizado', () => {
  it('(a) renderiza el tratoId como texto identificable', () => {
    render(<KanbanCard ficha={FICHA_BASE} />);
    // Debe mostrar el tratoId (parcial o completo) o un texto que lo incluya
    expect(screen.getByText(/d1111111/)).toBeInTheDocument();
  });

  it('(b) tiene data-testid="kanban-card"', () => {
    render(<KanbanCard ficha={FICHA_BASE} />);
    expect(screen.getByTestId('kanban-card')).toBeInTheDocument();
  });

  it('(c) cuando tratoId es null muestra fallback "Sin trato"', () => {
    render(<KanbanCard ficha={FICHA_SIN_TRATO} />);
    expect(screen.getByText(/sin trato/i)).toBeInTheDocument();
  });
});

describe('KanbanCard — atributos de accesibilidad/DnD', () => {
  it('(d) tiene role="button" o aria-grabbed para indicar que es draggable', () => {
    render(<KanbanCard ficha={FICHA_BASE} />);
    const card = screen.getByTestId('kanban-card');
    // @dnd-kit establece role="button" en el elemento draggable
    expect(card).toBeInTheDocument();
    // Verifica que tenga algún atributo que indique interactividad de DnD
    // (role button, data-draggable, o similar — exacto depende de @dnd-kit versión)
    const hasInteractiveRole =
      card.getAttribute('role') === 'button' ||
      card.hasAttribute('aria-grabbed') ||
      card.hasAttribute('data-draggable') ||
      card.hasAttribute('draggable');
    expect(hasInteractiveRole).toBe(true);
  });
});
