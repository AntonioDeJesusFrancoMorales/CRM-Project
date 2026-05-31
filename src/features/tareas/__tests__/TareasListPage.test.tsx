// Tests de TareasListPage — filtros client-side (W1 fix) + enums del back (W2 fix).
// Los filtros se aplican sobre el array completo en useMemo — NO hay query params al back.
// Tabs Lista/Kanban con useTabSync + coexistencia ?tab= y ?responsable_id=.

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router';

import { TareasListPage } from '../pages/TareasListPage';
import { server } from '@/test/server';
import { tableroTareasFixture, fichasFixture, columnasFixture } from '@/mocks/fixtures/tableros';

function renderPage(initialPath = '/tareas') {
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
          <Route path="/tareas" element={<TareasListPage />} />
          <Route path="/tareas/:id" element={<div>Detalle de la tarea</div>} />
          <Route path="/tableros" element={<div>Tableros</div>} />
          <Route path="/tableros/:id" element={<div>Tablero detalle</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// Componente auxiliar que expone la URL actual en el DOM para inspección.
function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location-search">{location.search}</div>;
}

function renderPageWithLocation(initialPath = '/tareas') {
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
          <Route
            path="/tareas"
            element={
              <>
                <TareasListPage />
                <LocationDisplay />
              </>
            }
          />
          <Route path="/tareas/:id" element={<div>Detalle de la tarea</div>} />
          <Route path="/tableros" element={<div>Tableros</div>} />
          <Route path="/tableros/:id" element={<div>Tablero detalle</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('TareasListPage — render y tabla', () => {
  it('(a) renderiza filas con tareas del fixture', async () => {
    renderPage();

    // El fixture tiene 7 tareas; comprobamos algunas
    await waitFor(() => {
      expect(screen.getByText('Demo presencial con CTO')).toBeInTheDocument();
    });
    expect(screen.getByText('Llamada de seguimiento post-demo')).toBeInTheDocument();
  });

  it('(b) título clickeable navega a /tareas/:id', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Demo presencial con CTO')).toBeInTheDocument();
    });

    const tituloBtn = screen.getByRole('button', { name: /demo presencial con cto/i });
    await user.click(tituloBtn);

    await waitFor(() => {
      expect(screen.getByText('Detalle de la tarea')).toBeInTheDocument();
    });
  });
});

describe('TareasListPage — filtros client-side (NO query params al back)', () => {
  it('(c) filtro prioridad aplica client-side — NO envía query param ?prioridad= al back', async () => {
    const user = userEvent.setup();
    let capturedUrl = '';

    server.use(
      http.get('/api/tareas/get-all', ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json([]);
      }),
    );

    renderPage();

    // Esperar la carga inicial
    await waitFor(() => expect(capturedUrl).toContain('/api/tareas/get-all'));

    // Guardar la URL inicial (sin params)
    const urlInicial = capturedUrl;

    // Cambiar filtro prioridad
    const selectPrioridad = screen.getByRole('combobox', { name: /prioridad/i });
    await user.click(selectPrioridad);
    const opcionAlta = await screen.findByRole('option', { name: /alta/i });
    await user.click(opcionAlta);

    // La URL NO debe haber cambiado — el filtrado es client-side
    expect(capturedUrl).toBe(urlInicial);
    // La URL NO debe tener query params
    const url = new URL(capturedUrl);
    expect(url.search).toBe('');
  });

  it('(d) filtro responsable aplica client-side — NO envía query param ?responsable_id= al back', async () => {
    const user = userEvent.setup();
    let requestCount = 0;
    let lastUrl = '';

    server.use(
      http.get('/api/tareas/get-all', ({ request }) => {
        requestCount++;
        lastUrl = request.url;
        return HttpResponse.json([]);
      }),
    );

    renderPage();

    // Esperar la carga inicial (1 request)
    await waitFor(() => expect(requestCount).toBeGreaterThan(0));
    const initialCount = requestCount;

    // Cambiar filtro responsable
    const selectResponsable = screen.getByRole('combobox', { name: /responsable/i });
    await user.click(selectResponsable);
    const opcionAdmin = await screen.findByRole('option', { name: /antonio franco/i });
    await user.click(opcionAdmin);

    // Dar tiempo para refetches potenciales
    await new Promise((r) => setTimeout(r, 100));

    // El número de requests NO debe aumentar (no hace nueva llamada al back)
    expect(requestCount).toBe(initialCount);
    // La URL no debe tener query params
    const url = new URL(lastUrl);
    expect(url.search).toBe('');
  });

  it('(e) filtro estado aplica client-side — NO envía query param ?estado= al back', async () => {
    const user = userEvent.setup();
    let capturedUrls: string[] = [];

    server.use(
      http.get('/api/tareas/get-all', ({ request }) => {
        capturedUrls.push(request.url);
        return HttpResponse.json([]);
      }),
    );

    renderPage();

    await waitFor(() => expect(capturedUrls.length).toBeGreaterThan(0));

    const selectEstado = screen.getByRole('combobox', { name: /estado/i });
    await user.click(selectEstado);
    const opcionCompletada = await screen.findByRole('option', { name: /completada/i });
    await user.click(opcionCompletada);

    await new Promise((r) => setTimeout(r, 100));

    // Todas las URLs capturadas deben ser sin query params
    for (const capturedUrl of capturedUrls) {
      const url = new URL(capturedUrl);
      expect(url.search).toBe('');
    }
  });
});

