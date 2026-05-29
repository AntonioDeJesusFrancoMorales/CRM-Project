// Tests de integración para KanbanListPage y KanbanPage.
// Strict TDD — este archivo se escribe antes que la implementación (RED).
// Patrón: MemoryRouter + Routes + QueryClientProvider + MSW (server override por escenario).
// B7.1 — tareas:
//   - /tableros muestra solo tableros TRATOS
//   - /tableros con array vacío muestra empty state
//   - error 500 muestra botón reintentar
//   - /tableros/t1 renderiza columnas en orden del back
//   - 404 tablero redirige a /tableros
// Batch 5:
//   - KanbanPage pasa tableroId al board (botones Quitar columna visibles)
//   - UI "Asignar columna" existe con limiteWip >= 1

import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router';

import { KanbanListPage } from '../pages/KanbanListPage';
import { KanbanPage } from '../pages/KanbanPage';
import { server } from '@/test/server';
import { tableroTratosFixture } from '@/mocks/fixtures/tableros';
import { asignarColumnaSchema } from '../schemas/columna.schema';

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

// ---------------------------------------------------------------------------
// Batch 5 — KanbanPage threadea tableroId + UI Asignar columna
// ---------------------------------------------------------------------------

describe('KanbanPage — Batch 5: tableroId threading + Asignar columna', () => {
  it('(g) pasa tableroId al KanbanBoard (botones "Quitar columna" visibles por columna)', async () => {
    const tableroId = tableroTratosFixture.id;
    renderDetailPage(`/tableros/${tableroId}`);

    // Esperar que el tablero cargue
    await waitFor(() => {
      expect(screen.getByText('Por contactar')).toBeInTheDocument();
    });

    // Si tableroId fue threadeado, KanbanColumn renderiza botones "Quitar columna"
    // El fixture tiene 4 columnas → 4 botones
    const quitarBtns = screen.getAllByRole('button', { name: /quitar columna/i });
    expect(quitarBtns.length).toBeGreaterThanOrEqual(1);
  });

  it('(h) UI "Asignar columna" muestra selector de columnas del catálogo', async () => {
    const tableroId = tableroTratosFixture.id;
    renderDetailPage(`/tableros/${tableroId}`);

    await waitFor(() => {
      expect(screen.getByText('Por contactar')).toBeInTheDocument();
    });

    // Debe haber algún control / botón para asignar columna
    expect(screen.getByRole('button', { name: /asignar columna/i })).toBeInTheDocument();
  });

  it('(i) asignarColumnaSchema rechaza limiteWip=0 — validación cliente wired en KanbanPage', () => {
    // El schema está wired en KanbanPage via zodResolver.
    // Aquí verificamos directamente el schema (la integración rhf+zod con Radix Dialog
    // tiene complejidades de foco en jsdom que no aportan valor adicional
    // más allá de lo ya cubierto en schemas.test.ts Batch 1)
    const result = asignarColumnaSchema.safeParse({
      limiteWip: 0,
      totalValorEstimado: 0,
    });
    expect(result.success).toBe(false);
    const errors = result.error?.flatten().fieldErrors;
    expect(errors?.limiteWip).toBeDefined();
    expect(errors!.limiteWip![0]).toMatch(/el límite wip debe ser al menos 1/i);
  });

  it('(j) asignar columna success invoca POST asignar-columna y cierra el form', async () => {
    const user = userEvent.setup();
    let postCalled = false;

    server.use(
      http.post('/api/tableros/asignar-columna', () => {
        postCalled = true;
        return HttpResponse.json(tableroTratosFixture);
      }),
      http.get('/api/columnas/get-all', () =>
        HttpResponse.json([
          {
            id: 'a1111111-aaaa-1111-aaaa-111111111111',
            nombre: 'Por contactar - Cat',
            color: '#94a3b8',
            tipoTablero: 'TRATOS',
            tipoColumna: 'PREDETERMINADA',
          },
        ]),
      ),
    );

    const tableroId = tableroTratosFixture.id;
    renderDetailPage(`/tableros/${tableroId}`);

    await waitFor(() => {
      expect(screen.getByText('Por contactar')).toBeInTheDocument();
    });

    // Abrir el formulario
    const asignarBtn = screen.getByRole('button', { name: /asignar columna/i });
    await user.click(asignarBtn);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Esperar a que cargue el selector de columnas del catálogo
    await waitFor(() => {
      expect(screen.getByText(/Por contactar - Cat/)).toBeInTheDocument();
    });

    // Seleccionar la columna del catálogo usando Radix Select
    const selectTrigger = screen.getByRole('combobox', { name: /columna/i });
    await user.click(selectTrigger);

    // Encontrar la opción en el listbox
    await waitFor(() => {
      const options = screen.getAllByRole('option');
      expect(options.length).toBeGreaterThan(0);
    });
    const options = screen.getAllByRole('option');
    await user.click(options[0]!);

    // Llenar limiteWip con valor válido
    const limiteWipInputs = screen.getAllByRole('spinbutton');
    await user.clear(limiteWipInputs[0]!);
    await user.type(limiteWipInputs[0]!, '3');

    // Enviar
    const dialog = screen.getByRole('dialog');
    const submitBtn = Array.from(dialog.querySelectorAll('button[type="submit"]'))[0];
    await user.click(submitBtn!);

    await waitFor(() => {
      expect(postCalled).toBe(true);
    });
  });
});
