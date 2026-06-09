// Tests de componente para KanbanColumn — Strict TDD B6.1 (RED).
// Cubre: nombre/color, badge estado SOLO en TAREA (estadoTrato oculto), limiteWip visual, indicador WIP superado.
// DnD (useDroppable) no se testea con jsdom — se testea la lógica del handler en KanbanBoard.
// Fase 4: botón Pencil (siempre), Trash2 condicional (solo PERSONALIZADA).

import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { server } from '@/test/server';
import type { ColumnaTablero } from '@/features/kanban/schemas/tablero.schema';
import type { Ficha } from '@/features/kanban/schemas/ficha.schema';
import { columnasTablTratosIds } from '@/mocks/fixtures/tableros';

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

// Columna con id de "En negociación" → PERSONALIZADA en el catálogo fixture
// (ver src/mocks/fixtures/tableros.ts: enNegociacion → tipoColumna: 'PERSONALIZADA')
const COL_PERSONALIZADA: ColumnaTablero = {
  ...COL_BASE,
  id: columnasTablTratosIds.enNegociacion,
  nombre: 'En negociación',
  color: '#fbbf24',
  limiteWip: 2,
};

function makeFixhas(columnaId: string, count: number): Ficha[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `h${i + 1}`,
    columnaId,
    tipoFicha: 'TRATO' as const,
    tratoId: `d${i + 1}`,
    tareaId: null,
    actualizadoEn: `2026-04-${10 + i}T08:00:00Z`,
  }));
}

const TABLERO_ID = 'f1111111-ffff-1111-ffff-111111111111';

