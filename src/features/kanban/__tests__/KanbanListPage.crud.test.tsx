import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { server } from '@/test/server';
import { tableroTareasFixture, tableroTratosFixture } from '@/mocks/fixtures/tableros';
import { KanbanListPage } from '../pages/KanbanListPage';

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <KanbanListPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('KanbanListPage board deletion policy', () => {
  it('hides delete for each base board but allows deleting an additional same-type board', async () => {
    const user = userEvent.setup();
    const baseTratos = {
      ...tableroTratosFixture,
      id: 'base-tratos',
      nombre: 'Base tratos',
      creadoEn: '2024-01-01T00:00:00Z',
    };
    const extraTratos = {
      ...tableroTratosFixture,
      id: 'extra-tratos',
      nombre: 'Tratos adicional',
      creadoEn: '2025-01-01T00:00:00Z',
    };
    const baseTareas = {
      ...tableroTareasFixture,
      id: 'base-tareas',
      nombre: 'Base tareas',
      creadoEn: '2024-01-01T00:00:00Z',
    };
    const boards = [baseTratos, extraTratos, baseTareas];
    let deletedId = '';

    server.use(
      http.get('/api/tableros/get-all', () => HttpResponse.json(boards)),
      http.delete('/api/tableros/delete', ({ request }) => {
        deletedId = new URL(request.url).searchParams.get('id') ?? '';
        const index = boards.findIndex((board) => board.id === deletedId);
        if (index >= 0) boards.splice(index, 1);
        return new HttpResponse(null, { status: 204 });
      }),
    );

    renderPage();
    await waitFor(() => expect(screen.getByText('Base tratos')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Acciones de Base tratos' }));
    expect(screen.queryByRole('menuitem', { name: /eliminar tablero/i })).not.toBeInTheDocument();
    await user.keyboard('{Escape}');

    await user.click(screen.getByRole('button', { name: 'Acciones de Base tareas' }));
    expect(screen.queryByRole('menuitem', { name: /eliminar tablero/i })).not.toBeInTheDocument();
    await user.keyboard('{Escape}');

    await user.click(screen.getByRole('button', { name: 'Acciones de Tratos adicional' }));
    await user.click(screen.getByRole('menuitem', { name: /eliminar tablero/i }));
    await user.click(screen.getByRole('button', { name: /^eliminar$/i }));

    await waitFor(() => expect(deletedId).toBe('extra-tratos'));
    await waitFor(() => expect(screen.queryByText('Tratos adicional')).not.toBeInTheDocument());
  });
});

describe('KanbanListPage board navigation', () => {
  it('routes base boards to entity pages and additional boards to board detail', async () => {
    const baseTratos = {
      ...tableroTratosFixture,
      id: 'base-tratos-navigation',
      nombre: 'Renamed base tratos',
      creadoEn: '2024-01-01T00:00:00Z',
    };
    const baseTareas = {
      ...tableroTareasFixture,
      id: 'base-tareas-navigation',
      nombre: 'Renamed base tareas',
      creadoEn: '2024-02-01T00:00:00Z',
    };
    const extraTratos = {
      ...tableroTratosFixture,
      id: 'extra-tratos-navigation',
      nombre: 'Tratos adicional',
      creadoEn: '2025-01-01T00:00:00Z',
    };

    server.use(
      http.get('/api/tableros/get-all', () =>
        HttpResponse.json([extraTratos, baseTareas, baseTratos]),
      ),
    );

    renderPage();

    await waitFor(() => expect(screen.getByText('Renamed base tratos')).toBeInTheDocument());

    expect(screen.getByRole('link', { name: /Renamed base tratos/i })).toHaveAttribute(
      'href',
      '/tratos',
    );
    expect(screen.getByRole('link', { name: /Renamed base tareas/i })).toHaveAttribute(
      'href',
      '/tareas',
    );
    expect(screen.getByRole('link', { name: /Tratos adicional/i })).toHaveAttribute(
      'href',
      `/tableros/${extraTratos.id}`,
    );
  });
});