describe('TareasListPage — búsqueda client-side', () => {
  it('(f) búsqueda por título filtra client-side', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Demo presencial con CTO')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/buscar por título/i);
    await user.type(input, 'llamada');

    await waitFor(() => {
      expect(screen.queryByText('Demo presencial con CTO')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Llamada de seguimiento post-demo')).toBeInTheDocument();
  });
});

describe('TareasListPage — error y estados de carga', () => {
  it('(g) error 500 muestra mensaje y botón "Reintentar"', async () => {
    server.use(
      http.get('/api/tareas/get-all', () =>
        HttpResponse.json(
          { status: 500, error: 'INTERNAL_SERVER_ERROR', message: 'Error interno' },
          { status: 500 },
        ),
      ),
    );

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
    });
  });
});

describe('TareasListPage — creación (enums del back)', () => {
  it('(h) botón "Nueva tarea" abre TareaCreateDialog con Select de trato editable', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Demo presencial con CTO')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /nueva tarea/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: /nueva tarea/i })).toBeInTheDocument();

    // El Select de trato NO debe estar disabled (modo global = editable)
    await waitFor(() => {
      const selectTrato = screen.getByRole('combobox', { name: /trato/i });
      expect(selectTrato).not.toBeDisabled();
    });
  });

  it('(i) submit de creación envía enums del back (camelCase, GENERAL/MEDIA)', async () => {
    const user = userEvent.setup();
    const postSpy = vi.fn();

    server.use(
      http.post('/api/tareas/create', async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        postSpy({ tratoId: body['tratoId'], body });
        return HttpResponse.json(
          {
            id: 'new-tarea-id',
            tratoId: body['tratoId'],
            responsableId: body['responsableId'],
            titulo: body['titulo'],
            descripcion: null,
            tipo: 'GENERAL',
            prioridad: 'MEDIA',
            fechaLimite: '2026-06-01T00:00:00.000Z',
            fechaCompletada: null,
            creadoEn: '2026-05-24T00:00:00.000Z',
            actualizadoEn: '2026-05-24T00:00:00.000Z',
          },
          { status: 201 },
        );
      }),
    );

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Demo presencial con CTO')).toBeInTheDocument();
    });

    // Abrir dialog
    await user.click(screen.getByRole('button', { name: /nueva tarea/i }));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

    // Esperar que los Selects de datos carguen
    await waitFor(() => {
      const selectTrato = screen.getByRole('combobox', { name: /trato/i });
      expect(selectTrato).not.toBeDisabled();
    });

    // Seleccionar trato
    const selectTrato = screen.getByRole('combobox', { name: /trato/i });
    await user.click(selectTrato);
    const tratoOption = await screen.findByRole('option', { name: /implementación crm innovatech/i });
    await user.click(tratoOption);

    // Completar título
    await user.type(screen.getByLabelText(/título/i), 'Demo con cliente');

    // Seleccionar tipo — opciones en español, value = enum del back
    const selectTipo = screen.getByRole('combobox', { name: /tipo/i });
    await user.click(selectTipo);
    const tipoOption = await screen.findByRole('option', { name: /general/i });
    await user.click(tipoOption);

    // Seleccionar prioridad — opciones en español, value = enum del back
    const selectPrioridad = screen.getByRole('combobox', { name: /prioridad/i });
    await user.click(selectPrioridad);
    const prioridadOption = await screen.findByRole('option', { name: /media/i });
    await user.click(prioridadOption);

    // Seleccionar responsable
    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /responsable/i })).not.toBeDisabled();
    });
    const selectResponsable = screen.getByRole('combobox', { name: /responsable/i });
    await user.click(selectResponsable);
    const responsableOption = await screen.findByRole('option', { name: /antonio franco/i });
    await user.click(responsableOption);

    // Fecha límite (requerida)
    const fechaInput = screen.getByLabelText(/fecha límite/i);
    await user.type(fechaInput, '2026-06-01');

    // Submit
    await user.click(screen.getByRole('button', { name: /crear tarea/i }));

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            titulo: 'Demo con cliente',
            tipo: 'GENERAL',     // enum del back, NO 'demo'
            prioridad: 'MEDIA',  // enum del back, NO 1
          }),
        }),
      );
    });
  });
});

