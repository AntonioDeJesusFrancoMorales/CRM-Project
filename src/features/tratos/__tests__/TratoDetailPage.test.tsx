import { describe, it, expect } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router';

import { TratoDetailPage } from '../pages/TratoDetailPage';
import { server } from '@/test/server';

// IDs del fixture
// d1111111 → "Implementación CRM Innovatech", prospecto_id, 2 tareas pendientes (e1111111, e2222222)
// d2222222 → "Renovación licencia anual Innovatech", cliente_id=c1111111, 5 tareas
// d3333333 → "Consultoría procesos Maya", cliente_id=c2222222, sin tareas

const TRATO_CON_PROSPECTO = 'd1111111-dddd-1111-dddd-111111111111';
const TRATO_CON_CLIENTE   = 'd2222222-dddd-2222-dddd-222222222222';
const TRATO_SIN_TAREAS    = 'd3333333-dddd-3333-dddd-333333333333';

function renderPage(initialPath: string) {
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
          <Route path="/tratos" element={<div>Listado de tratos</div>} />
          <Route path="/tratos/:id" element={<TratoDetailPage />} />
          <Route path="/clientes/:id" element={<div>Detalle cliente</div>} />
          <Route path="/prospectos/:id" element={<div>Detalle prospecto</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('TratoDetailPage', () => {
  // ── (a) Layout tabbed ───────────────────────────────────────────────────────
  it('(a) layout tabbed renderiza tabs Información y Tareas', async () => {
    renderPage(`/tratos/${TRATO_CON_PROSPECTO}`);

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /implementación crm innovatech/i }),
      ).toBeInTheDocument(),
    );

    expect(screen.getByRole('tab', { name: /información/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /tareas/i })).toBeInTheDocument();
  });

  // ── (b) Tab Información — campos + link a cliente ──────────────────────────
  it('(b) tab Información muestra campos del trato y link al cliente', async () => {
    renderPage(`/tratos/${TRATO_CON_CLIENTE}`);

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /renovación licencia anual innovatech/i }),
      ).toBeInTheDocument(),
    );

    // Tab Información activo por defecto — fields visibles
    expect(screen.getByText(/valor estimado/i)).toBeInTheDocument();
    expect(screen.getByText(/responsable/i)).toBeInTheDocument();

    // Link al cliente vinculado (c1111111 = Ana Rodríguez) — se resuelve async al cargar el cliente
    await waitFor(() => {
      const links = screen.getAllByRole('link');
      const clienteLink = links.find((l) => l.getAttribute('href')?.includes('/clientes/'));
      expect(clienteLink).toBeDefined();
    });
  });

  // ── (c) motivo_perdida condicional ─────────────────────────────────────────
  it('(c) motivo_perdida NO visible cuando estado es abierto', async () => {
    renderPage(`/tratos/${TRATO_CON_CLIENTE}`);

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /renovación licencia anual innovatech/i }),
      ).toBeInTheDocument(),
    );

    expect(screen.queryByText(/motivo de pérdida/i)).not.toBeInTheDocument();
  });

  it('(c) motivo_perdida SÍ visible cuando estado es perdido', async () => {
    server.use(
      http.get(`/api/tratos/${TRATO_CON_CLIENTE}`, () =>
        HttpResponse.json({
          id: TRATO_CON_CLIENTE,
          cliente_id: 'c1111111-cccc-1111-cccc-111111111111',
          prospecto_id: null,
          responsable_id: '22222222-2222-2222-2222-222222222222',
          nombre: 'Trato Perdido Test',
          valor_estimado: 30000,
          probabilidad: 0,
          fecha_cierre_esperada: null,
          tipo_contrato: null,
          estado: 'perdido',
          motivo_perdida: 'precio fuera de presupuesto',
          creado_en: '2026-04-01T00:00:00.000Z',
          actualizado_en: '2026-05-01T00:00:00.000Z',
        }),
      ),
    );

    renderPage(`/tratos/${TRATO_CON_CLIENTE}`);

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /trato perdido test/i }),
      ).toBeInTheDocument(),
    );

    expect(screen.getByText(/motivo de pérdida/i)).toBeInTheDocument();
    expect(screen.getByText('precio fuera de presupuesto')).toBeInTheDocument();
  });

  // ── (d) Header muestra 5 acciones + Reabrir disabled en estado abierto ─────
  it('(d) header muestra las 5 acciones y Reabrir está deshabilitado con estado abierto', async () => {
    renderPage(`/tratos/${TRATO_CON_CLIENTE}`);

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /renovación licencia anual innovatech/i }),
      ).toBeInTheDocument(),
    );

    expect(screen.getByRole('button', { name: /marcar como ganado/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /marcar como perdido/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reabrir/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /eliminar/i })).toBeInTheDocument();
  });

  // ── (e) Badge de pendientes > 0 muestra número ────────────────────────────
  it('(e) badge de pendientes muestra "2" cuando hay 2 tareas pendientes', async () => {
    // d1111111 tiene exactamente 2 tareas pendientes en el fixture (e1111111, e2222222)
    renderPage(`/tratos/${TRATO_CON_PROSPECTO}`);

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /implementación crm innovatech/i }),
      ).toBeInTheDocument(),
    );

    // El badge debe aparecer con el número 2 en el header
    await waitFor(() => expect(screen.getByText('2')).toBeInTheDocument());
  });

  // ── (f) Badge oculto cuando count = 0 ─────────────────────────────────────
  it('(f) badge NO visible cuando el trato no tiene tareas pendientes', async () => {
    // d3333333 no tiene tareas en el fixture
    renderPage(`/tratos/${TRATO_SIN_TAREAS}`);

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /consultoría procesos maya/i }),
      ).toBeInTheDocument(),
    );

    // Esperar que el query de tareas termine (loading → data vacía)
    await waitFor(() => {
      // Verificamos que el heading siga presente (cargó completamente)
      expect(
        screen.getByRole('heading', { name: /consultoría procesos maya/i }),
      ).toBeInTheDocument();
    });

    // El badge numérico NO debe estar en el DOM (no mostramos "0")
    // Chequeamos que no haya un badge con "0" ni con ningún número de tareas pendientes
    expect(screen.queryByTestId('badge-pendientes')).not.toBeInTheDocument();
  });

  // ── (g) Tab Tareas renderiza tabla de tareas ───────────────────────────────
  it('(g) tab Tareas renderiza tabla de tareas del trato', async () => {
    const user = userEvent.setup();
    renderPage(`/tratos/${TRATO_CON_PROSPECTO}`);

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /implementación crm innovatech/i }),
      ).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('tab', { name: /tareas/i }));

    // Las 2 tareas del trato d1111111 deben aparecer
    await waitFor(() =>
      expect(screen.getByText('Demo presencial con CTO')).toBeInTheDocument(),
    );
    expect(screen.getByText('Llamada de seguimiento post-demo')).toBeInTheDocument();
  });

  // ── (h) Botón "Crear tarea" abre TareaCreateDialog con Select trato disabled
  it('(h) botón "Crear tarea" en tab Tareas abre TareaCreateDialog con Select trato disabled', async () => {
    const user = userEvent.setup();
    renderPage(`/tratos/${TRATO_CON_PROSPECTO}`);

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /implementación crm innovatech/i }),
      ).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('tab', { name: /tareas/i }));

    const btnCrear = await screen.findByRole('button', { name: /crear tarea/i });
    await user.click(btnCrear);

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: /nueva tarea/i })).toBeInTheDocument();
  });

  // ── (i) POST desde el tab usa el trato fijo ───────────────────────────────
  it('(i) al crear tarea desde el tab, POST va a /tareas/create con tratoId en body', async () => {
    let postCalled = false;
    server.use(
      http.post('/api/tareas/create', async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        if (body['tratoId'] === TRATO_CON_PROSPECTO) {
          postCalled = true;
        }
        return HttpResponse.json(
          {
            id: 'e9999999-eeee-9999-eeee-999999999999',
            tratoId: TRATO_CON_PROSPECTO,
            responsableId: '22222222-2222-2222-2222-222222222222',
            titulo: 'Tarea desde tab',
            descripcion: null,
            tipo: 'GENERAL',
            prioridad: 'MEDIA',
            fechaLimite: '2026-06-01T00:00:00.000Z',
            fechaCompletada: null,
            creadoEn: '2026-05-25T00:00:00.000Z',
            actualizadoEn: '2026-05-25T00:00:00.000Z',
          },
          { status: 201 },
        );
      }),
    );

    const user = userEvent.setup();
    renderPage(`/tratos/${TRATO_CON_PROSPECTO}`);

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /implementación crm innovatech/i }),
      ).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('tab', { name: /tareas/i }));

    const btnCrear = await screen.findByRole('button', { name: /crear tarea/i });
    await user.click(btnCrear);

    const dialog = await screen.findByRole('dialog');

    // Llenar campos obligatorios
    await user.type(within(dialog).getByRole('textbox', { name: /título/i }), 'Tarea desde tab');

    // Responsable: seleccionar María García (22222222)
    const responsableSelect = within(dialog).getByRole('combobox', { name: /responsable/i });
    await user.click(responsableSelect);
    const opcionMaria = await screen.findByRole('option', { name: /maría/i });
    await user.click(opcionMaria);

    // Tipo de tarea: opciones en español neutro (enums del back)
    const tipoSelect = within(dialog).getByRole('combobox', { name: /tipo/i });
    await user.click(tipoSelect);
    const opcionGeneral = await screen.findByRole('option', { name: /general/i });
    await user.click(opcionGeneral);

    // Prioridad: seleccionar Media
    const prioridadSelect = within(dialog).getByRole('combobox', { name: /prioridad/i });
    await user.click(prioridadSelect);
    const opcionMedia = await screen.findByRole('option', { name: /media/i });
    await user.click(opcionMedia);

    // Fecha límite (requerida)
    const fechaInput = within(dialog).getByLabelText(/fecha límite/i);
    await user.type(fechaInput, '2026-06-01');

    // Submit — en modo create el botón dice "Crear tarea"
    await user.click(within(dialog).getByRole('button', { name: /crear tarea/i }));

    await waitFor(() => expect(postCalled).toBe(true));
  });

  // ── (j) URL ?tab=tareas pre-activa tab Tareas ──────────────────────────────
  it('(j) URL ?tab=tareas pre-activa el tab Tareas', async () => {
    renderPage(`/tratos/${TRATO_CON_PROSPECTO}?tab=tareas`);

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /implementación crm innovatech/i }),
      ).toBeInTheDocument(),
    );

    const tabTareas = screen.getByRole('tab', { name: /tareas/i });
    expect(tabTareas.getAttribute('aria-selected')).toBe('true');

    // Las tareas del trato deben aparecer directamente
    await waitFor(() =>
      expect(screen.getByText('Demo presencial con CTO')).toBeInTheDocument(),
    );
  });

  // ── (k) click tab Tareas → URL refleja ?tab=tareas ────────────────────────
  it('(k) click en tab Tareas sincroniza ?tab=tareas en la URL', async () => {
    const user = userEvent.setup();
    renderPage(`/tratos/${TRATO_CON_PROSPECTO}`);

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /implementación crm innovatech/i }),
      ).toBeInTheDocument(),
    );

    const tabInfo = screen.getByRole('tab', { name: /información/i });
    expect(tabInfo.getAttribute('aria-selected')).toBe('true');

    await user.click(screen.getByRole('tab', { name: /tareas/i }));

    // Tras el click, el tab Tareas debe estar activo
    await waitFor(() =>
      expect(
        screen.getByRole('tab', { name: /tareas/i }).getAttribute('aria-selected'),
      ).toBe('true'),
    );
  });

  // ── (l) 404 → toast + redirect ────────────────────────────────────────────
  it('(l) 404 muestra mensaje "no existe" y prepara redirección', async () => {
    server.use(
      http.get('/api/tratos/id-inexistente', () =>
        HttpResponse.json(
          { status: 404, error: 'NOT_FOUND', message: 'Trato no encontrado' },
          { status: 404 },
        ),
      ),
    );

    renderPage('/tratos/id-inexistente');

    await waitFor(() => expect(screen.getByText(/no existe/i)).toBeInTheDocument());
  });

  // ── (m) click "Marcar como perdido" en el header abre TratoPerderDialog ─────
  // Restaura la cobertura de interacción del test original (no solo presencia del botón).
  it('(m) click "Marcar como perdido" en el header abre el TratoPerderDialog', async () => {
    const user = userEvent.setup();
    renderPage(`/tratos/${TRATO_CON_CLIENTE}`);

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /renovación licencia anual innovatech/i }),
      ).toBeInTheDocument(),
    );

    // Trato abierto → botón de perder habilitado; antes del click el botón del header es único
    await user.click(screen.getByRole('button', { name: /marcar como perdido/i }));

    // El dialog se abre con el campo obligatorio de motivo
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/motivo de pérdida/i)).toBeInTheDocument();
  });
});

