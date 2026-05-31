import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router';

import { TratosListPage } from '../pages/TratosListPage';
import { server } from '@/test/server';
import { tableroTratosFixture, fichasFixture, columnasFixture } from '@/mocks/fixtures/tableros';

function renderPage(initialEntry = '/tratos') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/tratos" element={<TratosListPage />} />
          <Route path="/tratos/:id" element={<div>Detalle del trato</div>} />
          <Route path="/tableros" element={<div>Tableros</div>} />
          <Route path="/tableros/:id" element={<div>Tablero detalle</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// Componente auxiliar que expone la URL actual en el DOM para inspección en tests de sync.
function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location-search">{location.search}</div>;
}

function renderPageWithLocation(initialEntry = '/tratos') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route
            path="/tratos"
            element={
              <>
                <TratosListPage />
                <LocationDisplay />
              </>
            }
          />
          <Route path="/tratos/:id" element={<div>Detalle del trato</div>} />
          <Route path="/tableros" element={<div>Tableros</div>} />
          <Route path="/tableros/:id" element={<div>Tablero detalle</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('TratosListPage', () => {
  it('renderiza la tabla con los tratos del fixture (en tab Lista)', async () => {
    renderPage('/tratos?tab=lista');

    await waitFor(() =>
      expect(screen.getByText('Implementación CRM Innovatech')).toBeInTheDocument(),
    );

    expect(screen.getByText('Renovación licencia anual Innovatech')).toBeInTheDocument();
    expect(screen.getByText('Consultoría procesos Maya')).toBeInTheDocument();
    // La tabla debe estar presente directamente (sin toggle)
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('nombre clickeable navega a /tratos/:id', async () => {
    const user = userEvent.setup();
    renderPage('/tratos?tab=lista');

    await waitFor(() =>
      expect(screen.getByText('Implementación CRM Innovatech')).toBeInTheDocument(),
    );

    await user.click(screen.getByText('Implementación CRM Innovatech'));

    await waitFor(() =>
      expect(screen.getByText('Detalle del trato')).toBeInTheDocument(),
    );
  });

  it('búsqueda por nombre filtra client-side', async () => {
    const user = userEvent.setup();
    renderPage('/tratos?tab=lista');

    await waitFor(() =>
      expect(screen.getByText('Implementación CRM Innovatech')).toBeInTheDocument(),
    );

    const input = screen.getByPlaceholderText(/buscar por nombre/i);
    await user.type(input, 'maya');

    await waitFor(() =>
      expect(screen.queryByText('Implementación CRM Innovatech')).not.toBeInTheDocument(),
    );
    expect(screen.getByText('Consultoría procesos Maya')).toBeInTheDocument();
  });

  it('error 500 muestra botón "Reintentar" y oculta la tabla', async () => {
    server.use(
      http.get('/api/tratos/get-all', () =>
        HttpResponse.json({ message: 'Internal server error' }, { status: 500 }),
      ),
    );

    renderPage('/tratos?tab=lista');

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument(),
    );
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('botón "Nuevo trato" abre el dialog de creación', async () => {
    const user = userEvent.setup();
    renderPage('/tratos?tab=lista');

    await waitFor(() =>
      expect(screen.getByText('Implementación CRM Innovatech')).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('button', { name: /nuevo trato/i }));

    await waitFor(() =>
      expect(screen.getByRole('dialog')).toBeInTheDocument(),
    );
    expect(screen.getByRole('heading', { name: /nuevo trato/i })).toBeInTheDocument();
  });

  it('no hay toggle kanban/tabla en la página', async () => {
    server.use(
      http.get('/api/tableros/get-all', () => HttpResponse.json([tableroTratosFixture])),
      http.get('/api/tableros/get-by-id', () => HttpResponse.json(tableroTratosFixture)),
      http.get('/api/fichas/get-all', () => HttpResponse.json(fichasFixture)),
      http.get('/api/columnas/get-all', () => HttpResponse.json(columnasFixture)),
    );

    renderPage('/tratos');

    // Tab Kanban activo por defecto — esperar que cargue
    await waitFor(() =>
      expect(
        screen.getByRole('tab', { name: /kanban/i }).getAttribute('aria-selected'),
      ).toBe('true'),
    );

    // Sin toggle de tipo button — el control de vista usa tabs (role="tab"), no buttons
    expect(screen.queryByRole('button', { name: /^kanban$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^tabla$/i })).not.toBeInTheDocument();
  });
});

// ── Tabs Lista / Kanban ────────────────────────────────────────────────────────────────────

describe('TratosListPage — tabs Lista/Kanban', () => {
  it('(tab-a) render inicial sin ?tab= → tab "Kanban" activo por defecto', async () => {
    server.use(
      http.get('/api/tableros/get-all', () => HttpResponse.json([tableroTratosFixture])),
      http.get('/api/tableros/get-by-id', () => HttpResponse.json(tableroTratosFixture)),
      http.get('/api/fichas/get-all', () => HttpResponse.json(fichasFixture)),
      http.get('/api/columnas/get-all', () => HttpResponse.json(columnasFixture)),
    );

    renderPage('/tratos');

    // Tab Kanban debe estar activo por defecto
    await waitFor(() =>
      expect(
        screen.getByRole('tab', { name: /kanban/i }).getAttribute('aria-selected'),
      ).toBe('true'),
    );

    // Tab Lista presente pero no activo
    const tabLista = screen.getByRole('tab', { name: /lista/i });
    expect(tabLista.getAttribute('aria-selected')).toBe('false');

    // La tabla NO debe ser visible (estamos en Kanban)
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('(tab-b) click en tab "Lista" → tabla visible, URL con ?tab=lista', async () => {
    const user = userEvent.setup();

    server.use(
      http.get('/api/tableros/get-all', () => HttpResponse.json([tableroTratosFixture])),
      http.get('/api/tableros/get-by-id', () => HttpResponse.json(tableroTratosFixture)),
      http.get('/api/fichas/get-all', () => HttpResponse.json(fichasFixture)),
      http.get('/api/columnas/get-all', () => HttpResponse.json(columnasFixture)),
    );

    renderPageWithLocation('/tratos');

    // Esperar que cargue y esté en Kanban
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

    // URL debe tener ?tab=lista
    await waitFor(() => {
      const search = screen.getByTestId('location-search').textContent ?? '';
      const params = new URLSearchParams(search);
      expect(params.get('tab')).toBe('lista');
    });

    // La tabla de tratos debe ser visible
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());
  });

  it('(tab-c) click en tab "Kanban" desde Lista → tabla no visible, URL limpia sin ?tab=', async () => {
    const user = userEvent.setup();

    server.use(
      http.get('/api/tableros/get-all', () => HttpResponse.json([tableroTratosFixture])),
      http.get('/api/tableros/get-by-id', () => HttpResponse.json(tableroTratosFixture)),
      http.get('/api/fichas/get-all', () => HttpResponse.json(fichasFixture)),
      http.get('/api/columnas/get-all', () => HttpResponse.json(columnasFixture)),
    );

    renderPageWithLocation('/tratos?tab=lista');

    // Inicialmente tab Lista activo
    await waitFor(() =>
      expect(screen.getByRole('table')).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('tab', { name: /kanban/i }));

    // Tab Kanban ahora activo
    await waitFor(() =>
      expect(
        screen.getByRole('tab', { name: /kanban/i }).getAttribute('aria-selected'),
      ).toBe('true'),
    );

    // URL debe quedar limpia (sin ?tab= — kanban es el fallback)
    await waitFor(() =>
      expect(screen.getByTestId('location-search').textContent).toBe(''),
    );

    // La tabla ya no es visible
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('(tab-d) URL con ?tab=lista al cargar → tab "Lista" activo desde inicio', async () => {
    renderPage('/tratos?tab=lista');

    // Tab Lista debe estar activo desde el inicio
    await waitFor(() =>
      expect(screen.getByText('Implementación CRM Innovatech')).toBeInTheDocument(),
    );

    const tabLista = screen.getByRole('tab', { name: /lista/i });
    expect(tabLista.getAttribute('aria-selected')).toBe('true');

    // Tabla visible
    expect(screen.getByRole('table')).toBeInTheDocument();

    // Tab Kanban no activo
    expect(screen.getByRole('tab', { name: /kanban/i }).getAttribute('aria-selected')).toBe('false');
  });
});
