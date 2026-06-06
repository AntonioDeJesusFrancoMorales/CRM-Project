// Tests para KanbanBoardEmbebido — board autocontenido identificado por tableroId.
// Strict TDD: este archivo se escribe antes que la implementación (RED).
// Patrón: server.use override por test, MemoryRouter + QueryClientProvider.
// Cubre: render con tablero cargado, loading, error sin redirect, sin columnas, dialog,
//        y backfill de fichas (Lote 8).
// Fase 3: migrado de "Asignar columna" (Select catálogo) → "Nueva columna" (ColumnaCreateDialog)

import { describe, it, expect, vi } from 'vitest';
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
import { COLUMN_PALETTE } from '../lib/columnPalette';
import type { Ficha } from '@/features/kanban/schemas/ficha.schema';
import type { Trato } from '@/api/types';

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

  it('(c) muestra el botón "Nueva columna" cuando el tablero carga (Fase 3)', async () => {
    // Fase 3: el botón pasó de "Asignar columna" a "Nueva columna"
    server.use(
      http.get('/api/tableros/get-by-id', () =>
        HttpResponse.json(tableroTratosFixture),
      ),
      http.get('/api/fichas/get-all', () => HttpResponse.json(fichasFixture)),
      http.get('/api/columnas/get-all', () => HttpResponse.json(columnasFixture)),
    );

    renderBoard(tableroTratosFixture.id);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /nueva columna/i })).toBeInTheDocument();
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
// Escenario: Dialog "Nueva columna" (Fase 3 — antes "Asignar columna")
// ---------------------------------------------------------------------------

