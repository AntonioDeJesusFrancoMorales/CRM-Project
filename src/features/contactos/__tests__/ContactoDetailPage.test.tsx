import { describe, it, expect } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router';
import { TooltipProvider } from '@/components/ui/tooltip';

import { ContactoDetailPage } from '../pages/ContactoDetailPage';
import { server } from '@/test/server';
import { tableroTratosFixture } from '@/mocks/fixtures/tableros';
import { tratosFixture } from '@/mocks/fixtures/tratos';
import type { Ficha } from '@/features/kanban/schemas/ficha.schema';

function renderWithRouter(
  initialPath: string,
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  }),
) {
  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <MemoryRouter initialEntries={[initialPath]}>
            <Routes>
              <Route path="/contactos" element={<div>Listado de contactos</div>} />
              <Route path="/contactos/:id" element={<ContactoDetailPage />} />
              <Route path="/tratos/:id" element={<div>Detalle de trato</div>} />
            </Routes>
          </MemoryRouter>
        </TooltipProvider>
      </QueryClientProvider>,
    ),
  };
}

describe('ContactoDetailPage', () => {
  it('muestra nombre y datos del contacto con id válido', async () => {
    // c0222222 = Martín PROSPECTO
    renderWithRouter('/contactos/c0222222-cccc-0002-cccc-000000000002');

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /martín/i })).toBeInTheDocument(),
    );

    expect(screen.getByRole('tab', { name: /resumen 360/i })).toBeInTheDocument();
    // Tab Info debe existir
    expect(screen.getByRole('tab', { name: /info/i })).toBeInTheDocument();
  });

  it('mantiene bloqueada la eliminación mientras se actualizan tratos cacheados', async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false },
      },
    });
    queryClient.setQueryData(['tratos'], tratosFixture);

    let tratosRequestCount = 0;
    let releaseTratos!: () => void;
    const tratosPending = new Promise<void>((resolve) => {
      releaseTratos = resolve;
    });

    server.use(
      http.get('/api/tratos/get-all', async () => {
        tratosRequestCount += 1;
        await tratosPending;
        return HttpResponse.json(tratosFixture);
      }),
    );

    renderWithRouter('/contactos/c1111111-cccc-1111-cccc-111111111111', queryClient);

    await waitFor(() => expect(screen.getByRole('heading', { name: /ana/i })).toBeInTheDocument());
    await waitFor(() => expect(tratosRequestCount).toBe(1));
    await user.click(screen.getByRole('button', { name: 'Eliminar' }));

    const loadingButton = await screen.findByRole('button', { name: /cargando/i });
    expect(loadingButton).toBeDisabled();

    await act(async () => {
      releaseTratos();
    });
    await waitFor(() => expect(queryClient.isFetching({ queryKey: ['tratos'] })).toBe(0));
    expect(screen.getByRole('button', { name: /^eliminar$/i })).not.toBeDisabled();
  });

  it('el tab Info renderiza los campos del contacto', async () => {
    const user = userEvent.setup();
    renderWithRouter('/contactos/c0222222-cccc-0002-cccc-000000000002');

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /martín/i })).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('tab', { name: /info/i }));

    // Correo visible en tab Info
    expect(screen.getByText('martin.gutierrez@example.com')).toBeInTheDocument();
  });

  it('el tab Resumen 360 muestra relaciones del contacto', async () => {
    renderWithRouter('/contactos/c1111111-cccc-1111-cccc-111111111111');

    await waitFor(() => expect(screen.getByRole('heading', { name: /ana/i })).toBeInTheDocument());

    await waitFor(() => expect(screen.getByText('Innovatech Solutions')).toBeInTheDocument());
    expect(screen.getByText('Renovación licencia anual Innovatech')).toBeInTheDocument();
    expect(screen.getByText('Preparar propuesta de renovación')).toBeInTheDocument();
  });

  it('el tab Tratos muestra tratos del contacto', async () => {
    const user = userEvent.setup();
    // c0333333 = Sofía ACTIVO con empresa Innovatech
    renderWithRouter('/contactos/c0333333-cccc-0003-cccc-000000000003');

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /sofía/i })).toBeInTheDocument(),
    );

    const tabTratos = screen.getByRole('tab', { name: /tratos/i });
    expect(tabTratos).toBeInTheDocument();
    await user.click(tabTratos);

    // El tab Tratos debe renderizarse (puede estar vacío o con tratos)
    await waitFor(() =>
      expect(screen.getByRole('tabpanel', { name: /tratos/i })).toBeInTheDocument(),
    );
  });

  it('el tab Tratos permite navegar al detalle del trato', async () => {
    const user = userEvent.setup();
    renderWithRouter('/contactos/c1111111-cccc-1111-cccc-111111111111');

    await waitFor(() => expect(screen.getByRole('heading', { name: /ana/i })).toBeInTheDocument());

    await user.click(screen.getByRole('tab', { name: /tratos/i }));
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /renovación licencia anual innovatech/i }),
      ).toBeInTheDocument(),
    );
    await user.click(screen.getByRole('button', { name: /renovación licencia anual innovatech/i }));

    await waitFor(() => expect(screen.getByText('Detalle de trato')).toBeInTheDocument());
  });

  it('redirige a /contactos cuando el id devuelve 404', async () => {
    server.use(http.get('/api/contactos/get-all', () => HttpResponse.json([])));

    renderWithRouter('/contactos/id-inexistente');

    await waitFor(() => expect(screen.getByText('Listado de contactos')).toBeInTheDocument(), {
      timeout: 3000,
    });
  });

  it('muestra un error genérico cuando el detalle falla con otro estado HTTP', async () => {
    server.use(
      http.get('/api/contactos/get-by-id', () =>
        HttpResponse.json(
          { status: 500, error: 'INTERNAL_SERVER_ERROR', message: 'Error interno' },
          { status: 500 },
        ),
      ),
    );

    renderWithRouter('/contactos/cualquier-id');

    await waitFor(() => {
      expect(screen.getByText('No fue posible cargar el contacto.')).toBeInTheDocument();
    });
    expect(screen.queryByText(/este contacto no existe/i)).not.toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // W1: tieneTratosActivos derivado de columna.estadoTrato (B8)
  // El estado ya no viene de trato.estado sino de deriveEstadoTrato(tratoId, fichas, columnas)
  // ---------------------------------------------------------------------------

  it('[W1] INACTIVO habilitado aunque el trato tenga ficha en columna ABIERTO (regla suspendida)', async () => {
    // c1111111 (Ana, ACTIVO) tiene tratos d2222222 y d4444444 con ficha en columna "ABIERTO".
    // El back eliminó el estado tipado del trato, así que el guard de INACTIVO está
    // suspendido: deriveEstadoTrato ya no puede devolver 'ABIERTO' → INACTIVO queda habilitado.
    const user = userEvent.setup();
    renderWithRouter('/contactos/c1111111-cccc-1111-cccc-111111111111');

    await waitFor(() => expect(screen.getByRole('heading', { name: /ana/i })).toBeInTheDocument());

    await user.click(screen.getByRole('tab', { name: /info/i }));
    await user.click(screen.getByRole('combobox'));

    // Con la regla suspendida, INACTIVO ya NO se deshabilita por tratos.
    await waitFor(() => {
      const allOptions = screen.getAllByRole('option', { hidden: true });
      const inactivoOpt = allOptions.find((o) => /inactivo/i.test(o.textContent ?? ''));
      expect(inactivoOpt).toBeDefined();
      expect(inactivoOpt).not.toHaveAttribute('data-disabled');
    });
  });

  it('[W1] INACTIVO habilitado si todos los tratos del contacto tienen ficha en GANADO o PERDIDO', async () => {
    // contacto c2222222 (Diego, ACTIVO) tiene trato d3333333
    // Override de fichas: d3333333 en columna 'ganados' (estadoTrato: 'GANADO')
    // Con el bug (tieneTratosActivos = length > 0): hay 1 trato → tieneTratosActivos=true → INACTIVO disabled.
    // Con el fix correcto (deriveEstadoTrato): estado='GANADO' ≠ 'ABIERTO' → tieneTratosActivos=false → INACTIVO habilitado.
    // Este test DEBE FALLAR con el bug y pasar con el fix.
    const columnaGanadosId = tableroTratosFixture.columnas[2]!.id; // estadoTrato: 'GANADO'
    const fichaGanado: Ficha = {
      id: 'h9999999-hhhh-9999-hhhh-999999999999',
      columnaId: columnaGanadosId,
      tipoFicha: 'TRATO',
      tratoId: 'd3333333-dddd-3333-dddd-333333333333',
      tareaId: null,
      actualizadoEn: '2026-04-12T10:00:00Z',
    };

    server.use(http.get('/api/fichas/get-all', () => HttpResponse.json([fichaGanado])));

    const user = userEvent.setup();
    renderWithRouter('/contactos/c2222222-cccc-2222-cccc-222222222222');

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /diego/i })).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('tab', { name: /info/i }));
    await user.click(screen.getByRole('combobox'));

    // La opcion INACTIVO debe estar habilitada (sin data-disabled)
    await waitFor(() => {
      const allOptions = screen.getAllByRole('option', { hidden: true });
      const inactivoOpt = allOptions.find((o) => /inactivo/i.test(o.textContent ?? ''));
      expect(inactivoOpt).toBeDefined();
      expect(inactivoOpt).not.toHaveAttribute('data-disabled');
    });
  });

  it('[W1] INACTIVO habilitado si el contacto no tiene tratos', async () => {
    // c0222222 (Martín, PROSPECTO) no tiene tratos en tratosFixture
    // Sin tratos, no hay tratos activos → INACTIVO debe estar habilitado.
    server.use(http.get('/api/fichas/get-all', () => HttpResponse.json([])));

    const user = userEvent.setup();
    renderWithRouter('/contactos/c0222222-cccc-0002-cccc-000000000002');

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /martín/i })).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('tab', { name: /info/i }));
    await user.click(screen.getByRole('combobox'));

    // INACTIVO debe estar habilitado (sin tratos = no hay tratos activos)
    await waitFor(() => {
      const allOptions = screen.getAllByRole('option', { hidden: true });
      const inactivoOpt = allOptions.find((o) => /inactivo/i.test(o.textContent ?? ''));
      expect(inactivoOpt).toBeDefined();
      expect(inactivoOpt).not.toHaveAttribute('data-disabled');
    });
  });

  it('[W1] INACTIVO habilitado cuando los tratos del contacto no tienen ficha asignada', async () => {
    // c2222222 (Diego, ACTIVO) tiene trato d3333333.
    // Override: fichas vacías → deriveEstadoTrato(d3333333, [], columnas) === null
    // null !== 'ABIERTO' → tieneTratosActivos = false → INACTIVO debe estar habilitado.
    // Spec: "Opcion INACTIVO habilitada si los tratos del contacto no tienen ficha asignada"
    // (sin ficha, el estado es indeterminado — no bloquea la transición).
    server.use(http.get('/api/fichas/get-all', () => HttpResponse.json([])));

    const user = userEvent.setup();
    renderWithRouter('/contactos/c2222222-cccc-2222-cccc-222222222222');

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /diego/i })).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('tab', { name: /info/i }));
    await user.click(screen.getByRole('combobox'));

    // INACTIVO debe estar habilitado (trato sin ficha = estado indeterminado = no bloquea)
    await waitFor(() => {
      const allOptions = screen.getAllByRole('option', { hidden: true });
      const inactivoOpt = allOptions.find((o) => /inactivo/i.test(o.textContent ?? ''));
      expect(inactivoOpt).toBeDefined();
      expect(inactivoOpt).not.toHaveAttribute('data-disabled');
    });
  });
});
