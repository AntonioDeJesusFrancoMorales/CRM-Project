// Tests para KanbanBoardEmbebido — board autocontenido identificado por tableroId.
// Strict TDD: este archivo se escribe antes que la implementación (RED).
// Patrón: server.use override por test, MemoryRouter + QueryClientProvider.
// Cubre: render con tablero cargado, loading, error sin redirect, sin columnas, dialog.

import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';

import { KanbanBoardEmbebido } from '../components/KanbanBoardEmbebido';
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

function renderBoard(tableroId: string, initialPath = '/') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <KanbanBoardEmbebido tableroId={tableroId} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// ---------------------------------------------------------------------------
// Escenario: Render con tablero cargado y columnas
// ---------------------------------------------------------------------------

describe('KanbanBoardEmbebido — render con tablero cargado', () => {
  it('(a) renderiza las columnas del tablero TRATOS', async () => {
    server.use(
      http.get('/api/tableros/get-by-id', () =>
        HttpResponse.json(tableroTratosFixture),
      ),
      http.get('/api/fichas/get-all', () =>
        HttpResponse.json(fichasFixture),
      ),
      http.get('/api/columnas/get-all', () =>
        HttpResponse.json(columnasFixture),
      ),
    );

    renderBoard(tableroTratosFixture.id);

    await waitFor(() => {
      expect(screen.getByText('Por contactar')).toBeInTheDocument();
    });

    expect(screen.getByText('En negociación')).toBeInTheDocument();
    expect(screen.getByText('Ganados')).toBeInTheDocument();
    expect(screen.getByText('Perdidos')).toBeInTheDocument();
  });

  it('(b) renderiza las columnas del tablero TAREAS', async () => {
    server.use(
      http.get('/api/tableros/get-by-id', () =>
        HttpResponse.json(tableroTareasFixture),
      ),
      http.get('/api/fichas/get-all', () =>
        HttpResponse.json(fichasFixture),
      ),
      http.get('/api/columnas/get-all', () =>
        HttpResponse.json(columnasFixture),
      ),
    );

    renderBoard(tableroTareasFixture.id);

    // Las columnas del tablero TAREAS son cabeceras del board — al menos una debe existir
    await waitFor(() => {
      const pendientes = screen.getAllByText('Pendiente');
      expect(pendientes.length).toBeGreaterThanOrEqual(1);
    });

    // En Curso y Finalizada deben estar presentes también
    expect(screen.getAllByText('En Curso').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Finalizada').length).toBeGreaterThanOrEqual(1);
  });

  it('(c) muestra el botón "Asignar columna" cuando el tablero carga', async () => {
    server.use(
      http.get('/api/tableros/get-by-id', () =>
        HttpResponse.json(tableroTratosFixture),
      ),
      http.get('/api/fichas/get-all', () => HttpResponse.json(fichasFixture)),
      http.get('/api/columnas/get-all', () => HttpResponse.json(columnasFixture)),
    );

    renderBoard(tableroTratosFixture.id);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /asignar columna/i })).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Escenario: Estado de carga
// ---------------------------------------------------------------------------

describe('KanbanBoardEmbebido — estado de carga', () => {
  it('(d) muestra "Cargando tablero..." mientras la consulta no resolvió', () => {
    // La consulta nunca resuelve — el handler cuelga indefinidamente.
    server.use(
      http.get('/api/tableros/get-by-id', async () => {
        await new Promise(() => {}); // pending forever
      }),
    );

    renderBoard('any-id');

    // Inmediatamente (sin await) debe estar el estado de carga
    expect(screen.getByText(/cargando tablero/i)).toBeInTheDocument();
  });

  it('(e) NO renderiza KanbanBoard mientras carga', () => {
    server.use(
      http.get('/api/tableros/get-by-id', async () => {
        await new Promise(() => {});
      }),
    );

    renderBoard('any-id');

    // No debe haber columnas (del board)
    expect(screen.queryByText('Por contactar')).not.toBeInTheDocument();
    expect(screen.queryByText('En negociación')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Escenario: Error de red (no 404) — sin redirect
// ---------------------------------------------------------------------------

describe('KanbanBoardEmbebido — error de red sin redirect', () => {
  it('(f) muestra mensaje de error inline cuando la consulta falla con 500', async () => {
    server.use(
      http.get('/api/tableros/get-by-id', () =>
        HttpResponse.json(
          { status: 500, error: 'INTERNAL_SERVER_ERROR', message: 'Error interno' },
          { status: 500 },
        ),
      ),
    );

    renderBoard('tablero-con-error');

    await waitFor(() => {
      expect(screen.getByText(/no fue posible cargar el tablero/i)).toBeInTheDocument();
    });
  });

  it('(g) NO navega a ninguna ruta cuando hay error de red — el componente sigue montado', async () => {
    server.use(
      http.get('/api/tableros/get-by-id', () =>
        HttpResponse.json({ status: 500, error: 'INTERNAL', message: 'falla' }, { status: 500 }),
      ),
    );

    const { container } = renderBoard('tablero-error-2');

    await waitFor(() => {
      expect(screen.getByText(/no fue posible cargar el tablero/i)).toBeInTheDocument();
    });

    // El componente sigue montado — no fue reemplazado por una redirección
    expect(container.firstChild).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Escenario: Tablero sin columnas
// ---------------------------------------------------------------------------

describe('KanbanBoardEmbebido — tablero sin columnas', () => {
  it('(h) muestra mensaje cuando el tablero no tiene columnas', async () => {
    const tableroSinColumnas = { ...tableroTratosFixture, columnas: [] };
    server.use(
      http.get('/api/tableros/get-by-id', () =>
        HttpResponse.json(tableroSinColumnas),
      ),
      http.get('/api/fichas/get-all', () => HttpResponse.json([])),
      http.get('/api/columnas/get-all', () => HttpResponse.json(columnasFixture)),
    );

    renderBoard(tableroTratosFixture.id);

    await waitFor(() => {
      expect(
        screen.getByText(/este tablero no tiene columnas configuradas/i),
      ).toBeInTheDocument();
    });
  });

  it('(i) NO renderiza KanbanBoard cuando no hay columnas', async () => {
    const tableroSinColumnas = { ...tableroTratosFixture, columnas: [] };
    server.use(
      http.get('/api/tableros/get-by-id', () =>
        HttpResponse.json(tableroSinColumnas),
      ),
      http.get('/api/fichas/get-all', () => HttpResponse.json([])),
      http.get('/api/columnas/get-all', () => HttpResponse.json(columnasFixture)),
    );

    renderBoard(tableroTratosFixture.id);

    await waitFor(() => {
      expect(
        screen.getByText(/este tablero no tiene columnas configuradas/i),
      ).toBeInTheDocument();
    });

    // El DnD board no debe estar (no hay columnas que mostrar)
    expect(screen.queryByText('Por contactar')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Escenario: Dialog "Asignar columna"
// ---------------------------------------------------------------------------

describe('KanbanBoardEmbebido — dialog Asignar columna', () => {
  it('(j) clic en "Asignar columna" abre el dialog', async () => {
    server.use(
      http.get('/api/tableros/get-by-id', () =>
        HttpResponse.json(tableroTratosFixture),
      ),
      http.get('/api/fichas/get-all', () => HttpResponse.json(fichasFixture)),
      http.get('/api/columnas/get-all', () => HttpResponse.json(columnasFixture)),
    );

    const user = userEvent.setup();
    renderBoard(tableroTratosFixture.id);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /asignar columna/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /asignar columna/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('(k) el dialog contiene selector de columna del catálogo y límite WIP', async () => {
    server.use(
      http.get('/api/tableros/get-by-id', () =>
        HttpResponse.json(tableroTratosFixture),
      ),
      http.get('/api/fichas/get-all', () => HttpResponse.json(fichasFixture)),
      http.get('/api/columnas/get-all', () =>
        HttpResponse.json([
          {
            id: 'col-cat-1',
            nombre: 'Columna Catálogo Test',
            color: '#fff',
            tipoTablero: 'TRATOS',
            tipoColumna: 'PREDETERMINADA',
          },
        ]),
      ),
    );

    const user = userEvent.setup();
    renderBoard(tableroTratosFixture.id);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /asignar columna/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /asignar columna/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // El catálogo de columnas y el campo de limiteWip deben estar presentes
    expect(screen.getByRole('combobox', { name: /columna/i })).toBeInTheDocument();
    // getByLabelText para el campo limiteWip dentro del dialog
    expect(screen.getByLabelText(/límite wip/i)).toBeInTheDocument();
  });
});
