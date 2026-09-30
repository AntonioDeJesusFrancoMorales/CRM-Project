import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';

import { server } from '@/test/server';
import { AgendaCreateDialog } from '../components/AgendaCreateDialog';
import type { AgendaCreateInput } from '../schemas/agenda.schema';

const validDefaults: AgendaCreateInput = {
  tipo: 'REUNION',
  asunto: 'Reunión de prueba',
  descripcion: null,
  fecha: '2099-12-31',
  horaInicio: '09:00',
  horaFin: '10:00',
  tareaId: null,
  tratoId: null,
  ubicacion: 'Sala 3',
  linkVideollamada: null,
  recordatorioHabilitado: false,
  minutosAntes: null,
};

function renderDialog(onOpenChange = vi.fn()) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });

  return {
    onOpenChange,
    ...render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AgendaCreateDialog
            open
            onOpenChange={onOpenChange}
            defaultValues={validDefaults}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    ),
  };
}

describe('AgendaCreateDialog', () => {
  it('allows only one create request during synchronous repeated submits and stays in saving state', async () => {
    let requestCount = 0;
    let releaseRequest!: () => void;
    const requestGate = new Promise<void>((resolve) => {
      releaseRequest = resolve;
    });

    server.use(
      http.post('/api/agendas/create', async ({ request }) => {
        requestCount += 1;
        const body = (await request.json()) as { asunto?: string };
        await requestGate;
        return HttpResponse.json({ asunto: body.asunto ?? 'Reunión de prueba' }, { status: 201 });
      }),
    );

    const { onOpenChange } = renderDialog();
    const dialog = await screen.findByRole('dialog');
    const submit = within(dialog).getByRole('button', { name: 'Crear evento' });
    const form = submit.closest('form');

    expect(form).not.toBeNull();
    fireEvent.submit(form!);
    fireEvent.submit(form!);

    await waitFor(() => expect(requestCount).toBe(1));
    const savingButton = within(dialog).getByRole('button', { name: 'Guardando...' });
    expect(savingButton).toBeDisabled();
    expect(onOpenChange).not.toHaveBeenCalled();

    releaseRequest();
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it('releases the create lock after failure so the form can be retried', async () => {
    let requestCount = 0;
    server.use(
      http.post('/api/agendas/create', () => {
        requestCount += 1;
        if (requestCount === 1) {
          return HttpResponse.json({ message: 'Temporary failure' }, { status: 500 });
        }

        return HttpResponse.json({ asunto: 'Reunión de prueba' }, { status: 201 });
      }),
    );

    const user = userEvent.setup();
    const { onOpenChange } = renderDialog();
    const dialog = await screen.findByRole('dialog');
    const submit = () => within(dialog).getByRole('button', { name: 'Crear evento' });

    await user.click(submit());
    await waitFor(() => expect(requestCount).toBe(1));
    await waitFor(() => expect(submit()).toBeEnabled());

    await user.click(submit());
    await waitFor(() => expect(requestCount).toBe(2));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });
});
