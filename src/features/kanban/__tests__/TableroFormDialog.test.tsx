import { describe, expect, it } from 'vitest';
import type { ReactElement } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { server } from '@/test/server';
import { TableroFormDialog } from '../components/TableroFormDialog';
import type { Tablero } from '../schemas/tablero.schema';

const TABLERO: Tablero = {
  id: 'f1111111-ffff-1111-ffff-111111111111',
  nombre: 'Pipeline de Tratos',
  descripcion: 'Descripción original',
  tipoTablero: 'TRATOS',
  columnas: [],
  creadoEn: '2024-01-01T00:00:00Z',
};

function renderDialog(element: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(<QueryClientProvider client={queryClient}>{element}</QueryClientProvider>);
}

describe('TableroFormDialog', () => {
  it('shows validation messages and exposes only TAREAS/TRATOS when creating', async () => {
    const user = userEvent.setup();
    renderDialog(<TableroFormDialog mode="create" open={true} onOpenChange={() => undefined} />);

    await user.click(screen.getByRole('button', { name: /crear tablero/i }));

    expect(await screen.findByText('El nombre es obligatorio')).toBeInTheDocument();
    expect(screen.getByText('La descripción es obligatoria')).toBeInTheDocument();

    await user.click(screen.getByRole('combobox', { name: /tipo de tablero/i }));
    expect(screen.getByRole('option', { name: 'Tratos' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Tareas' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /personalizado/i })).not.toBeInTheDocument();
  });

  it('surfaces a validation mutation error inside the dialog', async () => {
    const user = userEvent.setup();
    server.use(
      http.post('/api/tableros/create', () =>
        HttpResponse.json(
          {
            status: 422,
            error: 'VALIDATION_ERROR',
            message: 'Datos inválidos',
            details: [{ field: 'nombre', message: 'El nombre ya existe' }],
          },
          { status: 422 },
        ),
      ),
    );

    renderDialog(<TableroFormDialog mode="create" open={true} onOpenChange={() => undefined} />);
    await user.type(screen.getByLabelText('Nombre del tablero'), 'Duplicado');
    await user.type(screen.getByLabelText('Descripción del tablero'), 'Descripción');
    await user.click(screen.getByRole('button', { name: /crear tablero/i }));

    expect(await screen.findByText('El nombre ya existe')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Datos inválidos');
  });

  it('edit sends only name and description and keeps the type immutable', async () => {
    const user = userEvent.setup();
    let capturedBody: unknown;
    server.use(
      http.put('/api/tableros/edit', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ ...TABLERO, nombre: 'Renombrado' }, { status: 200 });
      }),
    );

    renderDialog(
      <TableroFormDialog
        mode="edit"
        open={true}
        onOpenChange={() => undefined}
        tablero={TABLERO}
      />,
    );
    const nameInput = screen.getByLabelText('Nombre del tablero');
    await user.clear(nameInput);
    await user.type(nameInput, 'Renombrado');
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    await waitFor(() =>
      expect(capturedBody).toEqual({
        nombre: 'Renombrado',
        descripcion: TABLERO.descripcion,
      }),
    );
    expect(screen.getByLabelText('Tipo de tablero')).toHaveTextContent('TRATOS');
    expect(screen.queryByRole('combobox', { name: /tipo de tablero/i })).not.toBeInTheDocument();
  });

  it('requires a non-blank description before editing', async () => {
    const user = userEvent.setup();
    let requestCount = 0;
    server.use(
      http.put('/api/tableros/edit', () => {
        requestCount += 1;
        return HttpResponse.json(TABLERO, { status: 200 });
      }),
    );

    renderDialog(
      <TableroFormDialog
        mode="edit"
        open={true}
        onOpenChange={() => undefined}
        tablero={TABLERO}
      />,
    );

    await user.clear(screen.getByLabelText('Descripción del tablero'));
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    expect(await screen.findByText('La descripción es obligatoria')).toBeInTheDocument();
    expect(requestCount).toBe(0);
  });
});
