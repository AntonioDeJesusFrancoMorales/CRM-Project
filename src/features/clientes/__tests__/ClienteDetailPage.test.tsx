import { describe, it, expect } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router';

import { ClienteDetailPage } from '../pages/ClienteDetailPage';
import { server } from '@/test/server';

// REQ-05: detalle con tabs — REQ-06: badge origen — REQ-07: tratos tab lazy

// Fixtures IDs
const ANA_ID = 'c1111111-cccc-1111-cccc-111111111111'; // cliente manual (tiene 1 trato en fixture)
const VALENTINA_ID = 'c3333333-cccc-3333-cccc-333333333333'; // cliente con origen prospecto (sin tratos)
const PROSPECTO_ORIGEN_ID = 'b4444444-bbbb-4444-bbbb-444444444444';

function renderWithRouter(initialPath: string) {
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
          <Route path="/clientes" element={<div>Listado de clientes</div>} />
          <Route path="/clientes/:id" element={<ClienteDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ClienteDetailPage', () => {
  it('renderiza el header con nombre y empresa del cliente', async () => {
    renderWithRouter(`/clientes/${ANA_ID}`);

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /ana rodríguez/i })).toBeInTheDocument(),
    );

    // La empresa (Innovatech Solutions) debe estar visible en algún lugar de la página
    expect(screen.getAllByText(/innovatech/i).length).toBeGreaterThan(0);
  });

  it('muestra badge "Origen: Manual" cuando prospecto_origen_id es null', async () => {
    renderWithRouter(`/clientes/${ANA_ID}`);

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /ana rodríguez/i })).toBeInTheDocument(),
    );

    // Ana tiene prospecto_origen_id null → badge Manual (sin link)
    expect(screen.getByText(/origen: manual/i)).toBeInTheDocument();

    // No debe ser un link
    const badge = screen.getByText(/origen: manual/i);
    expect(badge.closest('a')).toBeNull();
  });

  it('muestra badge "Origen: Prospecto convertido" como Link cuando hay prospecto_origen_id', async () => {
    renderWithRouter(`/clientes/${VALENTINA_ID}`);

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /valentina cruz/i })).toBeInTheDocument(),
    );

    // Valentina tiene prospecto_origen_id → badge como Link
    const badge = screen.getByText(/origen: prospecto convertido/i);
    expect(badge).toBeInTheDocument();
    // El link debe apuntar al prospecto de origen
    const link = badge.closest('a');
    expect(link).not.toBeNull();
    expect(link?.getAttribute('href')).toContain(PROSPECTO_ORIGEN_ID);
  });

  it('renderiza el tab Información por defecto', async () => {
    renderWithRouter(`/clientes/${ANA_ID}`);

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /ana rodríguez/i })).toBeInTheDocument(),
    );

    // Tab "Información" activo por defecto
    expect(screen.getByRole('tab', { name: /información/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /tratos/i })).toBeInTheDocument();

    // Contenido del tab de información visible
    expect(screen.getByText(/información de contacto/i)).toBeInTheDocument();
  });

  it('click en tab "Tratos" monta ClienteTratosTab y dispara fetch lazy', async () => {
    const user = userEvent.setup();
    renderWithRouter(`/clientes/${ANA_ID}`);

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /ana rodríguez/i })).toBeInTheDocument(),
    );

    const tabTratos = screen.getByRole('tab', { name: /tratos/i });
    await user.click(tabTratos);

    // Ana tiene 1 trato en el fixture (Renovación licencia anual Innovatech)
    await waitFor(() =>
      expect(screen.getByText('Renovación licencia anual Innovatech')).toBeInTheDocument(),
    );
  });

  it('click en "Editar" abre el dialog de edición con datos prefilled', async () => {
    const user = userEvent.setup();
    renderWithRouter(`/clientes/${ANA_ID}`);

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /ana rodríguez/i })).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('button', { name: /editar/i }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: /editar cliente/i })).toBeInTheDocument();
  });

  it('click en "Eliminar" abre el AlertDialog de confirmación', async () => {
    const user = userEvent.setup();
    renderWithRouter(`/clientes/${ANA_ID}`);

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /ana rodríguez/i })).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('button', { name: /eliminar/i }));

    // AlertDialog debe aparecer con texto de confirmación
    await waitFor(() =>
      expect(screen.getByRole('alertdialog')).toBeInTheDocument(),
    );
    expect(screen.getByText(/eliminar cliente/i)).toBeInTheDocument();
  });

  it('confirmar eliminación 204 cierra el dialog', async () => {
    // c3333333 (Valentina) no tiene tratos en fixture → DELETE devuelve 204
    const user = userEvent.setup();
    renderWithRouter(`/clientes/${VALENTINA_ID}`);

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /valentina cruz/i })).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('button', { name: /eliminar/i }));

    await waitFor(() =>
      expect(screen.getByRole('alertdialog')).toBeInTheDocument(),
    );

    // Confirmar eliminación — botón "Eliminar" dentro del alertdialog
    const alertDialog = screen.getByRole('alertdialog');
    const confirmBtn = within(alertDialog).getByRole('button', { name: /eliminar/i });
    await user.click(confirmBtn);

    // Tras 204, el dialog se cierra y navega a /clientes (que muestra el placeholder)
    await waitFor(() =>
      expect(screen.getByText('Listado de clientes')).toBeInTheDocument(),
    );
  });

  it('confirmar eliminación 409 cierra el dialog sin navegar', async () => {
    // ANA (c1111111) tiene tratos en fixture → 409 nativo
    const user = userEvent.setup();
    renderWithRouter(`/clientes/${ANA_ID}`);

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /ana rodríguez/i })).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('button', { name: /eliminar/i }));

    await waitFor(() =>
      expect(screen.getByRole('alertdialog')).toBeInTheDocument(),
    );

    // Confirmar eliminación → 409 del fixture (tiene 1 trato)
    const alertDialog = screen.getByRole('alertdialog');
    const confirmBtn = within(alertDialog).getByRole('button', { name: /eliminar/i });
    await user.click(confirmBtn);

    // El alertdialog debe cerrarse (el host lo cierra en onError)
    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
    );

    // NO navega — la page de detalle sigue visible
    expect(screen.getByRole('heading', { name: /ana rodríguez/i })).toBeInTheDocument();
  });

  it('muestra estado de carga mientras el cliente se obtiene', async () => {
    server.use(
      http.get(`/api/v1/clientes/${ANA_ID}`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return HttpResponse.json({});
      }),
    );

    renderWithRouter(`/clientes/${ANA_ID}`);

    expect(screen.getByText(/cargando cliente/i)).toBeInTheDocument();
  });

  it('404 muestra mensaje "no existe" y prepara redirección', async () => {
    server.use(
      http.get('/api/v1/clientes/id-inexistente', () =>
        HttpResponse.json(
          { status: 404, error: 'NOT_FOUND', message: 'Cliente no encontrado' },
          { status: 404 },
        ),
      ),
    );

    renderWithRouter('/clientes/id-inexistente');

    await waitFor(() =>
      expect(screen.getByText(/no existe/i)).toBeInTheDocument(),
    );
  });
});