describe('KanbanBoardEmbebido — dialog Nueva columna (Fase 3)', () => {
  it('(j) clic en "Nueva columna" abre el dialog', async () => {
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
      expect(screen.getByRole('button', { name: /nueva columna/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /nueva columna/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('(k) el dialog contiene campo nombre, paleta de colores y límite WIP (Fase 3)', async () => {
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
      expect(screen.getByRole('button', { name: /nueva columna/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /nueva columna/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Campos del nuevo dialog — nombre libre en vez de Select catálogo
    expect(screen.getByLabelText(/nombre de la columna/i)).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /paleta de colores/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/límite wip/i)).toBeInTheDocument();

    // Ya NO debe haber un selector "Columna" del catálogo
    expect(screen.queryByRole('combobox', { name: /^columna$/i })).not.toBeInTheDocument();
  });

  it('(k2) submit válido invoca create + asignar y cierra el dialog', async () => {
    let createCalled = false;
    let asignarCalled = false;

    server.use(
      http.get('/api/tableros/get-by-id', () =>
        HttpResponse.json(tableroTratosFixture),
      ),
      http.get('/api/fichas/get-all', () => HttpResponse.json(fichasFixture)),
      http.get('/api/columnas/get-all', () => HttpResponse.json(columnasFixture)),
      http.post('/api/columnas/create', () => {
        createCalled = true;
        return HttpResponse.json({
          id: 'new-col-emb',
          nombre: 'Revisión',
          color: COLUMN_PALETTE[0],
          tipoTablero: 'TRATOS',
          tipoColumna: 'PERSONALIZADA',
        }, { status: 201 });
      }),
      http.post('/api/tableros/asignar-columna', () => {
        asignarCalled = true;
        return HttpResponse.json(tableroTratosFixture);
      }),
      http.get('/api/tableros/get-all', () => HttpResponse.json([tableroTratosFixture])),
    );

    const user = userEvent.setup();
    renderBoard(tableroTratosFixture.id);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /nueva columna/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /nueva columna/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Ingresar nombre
    await user.type(screen.getByLabelText(/nombre de la columna/i), 'Revisión');

    // Seleccionar estado de trato
    const estadoTrigger = screen.getByRole('combobox', { name: /estado de trato/i });
    await user.click(estadoTrigger);
    await waitFor(() => {
      expect(screen.getAllByRole('option').length).toBeGreaterThan(0);
    });
    await user.click(screen.getAllByRole('option')[0]!);

    // Submit
    const dialog = screen.getByRole('dialog');
    const submitBtn = Array.from(dialog.querySelectorAll('button[type="submit"]'))[0];
    await user.click(submitBtn!);

    await waitFor(() => {
      expect(createCalled).toBe(true);
    });

    await waitFor(() => {
      expect(asignarCalled).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// Escenario: Backfill de fichas (Lote 8)
// ---------------------------------------------------------------------------

// Trato que NO tiene ficha — debe disparar backfill
const TRATO_SIN_FICHA_BF: Trato = {
  id: 'dbackfill-001-integ-test',
  contactoId: 'c-bf-001',
  responsableId: 'usr-bf-001',
  nombre: 'Trato backfill (sin ficha)',
  valorEstimado: null,
  probabilidad: null,
  fechaCierreEsperada: null,
  tipoContrato: 'OTRO',
  motivoPerdida: null,
  creadoEn: '2026-05-30T00:00:00Z',
  actualizadoEn: null,
};

// Tratos que ya tienen ficha en fichasFixture (d1, d2, d3)
const TRATOS_CON_FICHA: Trato[] = [
  {
    id: 'd1111111-dddd-1111-dddd-111111111111',
    contactoId: 'c-001', responsableId: 'usr-001', nombre: 'Trato 1',
    valorEstimado: null, probabilidad: null, fechaCierreEsperada: null,
    tipoContrato: 'SERVICIO', motivoPerdida: null,
    creadoEn: '2026-01-01T00:00:00Z', actualizadoEn: null,
  },
  {
    id: 'd2222222-dddd-2222-dddd-222222222222',
    contactoId: 'c-002', responsableId: 'usr-002', nombre: 'Trato 2',
    valorEstimado: null, probabilidad: null, fechaCierreEsperada: null,
    tipoContrato: 'SERVICIO', motivoPerdida: null,
    creadoEn: '2026-01-01T00:00:00Z', actualizadoEn: null,
  },
  {
    id: 'd3333333-dddd-3333-dddd-333333333333',
    contactoId: 'c-003', responsableId: 'usr-003', nombre: 'Trato 3',
    valorEstimado: null, probabilidad: null, fechaCierreEsperada: null,
    tipoContrato: 'SERVICIO', motivoPerdida: null,
    creadoEn: '2026-01-01T00:00:00Z', actualizadoEn: null,
  },
];

describe('KanbanBoardEmbebido — backfill de fichas (Lote 8)', () => {
  it('(l) al montar con un trato sin ficha, dispara POST /fichas/create para ese trato', async () => {
    const postsCalled: string[] = [];

    server.use(
      http.get('/api/tableros/get-by-id', () =>
        HttpResponse.json(tableroTratosFixture),
      ),
      http.get('/api/tableros/get-all', () =>
        HttpResponse.json([tableroTratosFixture]),
      ),
      http.get('/api/fichas/get-all', () =>
        HttpResponse.json(fichasFixture), // solo tiene fichas para d1, d2, d3
      ),
      http.get('/api/columnas/get-all', () =>
        HttpResponse.json(columnasFixture),
      ),
      http.get('/api/tratos/get-all', () =>
        // d1, d2, d3 tienen ficha; dbackfill-001 no tiene
        HttpResponse.json([...TRATOS_CON_FICHA, TRATO_SIN_FICHA_BF]),
      ),
      http.get('/api/tareas/get-all', () => HttpResponse.json([])),
      http.post('/api/fichas/create', async ({ request }) => {
        const body = await request.json() as { tratoId?: string };
        postsCalled.push(body.tratoId ?? 'unknown');
        const newFicha: Ficha = {
          id: `created-${body.tratoId}`,
          columnaId: tableroTratosFixture.columnas[0]?.id ?? '',
          tipoFicha: 'TRATO',
          tratoId: body.tratoId ?? null,
          tareaId: null,
          actualizadoEn: '2026-05-30T00:00:00Z',
        };
        return HttpResponse.json(newFicha, { status: 201 });
      }),
    );

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/']}>
          <KanbanBoardEmbebido tableroId={tableroTratosFixture.id} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    // El board renderiza normalmente (no se bloquea por el backfill)
    await waitFor(() => {
      expect(screen.getByText('Por contactar')).toBeInTheDocument();
    });

    // El backfill debe haber disparado el POST para el trato sin ficha
    await waitFor(() => {
      expect(postsCalled).toContain(TRATO_SIN_FICHA_BF.id);
    }, { timeout: 5000 });

    // No debe crear ficha para tratos que ya la tienen
    expect(postsCalled).not.toContain('d1111111-dddd-1111-dddd-111111111111');
    expect(postsCalled).not.toContain('d2222222-dddd-2222-dddd-222222222222');
    expect(postsCalled).not.toContain('d3333333-dddd-3333-dddd-333333333333');
  });

  it('(m) el board renderiza normalmente incluso cuando hay tratos sin ficha (no bloquea)', async () => {
    // Esta vez NO registramos handler de POST para verificar que el board
    // renderiza sin importar si el backfill aún no terminó.
    const postCalled = vi.fn();

    server.use(
      http.get('/api/tableros/get-by-id', () =>
        HttpResponse.json(tableroTratosFixture),
      ),
      http.get('/api/tableros/get-all', () =>
        HttpResponse.json([tableroTratosFixture]),
      ),
      http.get('/api/fichas/get-all', () => HttpResponse.json(fichasFixture)),
      http.get('/api/columnas/get-all', () => HttpResponse.json(columnasFixture)),
      http.get('/api/tratos/get-all', () =>
        HttpResponse.json([...TRATOS_CON_FICHA, TRATO_SIN_FICHA_BF]),
      ),
      http.get('/api/tareas/get-all', () => HttpResponse.json([])),
      http.post('/api/fichas/create', async ({ request }) => {
        const body = await request.json() as { tratoId?: string };
        postCalled();
        const newFicha: Ficha = {
          id: `created-${body.tratoId}`,
          columnaId: tableroTratosFixture.columnas[0]?.id ?? '',
          tipoFicha: 'TRATO',
          tratoId: body.tratoId ?? null,
          tareaId: null,
          actualizadoEn: '2026-05-30T00:00:00Z',
        };
        return HttpResponse.json(newFicha, { status: 201 });
      }),
    );

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/']}>
          <KanbanBoardEmbebido tableroId={tableroTratosFixture.id} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    // El board debe renderizar sus columnas sin bloquear por el backfill
    await waitFor(() => {
      expect(screen.getByText('Por contactar')).toBeInTheDocument();
    });
    expect(screen.getByText('En negociación')).toBeInTheDocument();
    expect(screen.getByText('Ganados')).toBeInTheDocument();
  });
});
