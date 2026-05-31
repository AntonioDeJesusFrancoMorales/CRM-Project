// Tests para KanbanTabContent — lógica híbrida de selección de tablero por tipo.
// Strict TDD: este archivo se escribe antes que la implementación (RED).
// Cubre: 0 tableros → EmptyState+CTA; 1 tablero → KanbanBoardEmbebido; >1 → lista de links.
// Cada test usa server.use override para fijar el número de tableros del tipo.

import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';

import { KanbanTabContent } from '../components/KanbanTabContent';
import { server } from '@/test/server';
import {
  tableroTratosFixture,
  tableroTareasFixture,
  fichasFixture,
  columnasFixture,
} from '@/mocks/fixtures/tableros';

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function renderTabContent(tipo: 'TRATOS' | 'TAREAS', initialPath = '/') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <KanbanTabContent tipo={tipo} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// ---------------------------------------------------------------------------
// Escenario: Estado de carga
// ---------------------------------------------------------------------------

describe('KanbanTabContent — estado de carga', () => {
  it('(a) muestra indicador mientras useTableros carga', () => {
    server.use(
      http.get('/api/tableros/get-all', async () => {
        await new Promise(() => {}); // pending forever
      }),
    );

    renderTabContent('TRATOS');

    // Mientras carga, no muestra ni EmptyState ni board
    expect(screen.queryByText(/no hay tableros/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /asignar columna/i })).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Escenario: 0 tableros del tipo
// ---------------------------------------------------------------------------

describe('KanbanTabContent — 0 tableros del tipo', () => {
  it('(b) TRATOS: sin tableros muestra EmptyState con CTA a /tableros', async () => {
    // Solo hay tablero TAREAS, no TRATOS
    server.use(
      http.get('/api/tableros/get-all', () =>
        HttpResponse.json([tableroTareasFixture]),
      ),
    );

    renderTabContent('TRATOS');

    await waitFor(() => {
      expect(screen.getByText(/no hay tableros de este tipo/i)).toBeInTheDocument();
    });

    // CTA debe tener enlace a /tableros
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/tableros');
  });

  it('(c) TAREAS: sin tableros muestra EmptyState con CTA a /tableros', async () => {
    // Solo hay tablero TRATOS, no TAREAS
    server.use(
      http.get('/api/tableros/get-all', () =>
        HttpResponse.json([tableroTratosFixture]),
      ),
    );

    renderTabContent('TAREAS');

    await waitFor(() => {
      expect(screen.getByText(/no hay tableros de este tipo/i)).toBeInTheDocument();
    });

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/tableros');
  });

  it('(d) array vacío: muestra EmptyState con CTA', async () => {
    server.use(
      http.get('/api/tableros/get-all', () =>
        HttpResponse.json([]),
      ),
    );

    renderTabContent('TRATOS');

    await waitFor(() => {
      expect(screen.getByText(/no hay tableros de este tipo/i)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Escenario: 1 tablero del tipo
// ---------------------------------------------------------------------------

describe('KanbanTabContent — 1 tablero del tipo', () => {
  it('(e) TRATOS: 1 tablero → renderiza KanbanBoardEmbebido (columnas del tablero visibles)', async () => {
    server.use(
      http.get('/api/tableros/get-all', () =>
        HttpResponse.json([tableroTratosFixture]),
      ),
      // KanbanBoardEmbebido necesita get-by-id para cargar el tablero
      http.get('/api/tableros/get-by-id', () =>
        HttpResponse.json(tableroTratosFixture),
      ),
      http.get('/api/fichas/get-all', () => HttpResponse.json(fichasFixture)),
      http.get('/api/columnas/get-all', () => HttpResponse.json(columnasFixture)),
    );

    renderTabContent('TRATOS');

    // KanbanBoardEmbebido carga el tablero y muestra las columnas
    await waitFor(() => {
      expect(screen.getByText('Por contactar')).toBeInTheDocument();
    });

    // NO debe mostrar EmptyState
    expect(screen.queryByText(/no hay tableros de este tipo/i)).not.toBeInTheDocument();
  });

  it('(f) TAREAS: 1 tablero → renderiza KanbanBoardEmbebido con columnas TAREAS', async () => {
    server.use(
      http.get('/api/tableros/get-all', () =>
        HttpResponse.json([tableroTareasFixture]),
      ),
      http.get('/api/tableros/get-by-id', () =>
        HttpResponse.json(tableroTareasFixture),
      ),
      http.get('/api/fichas/get-all', () => HttpResponse.json(fichasFixture)),
      http.get('/api/columnas/get-all', () => HttpResponse.json(columnasFixture)),
    );

    renderTabContent('TAREAS');

    await waitFor(() => {
      // Las columnas del tablero TAREAS deben aparecer (al menos una)
      const pendientes = screen.getAllByText('Pendiente');
      expect(pendientes.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('(g) 1 tablero → NO muestra selector de lista (no hay múltiples tableros)', async () => {
    server.use(
      http.get('/api/tableros/get-all', () =>
        HttpResponse.json([tableroTratosFixture]),
      ),
      http.get('/api/tableros/get-by-id', () =>
        HttpResponse.json(tableroTratosFixture),
      ),
      http.get('/api/fichas/get-all', () => HttpResponse.json(fichasFixture)),
      http.get('/api/columnas/get-all', () => HttpResponse.json(columnasFixture)),
    );

    renderTabContent('TRATOS');

    await waitFor(() => {
      expect(screen.getByText('Por contactar')).toBeInTheDocument();
    });

    // No debe haber links con href a /tableros/:id (selector de lista)
    const links = screen.queryAllByRole('link');
    const tableroLinks = links.filter(
      (l) => l.getAttribute('href')?.startsWith('/tableros/'),
    );
    expect(tableroLinks).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Escenario: >1 tablero del tipo
// ---------------------------------------------------------------------------

describe('KanbanTabContent — más de 1 tablero del tipo', () => {
  const tableroTratos2 = {
    ...tableroTratosFixture,
    id: 'f2222222-ffff-2222-ffff-222222222222',
    nombre: 'Pipeline de Tratos 2',
  };

  it('(h) TRATOS: 2 tableros → muestra lista con links a /tableros/:id', async () => {
    server.use(
      http.get('/api/tableros/get-all', () =>
        HttpResponse.json([tableroTratosFixture, tableroTratos2]),
      ),
    );

    renderTabContent('TRATOS');

    await waitFor(() => {
      expect(screen.getByText('Pipeline de Tratos')).toBeInTheDocument();
    });

    expect(screen.getByText('Pipeline de Tratos 2')).toBeInTheDocument();

    // Los links deben apuntar a /tableros/:id
    const links = screen.getAllByRole('link');
    const tableroLinks = links.filter(
      (l) => l.getAttribute('href')?.startsWith('/tableros/'),
    );
    expect(tableroLinks).toHaveLength(2);
    expect(tableroLinks[0]).toHaveAttribute('href', `/tableros/${tableroTratosFixture.id}`);
    expect(tableroLinks[1]).toHaveAttribute('href', `/tableros/${tableroTratos2.id}`);
  });

  it('(i) TRATOS: 2 tableros → NO renderiza KanbanBoardEmbebido directamente', async () => {
    server.use(
      http.get('/api/tableros/get-all', () =>
        HttpResponse.json([tableroTratosFixture, tableroTratos2]),
      ),
    );

    renderTabContent('TRATOS');

    await waitFor(() => {
      expect(screen.getByText('Pipeline de Tratos')).toBeInTheDocument();
    });

    // El board inline no debe estar activo — no hay columnas del tablero renderizadas
    expect(screen.queryByText('Por contactar')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /asignar columna/i })).not.toBeInTheDocument();
  });

  it('(j) TRATOS: 2 tableros → EmptyState NO se muestra (hay tableros)', async () => {
    server.use(
      http.get('/api/tableros/get-all', () =>
        HttpResponse.json([tableroTratosFixture, tableroTratos2]),
      ),
    );

    renderTabContent('TRATOS');

    await waitFor(() => {
      expect(screen.getByText('Pipeline de Tratos')).toBeInTheDocument();
    });

    expect(screen.queryByText(/no hay tableros de este tipo/i)).not.toBeInTheDocument();
  });
});