function renderColumn(
  columna: ColumnaTablero,
  fichas: Ficha[] = [],
  tableroId = TABLERO_ID,
  tipoFicha?: 'TRATO' | 'TAREA',
  nombresHermanos?: string[],
) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <KanbanColumn
          columna={columna}
          fichas={fichas}
          tableroId={tableroId}
          tipoFicha={tipoFicha}
          nombresHermanos={nombresHermanos}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('KanbanColumn — nombre (estadoTrato oculto en tableros TRATO)', () => {
  it('(a) renderiza el nombre de la columna', () => {
    renderColumn(COL_BASE);
    expect(screen.getByText('Por contactar')).toBeInTheDocument();
  });

  it('(b) muestra fallback "Sin nombre" cuando nombre es null', () => {
    renderColumn(COL_NOMBRE_NULL);
    expect(screen.getByText('Sin nombre')).toBeInTheDocument();
  });

  it('(c) NO muestra badge de estado ABIERTO (el nombre alcanza)', () => {
    renderColumn(COL_BASE);
    // COL_BASE.estadoTrato = ABIERTO; el badge de estado NO debe renderizarse en TRATO
    expect(screen.queryByText('Abierto')).not.toBeInTheDocument();
  });

  it('(d) NO muestra badge GANADO (solo el nombre de columna "Ganados")', () => {
    renderColumn(COL_GANADOS);
    // El nombre "Ganados" sigue presente, pero el badge exacto "Ganado" no
    const badge = screen.queryAllByText(/ganado/i).find((el) => el.textContent === 'Ganado');
    expect(badge).toBeUndefined();
    expect(screen.getByText('Ganados')).toBeInTheDocument();
  });

  it('(e) NO muestra badge PERDIDO (solo el nombre de columna "Perdidos")', () => {
    renderColumn(COL_PERDIDOS);
    const badge = screen.queryAllByText(/perdido/i).find((el) => el.textContent === 'Perdido');
    expect(badge).toBeUndefined();
    expect(screen.getByText('Perdidos')).toBeInTheDocument();
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

  it('(l) orden de fichas es por actualizadoEn ASC (la más antigua primero)', () => {
    const fichas: Ficha[] = [
      {
        id: 'h-new',
        columnaId: COL_BASE.id,
        tipoFicha: 'TRATO',
        tratoId: 'd-nuevo',
        tareaId: null,
        actualizadoEn: '2026-05-01T08:00:00Z',
      },
      {
        id: 'h-old',
        columnaId: COL_BASE.id,
        tipoFicha: 'TRATO',
        tratoId: 'd-viejo',
        tareaId: null,
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

// ---------------------------------------------------------------------------
// Batch 5 — Botones en el header de KanbanColumn
// ---------------------------------------------------------------------------

describe('KanbanColumn — botón "+" y FichaCreateDialog', () => {
  it('(m) header muestra botón "+"', () => {
    renderColumn(COL_BASE);
    expect(screen.getByRole('button', { name: /nueva ficha/i })).toBeInTheDocument();
  });

  it('(n) clic en "+" abre FichaCreateDialog con columnaId de la columna precargado', async () => {
    const user = userEvent.setup();
    renderColumn(COL_BASE);

    const addBtn = screen.getByRole('button', { name: /nueva ficha/i });
    await user.click(addBtn);

    // El dialog se abre y muestra el título
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/nueva ficha/i)).toBeInTheDocument();
  });
});

describe('KanbanColumn — botón "Quitar columna" (condicional: solo PERSONALIZADA)', () => {
  it('(o) columna PERSONALIZADA muestra botón "Quitar columna"', async () => {
    // COL_PERSONALIZADA tiene id de "En negociación" → tipoColumna: PERSONALIZADA en el fixture
    renderColumn(COL_PERSONALIZADA);
    // El catálogo se carga de forma async — esperamos que el botón aparezca
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /quitar columna/i })).toBeInTheDocument();
    });
  });

  it('(p) clic en "Quitar columna" invoca DELETE eliminar-columna con tableroId y columnaId correctos', async () => {
    const user = userEvent.setup();
    let capturedParams: Record<string, string | null> = {};

    server.use(
      http.delete('/api/tableros/eliminar-columna', ({ request }) => {
        const url = new URL(request.url);
        capturedParams = {
          id: url.searchParams.get('id'),
          columnaId: url.searchParams.get('columnaId'),
        };
        return new HttpResponse(null, { status: 204 });
      }),
    );

    renderColumn(COL_PERSONALIZADA, [], TABLERO_ID);

    // Esperar que el catálogo cargue y el botón aparezca
    const quitarBtn = await screen.findByRole('button', { name: /quitar columna/i });
    await user.click(quitarBtn);

    await waitFor(() => {
      expect(capturedParams.id).toBe(TABLERO_ID);
      expect(capturedParams.columnaId).toBe(COL_PERSONALIZADA.id);
    });
  });

  it('(q) 409 en Quitar columna — botón se re-habilita tras error (wiring del hook)', async () => {
    const user = userEvent.setup();

    server.use(
      http.delete('/api/tableros/eliminar-columna', () => {
        return HttpResponse.json(
          { status: 409, error: 'CONFLICT', message: 'La columna tiene fichas activas' },
          { status: 409 },
        );
      }),
    );

    renderColumn(COL_PERSONALIZADA, [], TABLERO_ID);

    const quitarBtn = await screen.findByRole('button', { name: /quitar columna/i });
    await user.click(quitarBtn);

    // El hook maneja el 409 con toast.error — verificamos que el botón queda habilitado
    await waitFor(() => {
      expect(quitarBtn).not.toBeDisabled();
    });
  });
});

// ---------------------------------------------------------------------------
// Batch 5 — prop tipoFicha: badge dual + label por tipo
// ---------------------------------------------------------------------------

const COL_TAREA_PENDIENTE: ColumnaTablero = {
  ...COL_BASE,
  id: 'a5555555-aaaa-5555-aaaa-555555555555',
  nombre: 'Columna Alpha', // nombre neutro para no confundir con el badge
  estadoTrato: null,
  estadoTarea: 'PENDIENTE',
};

const COL_TAREA_EN_CURSO: ColumnaTablero = {
  ...COL_BASE,
  id: 'a6666666-aaaa-6666-aaaa-666666666666',
  nombre: 'Columna Beta',
  estadoTrato: null,
  estadoTarea: 'EN_CURSO',
};

const COL_TAREA_FINALIZADA: ColumnaTablero = {
  ...COL_BASE,
  id: 'a7777777-aaaa-7777-aaaa-777777777777',
  nombre: 'Columna Gamma',
  estadoTrato: null,
  estadoTarea: 'FINALIZADA',
};

describe('KanbanColumn — Batch 5: el badge de estado de columna está oculto en AMBOS tipos', () => {
  it('(r) con tipoFicha="TAREA" y estadoTarea=PENDIENTE NO muestra badge de estado', () => {
    renderColumn(COL_TAREA_PENDIENTE, [], TABLERO_ID, 'TAREA');
    expect(screen.queryByText('Pendiente')).not.toBeInTheDocument();
  });

  it('(s) con tipoFicha="TAREA" y estadoTarea=EN_CURSO NO muestra badge de estado', () => {
    renderColumn(COL_TAREA_EN_CURSO, [], TABLERO_ID, 'TAREA');
    expect(screen.queryByText('En curso')).not.toBeInTheDocument();
  });

  it('(t) con tipoFicha="TAREA" y estadoTarea=FINALIZADA NO muestra badge de estado', () => {
    renderColumn(COL_TAREA_FINALIZADA, [], TABLERO_ID, 'TAREA');
    expect(screen.queryByText('Finalizada')).not.toBeInTheDocument();
  });

  it('(u) con tipoFicha="TRATO" NO muestra badge estadoTrato (oculto: el nombre alcanza)', () => {
    // COL_BASE tiene estadoTrato=ABIERTO; en tableros TRATO el estado se omite
    renderColumn(COL_BASE, [], TABLERO_ID, 'TRATO');
    expect(screen.queryByText('Abierto')).not.toBeInTheDocument();
  });
});

describe('KanbanColumn — Batch 5: tipoFicha=TAREA pasa titulo a KanbanCard', () => {
  it('(v) con tipoFicha="TAREA" y ficha TAREA, KanbanCard muestra el titulo de la tarea', async () => {
    const { http: httpFn, HttpResponse: HR } = await import('msw');
    server.use(
      httpFn.get('/api/tareas/get-all', () =>
        HR.json([
          {
            id: 'ta-abc',
            tratoId: 'd1',
            responsableId: 'usr1',
            titulo: 'Mi tarea del tablero',
            descripcion: null,
            tipo: 'GENERAL',
            prioridad: 'MEDIA',
            fechaLimite: '2026-12-31T00:00:00Z',
            fechaCompletada: null,
            creadoEn: '2026-01-01T00:00:00Z',
            actualizadoEn: '2026-01-01T00:00:00Z',
          },
        ]),
      ),
    );

    const fichasTarea: Ficha[] = [
      {
        id: 'h-tarea-1',
        columnaId: COL_TAREA_PENDIENTE.id,
        tipoFicha: 'TAREA',
        tratoId: null,
        tareaId: 'ta-abc',
        actualizadoEn: '2026-04-10T08:00:00Z',
      },
    ];

    renderColumn(COL_TAREA_PENDIENTE, fichasTarea, TABLERO_ID, 'TAREA');

    // KanbanCard should display the tarea titulo
    await waitFor(() => {
      expect(screen.getByText('Mi tarea del tablero')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Cambio 2 — datos adicionales en tarjetas TRATO
// ---------------------------------------------------------------------------

describe('KanbanColumn — Cambio 2: datos adicionales tarjeta TRATO', () => {
  const fichasTrato: Ficha[] = [
    {
      id: 'h-trato-rich',
      columnaId: COL_BASE.id,
      tipoFicha: 'TRATO',
      tratoId: 'trato-rich-id',
      tareaId: null,
      actualizadoEn: '2026-04-10T08:00:00Z',
    },
  ];

  it('(w) tarjeta TRATO muestra valorEstimado formateado como moneda', async () => {
    server.use(
      http.get('/api/tratos/get-all', () =>
        HttpResponse.json([
          {
            id: 'trato-rich-id',
            contactoId: 'c1',
            responsableId: 'usr1',
            nombre: 'Trato con valor',
            valorEstimado: 250000,
            probabilidad: 70,
            fechaCierreEsperada: '2026-06-30',
            tipoContrato: 'SERVICIO',
            motivoPerdida: null,
            creadoEn: '2026-04-05T10:00:00Z',
            actualizadoEn: '2026-04-05T10:00:00Z',
          },
        ]),
      ),
    );

    renderColumn(COL_BASE, fichasTrato, TABLERO_ID, 'TRATO');

    // Debe mostrar el valor formateado como moneda (contiene el número)
    await waitFor(() => {
      expect(screen.getByText('Trato con valor')).toBeInTheDocument();
    });
    // El valor 250000 debe aparecer formateado como moneda (puede estar en la tarjeta
    // y/o en el total derivado de la columna — ambos son válidos)
    const matchingEls = screen.getAllByText(/250/);
    expect(matchingEls.length).toBeGreaterThanOrEqual(1);
  });

  it('(x) tarjeta TRATO muestra probabilidad como porcentaje', async () => {
    server.use(
      http.get('/api/tratos/get-all', () =>
        HttpResponse.json([
          {
            id: 'trato-rich-id',
            contactoId: 'c1',
            responsableId: 'usr1',
            nombre: 'Trato con probabilidad',
            valorEstimado: null,
            probabilidad: 75,
            fechaCierreEsperada: null,
            tipoContrato: 'SERVICIO',
            motivoPerdida: null,
            creadoEn: '2026-04-05T10:00:00Z',
            actualizadoEn: '2026-04-05T10:00:00Z',
          },
        ]),
      ),
    );

    renderColumn(COL_BASE, fichasTrato, TABLERO_ID, 'TRATO');

    await waitFor(() => {
      expect(screen.getByText('Trato con probabilidad')).toBeInTheDocument();
    });
    // Probabilidad 75 debe aparecer como "75%"
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('(y) tarjeta TRATO muestra fechaCierreEsperada formateada cuando no es null', async () => {
    server.use(
      http.get('/api/tratos/get-all', () =>
        HttpResponse.json([
          {
            id: 'trato-rich-id',
            contactoId: 'c1',
            responsableId: 'usr1',
            nombre: 'Trato con fecha',
            valorEstimado: null,
            probabilidad: null,
            fechaCierreEsperada: '2026-06-30',
            tipoContrato: 'SERVICIO',
            motivoPerdida: null,
            creadoEn: '2026-04-05T10:00:00Z',
            actualizadoEn: '2026-04-05T10:00:00Z',
          },
        ]),
      ),
    );

    renderColumn(COL_BASE, fichasTrato, TABLERO_ID, 'TRATO');

    await waitFor(() => {
      expect(screen.getByText('Trato con fecha')).toBeInTheDocument();
    });
    // La fecha 2026-06-30 debe estar formateada de alguna manera visible
    expect(screen.getByText(/2026/)).toBeInTheDocument();
  });

  it('(z1) tarjeta TRATO NO muestra valorEstimado cuando es null', async () => {
    server.use(
      http.get('/api/tratos/get-all', () =>
        HttpResponse.json([
          {
            id: 'trato-rich-id',
            contactoId: 'c1',
            responsableId: 'usr1',
            nombre: 'Trato sin valor',
            valorEstimado: null,
            probabilidad: null,
            fechaCierreEsperada: null,
            tipoContrato: 'OTRO',
            motivoPerdida: null,
            creadoEn: '2026-04-05T10:00:00Z',
            actualizadoEn: '2026-04-05T10:00:00Z',
          },
        ]),
      ),
    );

    renderColumn(COL_BASE, fichasTrato, TABLERO_ID, 'TRATO');

    await waitFor(() => {
      expect(screen.getByText('Trato sin valor')).toBeInTheDocument();
    });
    // No debe mostrar etiquetas de detalles si todos son null
    expect(screen.queryByText(/^Valor:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Prob\./)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Cierre:/)).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Cambio 2 — datos adicionales en tarjetas TAREA
// ---------------------------------------------------------------------------

describe('KanbanColumn — Cambio 2: datos adicionales tarjeta TAREA', () => {
  const fichasTarea: Ficha[] = [
    {
      id: 'h-tarea-rich',
      columnaId: COL_TAREA_PENDIENTE.id,
      tipoFicha: 'TAREA',
      tratoId: null,
      tareaId: 'tarea-rich-id',
      actualizadoEn: '2026-04-10T08:00:00Z',
    },
  ];

  it('(z2) tarjeta TAREA muestra badge de prioridad (ALTA)', async () => {
    server.use(
      http.get('/api/tareas/get-all', () =>
        HttpResponse.json([
          {
            id: 'tarea-rich-id',
            tratoId: 'd1',
            responsableId: 'usr1',
            titulo: 'Tarea con prioridad alta',
            descripcion: null,
            tipo: 'GENERAL',
            prioridad: 'ALTA',
            fechaLimite: '2026-07-15T00:00:00Z',
            fechaCompletada: null,
            creadoEn: '2026-04-10T08:00:00Z',
            actualizadoEn: '2026-04-10T08:00:00Z',
          },
        ]),
      ),
    );

    renderColumn(COL_TAREA_PENDIENTE, fichasTarea, TABLERO_ID, 'TAREA');

    await waitFor(() => {
      expect(screen.getByText('Tarea con prioridad alta')).toBeInTheDocument();
    });
    // Badge de prioridad ALTA en español
    expect(screen.getByText('Alta')).toBeInTheDocument();
  });

  it('(z3) tarjeta TAREA muestra badge de prioridad (URGENTE)', async () => {
    server.use(
      http.get('/api/tareas/get-all', () =>
        HttpResponse.json([
          {
            id: 'tarea-rich-id',
            tratoId: 'd1',
            responsableId: 'usr1',
            titulo: 'Tarea urgente',
            descripcion: null,
            tipo: 'CIERRE',
            prioridad: 'URGENTE',
            fechaLimite: '2026-06-01T00:00:00Z',
            fechaCompletada: null,
            creadoEn: '2026-04-10T08:00:00Z',
            actualizadoEn: '2026-04-10T08:00:00Z',
          },
        ]),
      ),
    );

    renderColumn(COL_TAREA_PENDIENTE, fichasTarea, TABLERO_ID, 'TAREA');

    await waitFor(() => {
      expect(screen.getByText('Tarea urgente')).toBeInTheDocument();
    });
    expect(screen.getByText('Urgente')).toBeInTheDocument();
  });

  it('(z4) tarjeta TAREA muestra fechaLimite formateada', async () => {
    server.use(
      http.get('/api/tareas/get-all', () =>
        HttpResponse.json([
          {
            id: 'tarea-rich-id',
            tratoId: 'd1',
            responsableId: 'usr1',
            titulo: 'Tarea con fecha',
            descripcion: null,
            tipo: 'SEGUIMIENTO',
            prioridad: 'MEDIA',
            fechaLimite: '2026-08-20T00:00:00Z',
            fechaCompletada: null,
            creadoEn: '2026-04-10T08:00:00Z',
            actualizadoEn: '2026-04-10T08:00:00Z',
          },
        ]),
      ),
    );

    renderColumn(COL_TAREA_PENDIENTE, fichasTarea, TABLERO_ID, 'TAREA');

    await waitFor(() => {
      expect(screen.getByText('Tarea con fecha')).toBeInTheDocument();
    });
    // La fecha 2026-08-20 debe aparecer formateada
    expect(screen.getByText(/2026/)).toBeInTheDocument();
  });

  it('(z5) tarjeta TAREA muestra tipo en español (SEGUIMIENTO → "Seguimiento")', async () => {
    server.use(
      http.get('/api/tareas/get-all', () =>
        HttpResponse.json([
          {
            id: 'tarea-rich-id',
            tratoId: 'd1',
            responsableId: 'usr1',
            titulo: 'Tarea de seguimiento',
            descripcion: null,
            tipo: 'SEGUIMIENTO',
            prioridad: 'BAJA',
            fechaLimite: '2026-09-01T00:00:00Z',
            fechaCompletada: null,
            creadoEn: '2026-04-10T08:00:00Z',
            actualizadoEn: '2026-04-10T08:00:00Z',
          },
        ]),
      ),
    );

    renderColumn(COL_TAREA_PENDIENTE, fichasTarea, TABLERO_ID, 'TAREA');

    await waitFor(() => {
      expect(screen.getByText('Tarea de seguimiento')).toBeInTheDocument();
    });
    // Tipo "SEGUIMIENTO" debe aparecer en español como "Seguimiento"
    expect(screen.getByText('Seguimiento')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Fase 4 — Botón Pencil + Trash2 condicional
// ---------------------------------------------------------------------------

describe('KanbanColumn — Fase 4: botón Pencil siempre visible', () => {
  it('(z6) columna PREDETERMINADA muestra el botón "Editar columna" (lápiz)', async () => {
    // COL_BASE id = porContactar → PREDETERMINADA en el catálogo fixture
    renderColumn(COL_BASE);
    // El botón está en el DOM desde el primer render (no depende del catálogo)
    expect(screen.getByRole('button', { name: /editar columna/i })).toBeInTheDocument();
  });

  it('(z7) columna PERSONALIZADA también muestra el botón "Editar columna" (lápiz)', async () => {
    renderColumn(COL_PERSONALIZADA);
    expect(screen.getByRole('button', { name: /editar columna/i })).toBeInTheDocument();
  });
});

describe('KanbanColumn — Fase 4: Trash2 condicional según tipoColumna', () => {
  it('(z8) columna PREDETERMINADA NO muestra el botón "Quitar columna"', async () => {
    // COL_BASE tiene id de "Por contactar" → PREDETERMINADA en el catálogo fixture.
    // El catálogo se carga async (MSW); al inicio catalogo=[] → esPredeterminada=false → Trash2 visible.
    // Una vez que carga, esPredeterminada=true → Trash2 desaparece.
    // Esperamos a que el Trash2 desaparezca (catálogo cargado).
    renderColumn(COL_BASE);
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /quitar columna/i })).not.toBeInTheDocument();
    });
  });

  it('(z9) columna PERSONALIZADA SÍ muestra el botón "Quitar columna"', async () => {
    // COL_PERSONALIZADA tiene id de "En negociación" → PERSONALIZADA en el catálogo fixture
    renderColumn(COL_PERSONALIZADA);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /quitar columna/i })).toBeInTheDocument();
    });
  });
});

describe('KanbanColumn — Fase 4: botón Pencil abre ColumnaEditDialog', () => {
  it('(z10) clic en lápiz abre el dialog "Editar columna"', async () => {
    const user = userEvent.setup();
    renderColumn(COL_BASE);

    const editBtn = screen.getByRole('button', { name: /editar columna/i });
    await user.click(editBtn);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    expect(screen.getByText('Editar columna')).toBeInTheDocument();
  });

  it('(z11) el dialog precarga el nombre actual de la columna', async () => {
    const user = userEvent.setup();
    renderColumn(COL_BASE);

    await user.click(screen.getByRole('button', { name: /editar columna/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // El input de nombre debe tener el valor actual de la columna
    const input = screen.getByLabelText(/nombre de la columna/i);
    expect((input as HTMLInputElement).value).toBe(COL_BASE.nombre);
  });
});

// ---------------------------------------------------------------------------
// Ajuste: total derivado de la columna
// ---------------------------------------------------------------------------

describe('KanbanColumn — Total derivado (solo TRATOS)', () => {
  it('(z12) columna TRATOS con fichas muestra el total = suma de valorEstimado de los tratos', async () => {
    // Mock de tratos: dos tratos con valor 10000 y 25000 → total 35000
    server.use(
      http.get('/api/tratos/get-all', () =>
        HttpResponse.json([
          {
            id: 'd1',
            contactoId: 'c1',
            responsableId: 'usr1',
            nombre: 'Trato A',
            valorEstimado: 10000,
            probabilidad: 50,
            fechaCierreEsperada: null,
            tipoContrato: 'SERVICIO',
            motivoPerdida: null,
            creadoEn: '2026-04-05T10:00:00Z',
            actualizadoEn: '2026-04-05T10:00:00Z',
          },
          {
            id: 'd2',
            contactoId: 'c1',
            responsableId: 'usr1',
            nombre: 'Trato B',
            valorEstimado: 25000,
            probabilidad: 70,
            fechaCierreEsperada: null,
            tipoContrato: 'SERVICIO',
            motivoPerdida: null,
            creadoEn: '2026-04-06T10:00:00Z',
            actualizadoEn: '2026-04-06T10:00:00Z',
          },
        ]),
      ),
    );

    const fichas = makeFixhas(COL_BASE.id, 2); // tratoId: 'd1' y 'd2'
    renderColumn(COL_BASE, fichas, TABLERO_ID, 'TRATO');

    // El total 35000 debe aparecer formateado como moneda
    await waitFor(() => {
      const totalEl = screen.getByTestId('columna-total-derivado');
      expect(totalEl).toBeInTheDocument();
      // El texto incluye "Total:" y el valor formateado con 35000
      expect(totalEl.textContent).toMatch(/total/i);
      expect(totalEl.textContent).toMatch(/35/);
    });
  });

  it('(z13) columna TRATOS con fichas sin valorEstimado (null) muestra total 0', async () => {
    server.use(
      http.get('/api/tratos/get-all', () =>
        HttpResponse.json([
          {
            id: 'd1',
            contactoId: 'c1',
            responsableId: 'usr1',
            nombre: 'Trato sin valor',
            valorEstimado: null,
            probabilidad: null,
            fechaCierreEsperada: null,
            tipoContrato: 'OTRO',
            motivoPerdida: null,
            creadoEn: '2026-04-05T10:00:00Z',
            actualizadoEn: '2026-04-05T10:00:00Z',
          },
        ]),
      ),
    );

    const fichas = makeFixhas(COL_BASE.id, 1);
    renderColumn(COL_BASE, fichas, TABLERO_ID, 'TRATO');

    // Debe mostrar el indicador de total (con valor 0)
    await waitFor(() => {
      const totalEl = screen.getByTestId('columna-total-derivado');
      expect(totalEl).toBeInTheDocument();
      expect(totalEl.textContent).toMatch(/total/i);
    });
  });

  it('(z14) columna TAREAS NO muestra el indicador de total derivado', () => {
    // Para tableros TAREAS, el total no aplica → no se renderiza
    renderColumn(COL_TAREA_PENDIENTE, [], TABLERO_ID, 'TAREA');
    expect(screen.queryByTestId('columna-total-derivado')).not.toBeInTheDocument();
  });
});
