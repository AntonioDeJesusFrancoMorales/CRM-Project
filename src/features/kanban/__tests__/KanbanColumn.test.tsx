// Tests de componente para KanbanColumn — Strict TDD B6.1 (RED).
// Cubre: nombre/color/badge estadoTrato, limiteWip visual, indicador WIP superado.
// DnD (useDroppable) no se testea con jsdom — se testea la lógica del handler en KanbanBoard.

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ColumnaTablero } from '@/features/kanban/schemas/tablero.schema';
import type { Ficha } from '@/features/kanban/schemas/ficha.schema';

import { KanbanColumn } from '../components/KanbanColumn';

// ---------------------------------------------------------------------------
// Fixtures mínimos
// ---------------------------------------------------------------------------

const COL_BASE: ColumnaTablero = {
  id: 'a1111111-aaaa-1111-aaaa-111111111111',
  nombre: 'Por contactar',
  color: '#94a3b8',
  limiteWip: null,
  nota: null,
  estadoTarea: null,
  estadoTrato: 'ABIERTO',
  totalValorEstimado: 0,
};

const COL_CON_WIP: ColumnaTablero = {
  ...COL_BASE,
  id: 'a2222222-aaaa-2222-aaaa-222222222222',
  nombre: 'En negociación',
  color: '#fbbf24',
  limiteWip: 2,
  estadoTrato: 'ABIERTO',
};

const COL_GANADOS: ColumnaTablero = {
  ...COL_BASE,
  id: 'a3333333-aaaa-3333-aaaa-333333333333',
  nombre: 'Ganados',
  color: '#34d399',
  estadoTrato: 'GANADO',
};

const COL_PERDIDOS: ColumnaTablero = {
  ...COL_BASE,
  id: 'a4444444-aaaa-4444-aaaa-444444444444',
  nombre: 'Perdidos',
  color: '#f87171',
  estadoTrato: 'PERDIDO',
};

const COL_NOMBRE_NULL: ColumnaTablero = {
  ...COL_BASE,
  nombre: null,
  color: null,
};

function makeFixhas(columnaId: string, count: number): Ficha[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `h${i + 1}`,
    columnaId,
    tipoFicha: 'TRATO' as const,
    tratoId: `d${i + 1}`,
    tareaId: null,
    responsableId: 'usr1',
    creadoPor: 'usr1',
    creadoEn: `2026-04-${10 + i}T08:00:00Z`,
    actualizadoEn: `2026-04-${10 + i}T08:00:00Z`,
  }));
}

function renderColumn(columna: ColumnaTablero, fichas: Ficha[] = []) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <KanbanColumn columna={columna} fichas={fichas} />
    </QueryClientProvider>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('KanbanColumn — nombre y badge estadoTrato', () => {
  it('(a) renderiza el nombre de la columna', () => {
    renderColumn(COL_BASE);
    expect(screen.getByText('Por contactar')).toBeInTheDocument();
  });

  it('(b) muestra fallback "Sin nombre" cuando nombre es null', () => {
    renderColumn(COL_NOMBRE_NULL);
    expect(screen.getByText('Sin nombre')).toBeInTheDocument();
  });

  it('(c) muestra badge ABIERTO', () => {
    renderColumn(COL_BASE);
    expect(screen.getByText(/abierto/i)).toBeInTheDocument();
  });

  it('(d) muestra badge GANADO', () => {
    renderColumn(COL_GANADOS);
    // El badge tiene el texto exacto 'Ganado' (sin la 's' del nombre 'Ganados')
    const elements = screen.getAllByText(/ganado/i);
    expect(elements.length).toBeGreaterThanOrEqual(1);
    // Al menos uno de los elementos debe ser el badge (texto exacto 'Ganado')
    const badge = elements.find((el) => el.textContent === 'Ganado');
    expect(badge).toBeInTheDocument();
  });

  it('(e) muestra badge PERDIDO', () => {
    renderColumn(COL_PERDIDOS);
    // El badge tiene el texto exacto 'Perdido' (sin la 's' del nombre 'Perdidos')
    const elements = screen.getAllByText(/perdido/i);
    expect(elements.length).toBeGreaterThanOrEqual(1);
    const badge = elements.find((el) => el.textContent === 'Perdido');
    expect(badge).toBeInTheDocument();
  });

  it('(f) muestra contador de fichas', () => {
    const fichas = makeFixhas(COL_BASE.id, 3);
    renderColumn(COL_BASE, fichas);
    // El contador puede estar como texto "3" o dentro del badge
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});

describe('KanbanColumn — limiteWip', () => {
  it('(g) muestra el limite WIP cuando limiteWip no es null', () => {
    renderColumn(COL_CON_WIP, []);
    // Debe mostrar el valor 2 como parte del indicador de límite
    expect(screen.getByText(/2/)).toBeInTheDocument();
  });

  it('(h) no muestra indicador de WIP cuando limiteWip es null', () => {
    renderColumn(COL_BASE, []);
    // No debe haber texto que diga "WIP" cuando limiteWip es null
    expect(screen.queryByText(/wip/i)).not.toBeInTheDocument();
  });

  it('(i) muestra indicador de WIP superado cuando fichas.length > limiteWip', () => {
    // COL_CON_WIP.limiteWip === 2; le pasamos 3 fichas → superado
    const fichas = makeFixhas(COL_CON_WIP.id, 3);
    renderColumn(COL_CON_WIP, fichas);
    // Debe haber algún indicador visual de advertencia — buscamos el data-testid o aria
    const warnEl = screen.getByTestId('wip-exceeded');
    expect(warnEl).toBeInTheDocument();
  });

  it('(j) NO muestra indicador de WIP superado cuando fichas.length <= limiteWip', () => {
    const fichas = makeFixhas(COL_CON_WIP.id, 1);
    renderColumn(COL_CON_WIP, fichas);
    expect(screen.queryByTestId('wip-exceeded')).not.toBeInTheDocument();
  });
});

describe('KanbanColumn — fichas children', () => {
  it('(k) renderiza un KanbanCard por cada ficha (verificado por tratoId visible)', () => {
    const fichas = makeFixhas(COL_BASE.id, 2);
    renderColumn(COL_BASE, fichas);
    // KanbanCard muestra el tratoId; buscamos d1 y d2
    expect(screen.getByText(/d1/)).toBeInTheDocument();
    expect(screen.getByText(/d2/)).toBeInTheDocument();
  });

  it('(l) orden de fichas es por creadoEn ASC (la más antigua primero)', () => {
    const fichas: Ficha[] = [
      {
        id: 'h-new',
        columnaId: COL_BASE.id,
        tipoFicha: 'TRATO',
        tratoId: 'd-nuevo',
        tareaId: null,
        responsableId: 'usr1',
        creadoPor: 'usr1',
        creadoEn: '2026-05-01T08:00:00Z',
        actualizadoEn: '2026-05-01T08:00:00Z',
      },
      {
        id: 'h-old',
        columnaId: COL_BASE.id,
        tipoFicha: 'TRATO',
        tratoId: 'd-viejo',
        tareaId: null,
        responsableId: 'usr1',
        creadoPor: 'usr1',
        creadoEn: '2026-04-01T08:00:00Z',
        actualizadoEn: '2026-04-01T08:00:00Z',
      },
    ];
    renderColumn(COL_BASE, fichas);
    const cards = screen.getAllByTestId('kanban-card');
    // La tarjeta más antigua (d-viejo) debe aparecer primero
    expect(cards[0]).toHaveTextContent('d-viejo');
    expect(cards[1]).toHaveTextContent('d-nuevo');
  });
});
