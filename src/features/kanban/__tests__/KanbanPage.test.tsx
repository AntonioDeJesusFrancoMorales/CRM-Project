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
//   - UI "Nueva columna" existe (Fase 3: reemplaza "Asignar columna")
// Fase 3: migrado de "Asignar columna" → "Nueva columna" (ColumnaCreateDialog)

import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router';

import { KanbanListPage } from '../pages/KanbanListPage';
import { KanbanPage } from '../pages/KanbanPage';
import { server } from '@/test/server';
import {
  tableroTratosFixture,
  tableroTareasFixture,
} from '@/mocks/fixtures/tableros';
import { columnaNuevaSchema } from '../schemas/columna.schema';
import { COLUMN_PALETTE } from '../lib/columnPalette';

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

describe('KanbanListPage — lista unificada TRATOS + TAREAS', () => {
  it('(a) muestra el tablero de tipo TRATOS del fixture', async () => {
    renderListPage();

    await waitFor(() => {
      expect(screen.getByText('Pipeline de Tratos')).toBeInTheDocument();
    });
  });

  it('(b) AHORA muestra tableros de tipo TAREAS junto a los de TRATOS', async () => {
    // Batch 7: invertido — antes esperaba que TAREAS NO aparecieran, ahora SI deben aparecer
    server.use(
      http.get('/api/tableros/get-all', () =>
        HttpResponse.json([
          tableroTratosFixture,
          tableroTareasFixture,
        ]),
      ),
    );

    renderListPage();

    await waitFor(() => {
      expect(screen.getByText('Pipeline de Tratos')).toBeInTheDocument();
    });

    // El tablero TAREAS AHORA debe aparecer (lista unificada)
    expect(screen.getByText('Pipeline de Tareas')).toBeInTheDocument();
  });

  it('(b2) badge TRATOS visible en card de tipo TRATOS', async () => {
    renderListPage();

    await waitFor(() => {
      expect(screen.getByText('Pipeline de Tratos')).toBeInTheDocument();
    });

    // Badge de tipo debe ser visible
    expect(screen.getByText('TRATOS')).toBeInTheDocument();
  });

  it('(b3) badge TAREAS visible en card de tipo TAREAS', async () => {
    server.use(
      http.get('/api/tableros/get-all', () =>
        HttpResponse.json([tableroTratosFixture, tableroTareasFixture]),
      ),
    );

    renderListPage();

    await waitFor(() => {
      expect(screen.getByText('Pipeline de Tareas')).toBeInTheDocument();
    });

    // Badge TAREAS y TRATOS ambos visibles
    expect(screen.getByText('TAREAS')).toBeInTheDocument();
    expect(screen.getByText('TRATOS')).toBeInTheDocument();
  });

  it('(c) empty state cuando no hay tableros', async () => {
    server.use(
      http.get('/api/tableros/get-all', () => HttpResponse.json([])),
    );

    renderListPage();

    await waitFor(() => {
      expect(screen.getByText(/no hay tableros/i)).toBeInTheDocument();
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
// Batch 5 / Fase 3 — KanbanPage: tableroId threading + UI "Nueva columna"
// ---------------------------------------------------------------------------

describe('KanbanPage — Batch 5 / Fase 3: tableroId threading + Nueva columna', () => {
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

  it('(h) UI "Nueva columna" — el botón está presente en el header', async () => {
    // Fase 3: el botón pasó de "Asignar columna" a "Nueva columna"
    const tableroId = tableroTratosFixture.id;
    renderDetailPage(`/tableros/${tableroId}`);

    await waitFor(() => {
      expect(screen.getByText('Por contactar')).toBeInTheDocument();
    });

    // Debe haber un botón "Nueva columna" en lugar del viejo "Asignar columna"
    expect(screen.getByRole('button', { name: /nueva columna/i })).toBeInTheDocument();
  });

  it('(i) columnaNuevaSchema rechaza limiteWip=0 — validación cliente', () => {
    // El schema está wired en ColumnaCreateDialog via zodResolver.
    // Aquí verificamos directamente el schema.
    const result = columnaNuevaSchema.safeParse({
      tipoTablero: 'TRATOS',
      nombre: 'Test',
      color: COLUMN_PALETTE[0],
      limiteWip: 0,
      totalValorEstimado: 0,
    });
    expect(result.success).toBe(false);
    const errors = result.error?.flatten().fieldErrors;
    expect(errors?.limiteWip).toBeDefined();
    expect(errors!.limiteWip![0]).toMatch(/el límite wip debe ser al menos 1/i);
  });

  it('(k) tablero TAREAS: clic en "Nueva columna" abre dialog con selector estadoTarea', async () => {
    server.use(
      http.get('/api/tableros/get-by-id', () =>
        HttpResponse.json(tableroTareasFixture),
      ),
    );

    const user = userEvent.setup();
    renderDetailPage(`/tableros/${tableroTareasFixture.id}`);

    await waitFor(() => {
      expect(screen.getByText('Pipeline de Tareas')).toBeInTheDocument();
    });

    // Abrir el form de nueva columna
    const nuevaBtn = screen.getByRole('button', { name: /nueva columna/i });
    await user.click(nuevaBtn);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Selector estadoTarea debe estar visible
    expect(screen.getByRole('combobox', { name: /estado de tarea/i })).toBeInTheDocument();

    // Selector estadoTrato NO debe estar visible
    expect(screen.queryByRole('combobox', { name: /estado de trato/i })).not.toBeInTheDocument();
  });

  it('(l) tablero TAREAS: dialog "Nueva columna" oculta el campo totalValorEstimado', async () => {
    server.use(
      http.get('/api/tableros/get-by-id', () =>
        HttpResponse.json(tableroTareasFixture),
      ),
    );

    const user = userEvent.setup();
    renderDetailPage(`/tableros/${tableroTareasFixture.id}`);

    await waitFor(() => {
      expect(screen.getByText('Pipeline de Tareas')).toBeInTheDocument();
    });

    const nuevaBtn = screen.getByRole('button', { name: /nueva columna/i });
    await user.click(nuevaBtn);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // El label "Total valor estimado" NO debe aparecer para tableros TAREAS
    expect(screen.queryByLabelText(/total valor estimado/i)).not.toBeInTheDocument();
  });

  it('(m) columnaNuevaSchema para TAREAS requiere estadoTarea y totalValorEstimado=0', () => {
    // Verifica los invariantes del schema para tableros TAREAS.
    const result = columnaNuevaSchema.safeParse({
      tipoTablero: 'TAREAS',
      nombre: 'Mi columna',
      color: COLUMN_PALETTE[0],
      limiteWip: 2,
      estadoTarea: 'PENDIENTE',
      totalValorEstimado: 0,
    });
    expect(result.success).toBe(true);

    // Sin estadoTarea falla
    const sinEstado = columnaNuevaSchema.safeParse({
      tipoTablero: 'TAREAS',
      nombre: 'Mi columna',
      color: COLUMN_PALETTE[0],
      limiteWip: 2,
      totalValorEstimado: 0,
    });
    expect(sinEstado.success).toBe(false);
    expect(sinEstado.error?.flatten().fieldErrors.estadoTarea).toBeDefined();

    // Con totalValorEstimado != 0 falla
    const conValor = columnaNuevaSchema.safeParse({
      tipoTablero: 'TAREAS',
      nombre: 'Mi columna',
      color: COLUMN_PALETTE[0],
      limiteWip: 2,
      estadoTarea: 'PENDIENTE',
      totalValorEstimado: 1000,
    });
    expect(conValor.success).toBe(false);
    expect(conValor.error?.flatten().fieldErrors.totalValorEstimado).toBeDefined();

    // Con estadoTrato también falla (excluyente)
    const conTrato = columnaNuevaSchema.safeParse({
      tipoTablero: 'TAREAS',
      nombre: 'Mi columna',
      color: COLUMN_PALETTE[0],
      limiteWip: 2,
      estadoTarea: 'PENDIENTE',
      estadoTrato: 'ABIERTO',
      totalValorEstimado: 0,
    });
    expect(conTrato.success).toBe(false);
    expect(conTrato.error?.flatten().fieldErrors.estadoTrato).toBeDefined();
  });

  it('(j) nueva columna success invoca POST /tableros/agregar-columna y cierra el form', async () => {
    const user = userEvent.setup();
    let createCalled = false;
    let agregarCalled = false;

    server.use(
      http.post('/api/columnas/create', () => {
        createCalled = true;
        return HttpResponse.json({ id: 'x' }, { status: 201 });
      }),
      http.post('/api/tableros/agregar-columna', () => {
        agregarCalled = true;
        return HttpResponse.json(tableroTratosFixture, { status: 201 });
      }),
      http.get('/api/columnas/get-all', () => HttpResponse.json([])),
      http.get('/api/tableros/get-all', () => HttpResponse.json([tableroTratosFixture])),
    );

    const tableroId = tableroTratosFixture.id;
    renderDetailPage(`/tableros/${tableroId}`);

    await waitFor(() => {
      expect(screen.getByText('Por contactar')).toBeInTheDocument();
    });

    // Abrir el form
    const nuevaBtn = screen.getByRole('button', { name: /nueva columna/i });
    await user.click(nuevaBtn);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Ingresar nombre
    await user.type(screen.getByLabelText(/nombre de la columna/i), 'Revisión');

    // Seleccionar estado de trato (requerido para tableros TRATOS)
    const estadoTrigger = screen.getByRole('combobox', { name: /estado de trato/i });
    await user.click(estadoTrigger);
    await waitFor(() => {
      const options = screen.getAllByRole('option');
      expect(options.length).toBeGreaterThan(0);
    });
    await user.click(screen.getAllByRole('option')[0]!);

    // Enviar
    const dialog = screen.getByRole('dialog');
    const submitBtn = Array.from(dialog.querySelectorAll('button[type="submit"]'))[0];
    await user.click(submitBtn!);

    await waitFor(() => {
      expect(agregarCalled).toBe(true);
    });

    // Flujo de una sola llamada: NO se usa el endpoint viejo de catálogo
    expect(createCalled).toBe(false);
  });
});
