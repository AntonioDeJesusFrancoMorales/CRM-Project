import { describe, it, expect } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router';

import { TratoDetailPage } from '../pages/TratoDetailPage';
import { server } from '@/test/server';

// d1111111 → "Implementación CRM Innovatech", estado: abierto, prospecto_id, 2 tareas
// d2222222 → "Renovación licencia anual Innovatech", estado: abierto, cliente_id
// d3333333 → "Consultoría procesos Maya", estado: abierto, cliente_id, sin tareas
const TRATO_ABIERTO_CON_CLIENTE = 'd2222222-dddd-2222-dddd-222222222222';

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
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('TratoDetailPage', () => {
  it('renderiza el header con nombre y badge de estado', async () => {
    renderPage(`/tratos/${TRATO_ABIERTO_CON_CLIENTE}`);

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /renovación licencia anual innovatech/i }),
      ).toBeInTheDocument(),
    );

    // Badge de estado visible
    expect(screen.getByText(/abierto/i)).toBeInTheDocument();
  });

  it('motivo_perdida NO se renderiza cuando estado es abierto', async () => {
    renderPage(`/tratos/${TRATO_ABIERTO_CON_CLIENTE}`);

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /renovación licencia anual innovatech/i }),
      ).toBeInTheDocument(),
    );

    expect(screen.queryByText(/motivo de pérdida/i)).not.toBeInTheDocument();
  });

  it('motivo_perdida SÍ se renderiza cuando estado es perdido', async () => {
    server.use(
      http.get(`/api/v1/tratos/${TRATO_ABIERTO_CON_CLIENTE}`, () =>
        HttpResponse.json({
          id: TRATO_ABIERTO_CON_CLIENTE,
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

    renderPage(`/tratos/${TRATO_ABIERTO_CON_CLIENTE}`);

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /trato perdido test/i }),
      ).toBeInTheDocument(),
    );

    expect(screen.getByText(/motivo de pérdida/i)).toBeInTheDocument();
    expect(screen.getByText('precio fuera de presupuesto')).toBeInTheDocument();
  });

  it('404 muestra mensaje "no existe"', async () => {
    server.use(
      http.get('/api/v1/tratos/id-inexistente', () =>
        HttpResponse.json(
          { status: 404, error: 'NOT_FOUND', message: 'Trato no encontrado' },
          { status: 404 },
        ),
      ),
    );

    renderPage('/tratos/id-inexistente');

    await waitFor(() => expect(screen.getByText(/no existe/i)).toBeInTheDocument());
  });

  it('click en "Marcar como perdido…" abre TratoPerderDialog (sin invocar endpoint hasta submit)', async () => {
    let perderEndpointCalled = false;
    server.use(
      http.patch(`/api/v1/tratos/${TRATO_ABIERTO_CON_CLIENTE}/perder`, () => {
        perderEndpointCalled = true;
        return HttpResponse.json({});
      }),
    );

    const user = userEvent.setup();
    renderPage(`/tratos/${TRATO_ABIERTO_CON_CLIENTE}`);

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /renovación licencia anual innovatech/i }),
      ).toBeInTheDocument(),
    );

    await user.click(
      screen.getByRole('button', { name: /marcar como perdido/i }),
    );

    // Modal visible
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: /marcar como perdido/i })).toBeInTheDocument();

    // Endpoint NO invocado hasta submit del modal
    expect(perderEndpointCalled).toBe(false);
  });
});
