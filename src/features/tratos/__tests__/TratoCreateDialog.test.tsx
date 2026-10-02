import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import { useState } from 'react';

import { server } from '@/test/server';
import { TratoCreateDialog } from '../components/TratoCreateDialog';
import type { TratoCreateInput } from '../schemas/trato.schema';

const validDefaults: TratoCreateInput = {
  contactoId: 'c1111111-cccc-1111-cccc-111111111111',
  responsableId: '11111111-1111-1111-1111-111111111111',
  nombre: 'Trato de prueba',
  tipoContrato: 'SERVICIO',
  valorEstimado: null,
  probabilidad: null,
  fechaCierreEsperada: '2099-12-31',
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
          <TratoCreateDialog open onOpenChange={onOpenChange} defaultValues={validDefaults} />
        </MemoryRouter>
      </QueryClientProvider>,
    ),
  };
}

function ControlledTratoCreateDialog({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const [open, setOpen] = useState(true);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Reopen dialog
      </button>
      <TratoCreateDialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          onOpenChange(nextOpen);
        }}
        defaultValues={validDefaults}
      />
    </>
  );
}

describe('TratoCreateDialog', () => {
  it('allows only one create request during synchronous repeated submits and stays in saving state', async () => {
    let requestCount = 0;
    let releaseRequest!: () => void;
    const requestGate = new Promise<void>((resolve) => {
      releaseRequest = resolve;
    });

    server.use(
      http.post('/api/tratos/create', async () => {
        requestCount += 1;
        await requestGate;
        return HttpResponse.json({ id: 'new-trato-id', nombre: 'Trato de prueba' }, { status: 201 });
      }),
    );

    const { onOpenChange } = renderDialog();
    const dialog = await screen.findByRole('dialog');
    const submit = within(dialog).getByRole('button', { name: 'Crear trato' });
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
    expect(requestCount).toBe(1);
  });

  it('keeps a successful create locked through close and releases it on the next open', async () => {
    let requestCount = 0;
    const createdResults: string[] = [];
    const onOpenChange = vi.fn();
    const user = userEvent.setup();

    server.use(
      http.post('/api/tratos/create', () => {
        requestCount += 1;
        const createdId = `created-${requestCount}`;
        createdResults.push(createdId);
        return HttpResponse.json({ id: createdId, nombre: 'Trato de prueba' }, { status: 201 });
      }),
    );

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ControlledTratoCreateDialog onOpenChange={onOpenChange} />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    const dialog = await screen.findByRole('dialog');
    const submit = within(dialog).getByRole('button', { name: 'Crear trato' });
    const form = submit.closest('form');

    expect(form).not.toBeNull();

    fireEvent.click(submit);
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    await waitFor(() => expect(submit).toBeDisabled());

    await act(async () => {
      fireEvent.submit(form!);
    });

    expect(requestCount).toBe(1);
    expect(createdResults).toEqual(['created-1']);
    expect(onOpenChange).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Reopen dialog' }));
    const reopenedDialog = await screen.findByRole('dialog');
    const reopenedSubmit = within(reopenedDialog).getByRole('button', { name: 'Crear trato' });
    await waitFor(() => expect(reopenedSubmit).toBeEnabled());
    await user.click(reopenedSubmit);

    await waitFor(() => expect(requestCount).toBe(2));
    expect(createdResults).toEqual(['created-1', 'created-2']);
  });

  it('releases the create lock after failure so the form can be retried', async () => {
    let requestCount = 0;

    server.use(
      http.post('/api/tratos/create', () => {
        requestCount += 1;
        if (requestCount === 1) {
          return HttpResponse.json({ message: 'Temporary failure' }, { status: 500 });
        }

        return HttpResponse.json({ id: 'retry-trato-id', nombre: 'Trato de prueba' }, { status: 201 });
      }),
    );

    const user = userEvent.setup();
    const { onOpenChange } = renderDialog();
    const dialog = await screen.findByRole('dialog');
    const submit = () => within(dialog).getByRole('button', { name: /crear trato/i });

    await user.click(submit());
    await waitFor(() => expect(requestCount).toBe(1));
    await waitFor(() => expect(submit()).toBeEnabled());

    await user.click(submit());
    await waitFor(() => expect(requestCount).toBe(2));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });
});
