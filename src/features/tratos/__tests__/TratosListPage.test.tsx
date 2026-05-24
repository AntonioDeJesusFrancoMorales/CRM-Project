import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router';

import { TratosListPage } from '../pages/TratosListPage';
import { server } from '@/test/server';

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/tratos']}>
        <Routes>
          <Route path="/tratos" element={<TratosListPage />} />
          <Route path="/tratos/:id" element={<div>Detalle del trato</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('TratosListPage', () => {
  it('renderiza la tabla con los tratos del fixture', async () => {
    renderPage();

    await waitFor(() =>
      expect(screen.getByText('Implementación CRM Innovatech')).toBeInTheDocument(),
    );

    expect(screen.getByText('Renovación licencia anual Innovatech')).toBeInTheDocument();
    expect(screen.getByText('Consultoría procesos Maya')).toBeInTheDocument();
  });

  it('nombre clickeable navega a /tratos/:id', async () => {
    const user = userEvent.setup();
    renderPage();

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
    renderPage();

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
      http.get('/api/v1/tratos', () =>
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
    renderPage();

    await waitFor(() =>
      expect(screen.getByText('Implementación CRM Innovatech')).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('button', { name: /nuevo trato/i }));

    await waitFor(() =>
      expect(screen.getByRole('dialog')).toBeInTheDocument(),
    );
    expect(screen.getByRole('heading', { name: /nuevo trato/i })).toBeInTheDocument();
  });
});