// ── Tabs Lista / Kanban ────────────────────────────────────────────────────────────────────

describe('TareasListPage — tabs Lista/Kanban', () => {
  it('(tab-a) render inicial sin ?tab= → tab "Lista" activo, filtros y tabla visibles', async () => {
    renderPage('/tareas');

    await waitFor(() =>
      expect(screen.getByText('Demo presencial con CTO')).toBeInTheDocument(),
    );

    // Tab Lista activo
    const tabLista = screen.getByRole('tab', { name: /lista/i });
    expect(tabLista.getAttribute('aria-selected')).toBe('true');

    // La tabla está visible (al menos una fila con datos)
    expect(screen.getByRole('table')).toBeInTheDocument();

    // Los filtros deben estar visibles dentro del tab Lista
    expect(screen.getByRole('combobox', { name: /estado/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /prioridad/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /responsable/i })).toBeInTheDocument();

    // Tab Kanban presente pero no activo
    const tabKanban = screen.getByRole('tab', { name: /kanban/i });
    expect(tabKanban.getAttribute('aria-selected')).toBe('false');
  });

  it('(tab-b) click en tab "Kanban" → KanbanTabContent visible, filtros y tabla no visibles', async () => {
    const user = userEvent.setup();

    // Hay 1 tablero TAREAS → KanbanTabContent muestra KanbanBoardEmbebido
    server.use(
      http.get('/api/tableros/get-all', () => HttpResponse.json([tableroTareasFixture])),
      http.get('/api/tableros/get-by-id', () => HttpResponse.json(tableroTareasFixture)),
      http.get('/api/fichas/get-all', () => HttpResponse.json(fichasFixture)),
      http.get('/api/columnas/get-all', () => HttpResponse.json(columnasFixture)),
    );

    renderPage('/tareas');

    await waitFor(() =>
      expect(screen.getByText('Demo presencial con CTO')).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('tab', { name: /kanban/i }));

    // Tab Kanban activo
    await waitFor(() =>
      expect(
        screen.getByRole('tab', { name: /kanban/i }).getAttribute('aria-selected'),
      ).toBe('true'),
    );

    // La tabla ya no es visible
    expect(screen.queryByRole('table')).not.toBeInTheDocument();

    // Los filtros ya no son visibles (están dentro del TabsContent "lista")
    expect(screen.queryByRole('combobox', { name: /estado/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: /prioridad/i })).not.toBeInTheDocument();
  });

  it('(tab-c) click en tab "Lista" desde Kanban → tabla visible, URL limpia sin ?tab=', async () => {
    const user = userEvent.setup();

    server.use(
      http.get('/api/tableros/get-all', () => HttpResponse.json([tableroTareasFixture])),
      http.get('/api/tableros/get-by-id', () => HttpResponse.json(tableroTareasFixture)),
      http.get('/api/fichas/get-all', () => HttpResponse.json(fichasFixture)),
      http.get('/api/columnas/get-all', () => HttpResponse.json(columnasFixture)),
    );

    renderPageWithLocation('/tareas?tab=kanban');

    // Inicialmente tab Kanban activo
    await waitFor(() =>
      expect(
        screen.getByRole('tab', { name: /kanban/i }).getAttribute('aria-selected'),
      ).toBe('true'),
    );

    await user.click(screen.getByRole('tab', { name: /lista/i }));

    // Tab Lista ahora activo
    await waitFor(() =>
      expect(
        screen.getByRole('tab', { name: /lista/i }).getAttribute('aria-selected'),
      ).toBe('true'),
    );

    // URL debe quedar limpia (sin ?tab=)
    await waitFor(() =>
      expect(screen.getByTestId('location-search').textContent).toBe(''),
    );

    // La tabla vuelve a ser visible
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());
  });

  it('(tab-d) URL con ?tab=kanban al cargar → tab "Kanban" activo, filtros no visibles', async () => {
    server.use(
      http.get('/api/tableros/get-all', () => HttpResponse.json([tableroTareasFixture])),
      http.get('/api/tableros/get-by-id', () => HttpResponse.json(tableroTareasFixture)),
      http.get('/api/fichas/get-all', () => HttpResponse.json(fichasFixture)),
      http.get('/api/columnas/get-all', () => HttpResponse.json(columnasFixture)),
    );

    renderPage('/tareas?tab=kanban');

    // Tab Kanban activo desde inicio
    await waitFor(() =>
      expect(
        screen.getByRole('tab', { name: /kanban/i }).getAttribute('aria-selected'),
      ).toBe('true'),
    );

    // Filtros no visibles (están dentro del tab Lista que no está activo)
    expect(screen.queryByRole('combobox', { name: /estado/i })).not.toBeInTheDocument();

    // Tabla no visible
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});

// ── Coexistencia ?tab= y ?responsable_id= ─────────────────────────────────────────────────

describe('TareasListPage — coexistencia ?tab= y ?responsable_id=', () => {
  it('(coexi-a) ?responsable_id= persiste al cambiar a tab Kanban', async () => {
    const user = userEvent.setup();

    server.use(
      http.get('/api/tableros/get-all', () => HttpResponse.json([tableroTareasFixture])),
      http.get('/api/tableros/get-by-id', () => HttpResponse.json(tableroTareasFixture)),
      http.get('/api/fichas/get-all', () => HttpResponse.json(fichasFixture)),
      http.get('/api/columnas/get-all', () => HttpResponse.json(columnasFixture)),
    );

    renderPageWithLocation('/tareas?responsable_id=user-1');

    await waitFor(() =>
      expect(screen.getByRole('tab', { name: /lista/i })).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('tab', { name: /kanban/i }));

    // Después del click, la URL debe contener ambos params
    await waitFor(() => {
      const search = screen.getByTestId('location-search').textContent ?? '';
      const params = new URLSearchParams(search);
      expect(params.get('tab')).toBe('kanban');
      expect(params.get('responsable_id')).toBe('user-1');
    });
  });

  it('(coexi-b) ?responsable_id= persiste al volver al tab Lista desde Kanban', async () => {
    const user = userEvent.setup();

    server.use(
      http.get('/api/tableros/get-all', () => HttpResponse.json([tableroTareasFixture])),
      http.get('/api/tableros/get-by-id', () => HttpResponse.json(tableroTareasFixture)),
      http.get('/api/fichas/get-all', () => HttpResponse.json(fichasFixture)),
      http.get('/api/columnas/get-all', () => HttpResponse.json(columnasFixture)),
    );

    renderPageWithLocation('/tareas?tab=kanban&responsable_id=user-1');

    // Inicialmente tab Kanban activo
    await waitFor(() =>
      expect(
        screen.getByRole('tab', { name: /kanban/i }).getAttribute('aria-selected'),
      ).toBe('true'),
    );

    await user.click(screen.getByRole('tab', { name: /lista/i }));

    // Al volver a Lista la URL solo debe tener ?responsable_id= (sin ?tab=)
    await waitFor(() => {
      const search = screen.getByTestId('location-search').textContent ?? '';
      const params = new URLSearchParams(search);
      expect(params.get('tab')).toBeNull();
      expect(params.get('responsable_id')).toBe('user-1');
    });
  });

  it('(coexi-c) carga con ?tab=kanban&responsable_id=user-1 → tab Kanban activo', async () => {
    server.use(
      http.get('/api/tableros/get-all', () => HttpResponse.json([tableroTareasFixture])),
      http.get('/api/tableros/get-by-id', () => HttpResponse.json(tableroTareasFixture)),
      http.get('/api/fichas/get-all', () => HttpResponse.json(fichasFixture)),
      http.get('/api/columnas/get-all', () => HttpResponse.json(columnasFixture)),
    );

    renderPageWithLocation('/tareas?tab=kanban&responsable_id=user-1');

    // Tab Kanban activo desde carga inicial
    await waitFor(() =>
      expect(
        screen.getByRole('tab', { name: /kanban/i }).getAttribute('aria-selected'),
      ).toBe('true'),
    );

    // La URL actual conserva ambos params al inicio
    const search = screen.getByTestId('location-search').textContent ?? '';
    const params = new URLSearchParams(search);
    expect(params.get('tab')).toBe('kanban');
    expect(params.get('responsable_id')).toBe('user-1');
  });
});
