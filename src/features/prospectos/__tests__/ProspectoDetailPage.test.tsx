import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router';

import { ProspectoDetailPage } from '../pages/ProspectoDetailPage';
import { server } from '@/test/server';

// REQ-PROS-DETALLE-001..003, REQ-PROS-TRATOS-001..003
// REQ-CONV-ACCION-001, REQ-CONV-ACCION-002, REQ-PROS-ROUTING-002

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
          <Route path="/prospectos" element={<div>Listado de prospectos</div>} />
          <Route path="/prospectos/:id" element={<ProspectoDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ProspectoDetailPage', () => {
  it('renderiza el nombre del prospecto y los tabs Info/Tratos con un id válido', async () => {
    // b1111111 = Carlos Méndez, caliente, no convertido
    renderWithRouter('/prospectos/b1111111-bbbb-1111-bbbb-111111111111');

    // El nombre aparece en el h1 del header
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /carlos méndez/i })).toBeInTheDocument(),
    );

    // Tabs visibles
    expect(screen.getByRole('tab', { name: /información/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /tratos/i })).toBeInTheDocument();
  });

  it('muestra "Convertido" badge en header y NO muestra botón Convertir cuando el prospecto ya está convertido', async () => {
    // b4444444 = Valentina Cruz, convertida
    renderWithRouter('/prospectos/b4444444-bbbb-4444-bbbb-444444444444');

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /valentina cruz/i })).toBeInTheDocument(),
    );

    // Badge "Convertido" visible (puede haber más de uno entre header e info tab)
    expect(screen.getAllByText('Convertido').length).toBeGreaterThanOrEqual(1);

    // Botón "Convertir a cliente" NO debe estar presente
    expect(
      screen.queryByRole('button', { name: /convertir a cliente/i }),
    ).not.toBeInTheDocument();
  });

  it('muestra el botón "Convertir a cliente" para un prospecto activo', async () => {
    // b1111111 = Carlos Méndez, caliente
    renderWithRouter('/prospectos/b1111111-bbbb-1111-bbbb-111111111111');

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /carlos méndez/i })).toBeInTheDocument(),
    );

    // Botón "Convertir a cliente" visible
    expect(
      screen.getByRole('button', { name: /convertir a cliente/i }),
    ).toBeInTheDocument();
  });

  it('carga los tratos al activar el tab Tratos (lazy load, ADR-027)', async () => {
    const user = userEvent.setup();
    // b1111111 tiene 1 trato: "Implementación CRM Innovatech"
    renderWithRouter('/prospectos/b1111111-bbbb-1111-bbbb-111111111111');

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /carlos méndez/i })).toBeInTheDocument(),
    );

    // El tab Tratos no debería tener datos aún (lazy)
    // Activar el tab Tratos
    await user.click(screen.getByRole('tab', { name: /tratos/i }));

    // Esperar a que cargue el trato
    await waitFor(() =>
      expect(screen.getByText('Implementación CRM Innovatech')).toBeInTheDocument(),
    );
  });

  it('redirige a /prospectos cuando el id devuelve 404', async () => {
    server.use(
      http.get('/api/v1/prospectos/:id', () =>
        HttpResponse.json(
          { status: 404, error: 'NOT_FOUND', message: 'Prospecto no encontrado' },
          { status: 404 },
        ),
      ),
    );

    renderWithRouter('/prospectos/inexistente');

    await waitFor(
      () => expect(screen.getByText('Listado de prospectos')).toBeInTheDocument(),
      { timeout: 3000 },
    );
  });

  // ── Change 6a Lote E — cross-links convertido → cliente ──

  it('prospecto convertido muestra link "Ver cliente convertido" en header', async () => {
    // b4444444 = Valentina Cruz (convertida), cliente resultante: c3333333
    renderWithRouter('/prospectos/b4444444-bbbb-4444-bbbb-444444444444');

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /valentina cruz/i })).toBeInTheDocument(),
    );

    const verClienteLink = await screen.findByRole('link', { name: /ver cliente convertido/i });
    expect(verClienteLink.getAttribute('href')).toBe(
      '/clientes/c3333333-cccc-3333-cccc-333333333333',
    );
  });

  it('prospecto NO convertido no muestra link "Ver cliente convertido"', async () => {
    // b1111111 = Carlos Méndez (caliente, no convertido)
    renderWithRouter('/prospectos/b1111111-bbbb-1111-bbbb-111111111111');

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /carlos méndez/i })).toBeInTheDocument(),
    );

    expect(
      screen.queryByRole('link', { name: /ver cliente convertido/i }),
    ).not.toBeInTheDocument();
  });

  it('tab Tratos de prospecto convertido muestra link "Ver tratos del cliente" con ?tab=tratos', async () => {
    const user = userEvent.setup();
    renderWithRouter('/prospectos/b4444444-bbbb-4444-bbbb-444444444444');

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /valentina cruz/i })).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('tab', { name: /tratos/i }));

    const verTratosLink = await screen.findByRole('link', { name: /ver tratos del cliente/i });
    expect(verTratosLink.getAttribute('href')).toBe(
      '/clientes/c3333333-cccc-3333-cccc-333333333333?tab=tratos',
    );
  });
});
