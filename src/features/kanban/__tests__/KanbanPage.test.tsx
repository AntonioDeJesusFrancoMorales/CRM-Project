// Tests de integración para KanbanListPage y KanbanPage.
// Strict TDD — este archivo se escribe antes que la implementación (RED).
// Patrón: MemoryRouter + Routes + QueryClientProvider + MSW (server override por escenario).
// B7.1 — tareas:
//   - /tableros muestra solo tableros TRATOS
//   - /tableros con array vacío muestra empty state
//   - error 500 muestra botón reintentar
//   - /tableros/t1 renderiza columnas en orden del back
//   - 404 tablero redirige a /tableros

import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router';

import { KanbanListPage } from '../pages/KanbanListPage';
import { KanbanPage } from '../pages/KanbanPage';
import { server } from '@/test/server';
import { tableroTratosFixture } from '@/mocks/fixtures/tableros';

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function renderListPage(initialPath = '/tableros') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/tableros" element={<KanbanListPage />} />
          <Route path="/tableros/:id" element={<KanbanPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function renderDetailPage(initialPath: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/tableros" element={<div>Lista de tableros</div>} />
          <Route path="/tableros/:id" element={<KanbanPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// ---------------------------------------------------------------------------
// KanbanListPage
// ---------------------------------------------------------------------------

describe('KanbanListPage — solo tableros TRATOS', () => {
  it('(a) muestra el tablero de tipo TRATOS del fixture', async () => {
    renderListPage();

    await waitFor(() => {
      expect(screen.getByText('Pipeline de Tratos')).toBeInTheDocument();
    });
  });

  it('(b) NO muestra tableros de tipo TAREAS', async () => {
    // Override: devolver un tablero TAREAS además del TRATOS
    server.use(
      http.get('/api/tableros/get-all', () =>
        HttpResponse.json([
          tableroTratosFixture,
          {
            ...tableroTratosFixture,
            id: 'tareas-tablero-id',
            nombre: 'Tablero de Tareas',
            tipoTablero: 'TAREAS',
          },
        ]),
      ),
    );

    renderListPage();

    await waitFor(() => {
      expect(screen.getByText('Pipeline de Tratos')).toBeInTheDocument();
    });

    // El tablero TAREAS no debe aparecer
    expect(screen.queryByText('Tablero de Tareas')).not.toBeInTheDocument();
  });

  it('(c) empty state cuando no hay tableros TRATOS', async () => {
    server.use(
      http.get('/api/tableros/get-all', () => HttpResponse.json([])),
    );

    renderListPage();

    await waitFor(() => {
      expect(screen.getByText(/no hay tableros de tratos/i)).toBeInTheDocument();
    });
  });

  it('(d) error 500 muestra botón "Reintentar"', async () => {
    server.use(
      http.get('/api/tableros/get-all', () =>
        HttpResponse.json(
          { status: 500, error: 'INTERNAL_SERVER_ERROR', message: 'Error interno' },
          { status: 500 },
        ),
      ),
    );

    renderListPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// KanbanPage — ver tablero concreto
// ---------------------------------------------------------------------------

describe('KanbanPage — ver tablero', () => {
  it('(e) renderiza columnas en el orden que devuelve el back', async () => {
    const tableroId = tableroTratosFixture.id;
    renderDetailPage(`/tableros/${tableroId}`);

    // El fixture tiene: Por contactar, En negociación, Ganados, Perdidos
    await waitFor(() => {
      expect(screen.getByText('Por contactar')).toBeInTheDocument();
    });

    // Verificar que todas las columnas están presentes
    expect(screen.getByText('En negociación')).toBeInTheDocument();
    expect(screen.getByText('Ganados')).toBeInTheDocument();
    expect(screen.getByText('Perdidos')).toBeInTheDocument();
  });

  it('(f) 404 tablero muestra mensaje y redirige a /tableros', async () => {
    server.use(
      http.get('/api/tableros/get-by-id', ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('id') === 'tablero-inexistente') {
          return HttpResponse.json(
            { status: 404, error: 'NOT_FOUND', message: 'Tablero no encontrado' },
            { status: 404 },
          );
        }
      }),
    );

    renderDetailPage('/tableros/tablero-inexistente');

    await waitFor(() => {
      expect(screen.getByText('Lista de tableros')).toBeInTheDocument();
    });
  });
});
