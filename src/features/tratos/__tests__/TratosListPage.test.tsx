import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router';

import { TratosListPage } from '../pages/TratosListPage';
import { server } from '@/test/server';
import { tratosFixture } from '@/mocks/fixtures/tratos';

// ─── Helper de render con initialEntries configurable ────────────────────────
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
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// ─── Tests previos ajustados para el nuevo default (kanban) ──────────────────
describe('TratosListPage', () => {
  // AJUSTADO: La tabla es ahora la vista secundaria (?vista=tabla).
  // Navegamos a ?vista=tabla para encontrar las filas de la tabla.
  it('renderiza la tabla con los tratos del fixture (vista=tabla)', async () => {
    renderPage('/tratos?vista=tabla');

    await waitFor(() =>
      expect(screen.getByText('Implementación CRM Innovatech')).toBeInTheDocument(),
    );

    expect(screen.getByText('Renovación licencia anual Innovatech')).toBeInTheDocument();
    expect(screen.getByText('Consultoría procesos Maya')).toBeInTheDocument();
  });

  // AJUSTADO: click en nombre funciona tanto en kanban como en tabla;
  // usamos vista=tabla para asegurar el comportamiento de la tabla (link de fila).
  it('nombre clickeable navega a /tratos/:id (vista=tabla)', async () => {
    const user = userEvent.setup();
    renderPage('/tratos?vista=tabla');

    await waitFor(() =>
      expect(screen.getByText('Implementación CRM Innovatech')).toBeInTheDocument(),
    );

    await user.click(screen.getByText('Implementación CRM Innovatech'));

    await waitFor(() =>
      expect(screen.getByText('Detalle del trato')).toBeInTheDocument(),
    );
  });

  // AJUSTADO: El filtro de búsqueda client-side aplica sobre TratosTable.
  // Navegamos a ?vista=tabla para usar la búsqueda sobre la tabla.
  it('búsqueda por nombre filtra client-side (vista=tabla)', async () => {
    const user = userEvent.setup();
    renderPage('/tratos?vista=tabla');

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

  it('error 500 muestra botón reintentar', async () => {
    server.use(
      http.get('/api/tratos', () =>
        HttpResponse.json(
          { status: 500, error: 'INTERNAL_SERVER_ERROR', message: 'Error interno' },
          { status: 500 },
        ),
      ),
    );

    renderPage();

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument(),
    );
  });

  it('botón "Nuevo trato" abre el dialog de creación', async () => {
    const user = userEvent.setup();
    renderPage('/tratos?vista=tabla');

    await waitFor(() =>
      expect(screen.getByText('Implementación CRM Innovatech')).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('button', { name: /nuevo trato/i }));

    await waitFor(() =>
      expect(screen.getByRole('dialog')).toBeInTheDocument(),
    );
    expect(screen.getByRole('heading', { name: /nuevo trato/i })).toBeInTheDocument();
  });

  // ─── Lote 5: Tests nuevos — toggle kanban/tabla ───────────────────────────

  it('5.1a — /tratos sin query param muestra kanban por defecto', async () => {
    renderPage('/tratos');

    // KanbanBoard renderiza columnas con headers "Abierto (N)", "Ganado (N)", "Perdido (N)"
    await waitFor(() => {
      expect(screen.getByText(/^Abierto \(\d+\)$/)).toBeInTheDocument();
    });

    // La tabla (TratosTable) no debe estar presente — no hay <table> en el DOM
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('5.1b — /tratos?vista=tabla muestra la tabla y no el kanban', async () => {
    renderPage('/tratos?vista=tabla');

    // Esperar que la tabla cargue (TratosTable usa <table>)
    await waitFor(() =>
      expect(screen.getByText('Implementación CRM Innovatech')).toBeInTheDocument(),
    );

    // La tabla debe existir
    expect(screen.getByRole('table')).toBeInTheDocument();

    // Los headers del kanban no deben estar presentes
    expect(screen.queryByText(/^Abierto \(\d+\)$/)).not.toBeInTheDocument();
  });

  it('5.1c — click en botón "Tabla" cambia a vista tabla', async () => {
    const user = userEvent.setup();
    renderPage('/tratos');

    // Esperar que el kanban cargue
    await waitFor(() =>
      expect(screen.getByText(/^Abierto \(\d+\)$/)).toBeInTheDocument(),
    );

    // El toggle debe estar visible — botón "Tabla"
    const botonTabla = screen.getByRole('button', { name: /^tabla$/i });
    await user.click(botonTabla);

    // Después del click, la tabla debe aparecer
    await waitFor(() =>
      expect(screen.getByRole('table')).toBeInTheDocument(),
    );

    // El kanban no debe estar visible
    expect(screen.queryByText(/^Abierto \(\d+\)$/)).not.toBeInTheDocument();
  });

  it('5.1d — click en botón "Kanban" desde tabla vuelve al kanban', async () => {
    const user = userEvent.setup();
    renderPage('/tratos?vista=tabla');

    // Esperar que la tabla cargue
    await waitFor(() =>
      expect(screen.getByText('Implementación CRM Innovatech')).toBeInTheDocument(),
    );

    // El toggle debe estar visible — botón "Kanban"
    const botonKanban = screen.getByRole('button', { name: /^kanban$/i });
    await user.click(botonKanban);

    // El kanban debe aparecer
    await waitFor(() =>
      expect(screen.getByText(/^Abierto \(\d+\)$/)).toBeInTheDocument(),
    );

    // La tabla no debe estar visible
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('5.1e — filtro por estado "ganado" estrecha las tarjetas del kanban', async () => {
    const user = userEvent.setup();

    // Override del handler para responder a ?estado=ganado
    server.use(
      http.get('/api/tratos', ({ request }) => {
        const url = new URL(request.url);
        const estado = url.searchParams.get('estado');
        if (estado === 'ganado') {
          return HttpResponse.json(
            tratosFixture.filter((t) => t.estado === 'ganado'),
          );
        }
        // Sin filtro: devuelve todos
        return HttpResponse.json(tratosFixture);
      }),
    );

    renderPage('/tratos');

    // Esperar que el kanban cargue con todos los tratos
    await waitFor(() => {
      expect(screen.getByText('Abierto (3)')).toBeInTheDocument();
      expect(screen.getByText('Ganado (1)')).toBeInTheDocument();
    });

    // El trato de estado 'perdido' está visible antes del filtro
    expect(screen.getByText('Automatización logística Maya')).toBeInTheDocument();

    // Abrir el select de Estado y elegir "Ganado"
    const selectEstado = screen.getByRole('combobox', { name: /estado/i });
    await user.click(selectEstado);
    const opcionGanado = await screen.findByRole('option', { name: /^ganado$/i });
    await user.click(opcionGanado);

    // Después del filtro, solo los tratos ganados deben aparecer en el kanban
    await waitFor(() => {
      expect(screen.getByText('Ganado (1)')).toBeInTheDocument();
    });

    // Los tratos abiertos no deben aparecer en el kanban
    await waitFor(() => {
      expect(screen.queryByText('Implementación CRM Innovatech')).not.toBeInTheDocument();
      expect(screen.queryByText('Automatización logística Maya')).not.toBeInTheDocument();
    });
  });

  // ─── Bugfix: las opciones del filtro de cliente se derivan del dataset COMPLETO ───
  // Regresión reportada en smoke manual: al elegir el cliente 1, el cliente 2
  // desaparecía del dropdown (había que pasar por "Todos" para volver a verlo),
  // porque las opciones se derivaban de la lista YA filtrada.
  it('conserva todos los clientes con tratos en el filtro tras elegir uno', async () => {
    const user = userEvent.setup();

    // El backend filtra por cliente_id (como en producción). Sin este override,
    // el handler default devuelve todos y el bug no se reproduce.
    server.use(
      http.get('/api/tratos', ({ request }) => {
        const clienteId = new URL(request.url).searchParams.get('cliente_id');
        const data = clienteId
          ? tratosFixture.filter((t) => t.cliente_id === clienteId)
          : tratosFixture;
        return HttpResponse.json(data);
      }),
    );

    renderPage('/tratos');

    await waitFor(() =>
      expect(screen.getByText(/^Abierto \(\d+\)$/)).toBeInTheDocument(),
    );

    // Ambos clientes con tratos aparecen inicialmente (Ana=c1111111, Diego=c2222222).
    const selectCliente = screen.getByRole('combobox', { name: /cliente/i });
    await user.click(selectCliente);
    expect(await screen.findByRole('option', { name: 'Ana Rodríguez' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Diego Vargas' })).toBeInTheDocument();

    // Filtrar por Ana Rodríguez.
    await user.click(screen.getByRole('option', { name: 'Ana Rodríguez' }));

    // El refetch filtrado deja solo el trato de Ana; el de Diego desaparece del board.
    await waitFor(() =>
      expect(screen.queryByText('Consultoría procesos Maya')).not.toBeInTheDocument(),
    );

    // Reabrir el select: Diego Vargas DEBE seguir disponible (el bug lo eliminaba).
    await user.click(screen.getByRole('combobox', { name: /cliente/i }));
    expect(await screen.findByRole('option', { name: 'Diego Vargas' })).toBeInTheDocument();
  });
});

