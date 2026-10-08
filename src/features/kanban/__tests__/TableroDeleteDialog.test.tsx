import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { server } from '@/test/server';
import { TableroDeleteDialog } from '../components/TableroDeleteDialog';
import type { Tablero } from '../schemas/tablero.schema';

const TABLERO: Tablero = {
  id: 'extra-board',
  nombre: 'Tablero adicional',
  descripcion: 'Descripción',
  tipoTablero: 'TRATOS',
  columnas: [],
  creadoEn: '2025-01-01T00:00:00Z',
};

const OTRO_TABLERO: Tablero = { ...TABLERO, id: 'another-board', nombre: 'Otro tablero' };

function renderDialog(tablero: Tablero = TABLERO, deletable = true) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const view = render(
    <QueryClientProvider client={queryClient}>
      <TableroDeleteDialog tablero={tablero} deletable={deletable} onOpenChange={() => undefined} />
    </QueryClientProvider>,
  );

  return {
    ...view,
    rerenderDialog(nextTablero: Tablero) {
      view.rerender(
        <QueryClientProvider client={queryClient}>
          <TableroDeleteDialog
            tablero={nextTablero}
            deletable={deletable}
            onOpenChange={() => undefined}
          />
        </QueryClientProvider>,
      );
    },
  };
}

describe('TableroDeleteDialog', () => {
  it('requires confirmation and handles a 204 response', async () => {
    const user = userEvent.setup();
    let deletedId = '';
    server.use(
      http.delete('/api/tableros/delete', ({ request }) => {
        deletedId = new URL(request.url).searchParams.get('id') ?? '';
        return new HttpResponse(null, { status: 204 });
      }),
    );

    renderDialog();
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText(/esta acción no se puede deshacer/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^eliminar$/i }));
    await waitFor(() => expect(deletedId).toBe(TABLERO.id));
  });

  it('does not render a destructive action for a protected base board', () => {
    renderDialog(TABLERO, false);

    expect(screen.getByText(/no se puede eliminar este tablero/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^eliminar$/i })).not.toBeInTheDocument();
  });

  it('resets a previous mutation error when the dialog target changes', async () => {
    const user = userEvent.setup();
    server.use(
      http.delete('/api/tableros/delete', () =>
        HttpResponse.json(
          { status: 500, error: 'INTERNAL_SERVER_ERROR', message: 'Error temporal' },
          { status: 500 },
        ),
      ),
    );

    const view = renderDialog();
    await user.click(screen.getByRole('button', { name: /^eliminar$/i }));
    expect(await screen.findByText('Error temporal')).toBeInTheDocument();

    view.rerenderDialog(OTRO_TABLERO);

    await waitFor(() => expect(screen.queryByText('Error temporal')).not.toBeInTheDocument());
  });
});
