import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';

import { ContactoDeleteDialog } from '../components/ContactoDeleteDialog';
import { contactosFixture } from '@/mocks/fixtures/contactos';
import { tratosFixture } from '@/mocks/fixtures/tratos';
import { server } from '@/test/server';
import { setupTestWrapper } from '@/test/wrappers';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

describe('ContactoDeleteDialog', () => {
  it('envía una sola eliminación ante dos clics síncronos', async () => {
    let deleteCount = 0;
    let releaseDelete!: () => void;
    const deletePending = new Promise<void>((resolve) => {
      releaseDelete = resolve;
    });
    const onOpenChange = vi.fn();
    const { Wrapper } = setupTestWrapper();

    server.use(
      http.delete('/api/contactos/delete', async () => {
        deleteCount += 1;
        await deletePending;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    render(
      <ContactoDeleteDialog
        contacto={contactosFixture[4]!}
        onOpenChange={onOpenChange}
        tratos={tratosFixture}
      />,
      { wrapper: Wrapper },
    );

    const deleteButton = await screen.findByRole('button', { name: /^eliminar$/i });
    act(() => {
      fireEvent.click(deleteButton);
      fireEvent.click(deleteButton);
    });

    await waitFor(() => expect(deleteCount).toBe(1));
    expect(deleteButton).toBeDisabled();

    releaseDelete();
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(deleteCount).toBe(1);
  });

  it('resolves the related deal name before showing a conflict toast', async () => {
    const onOpenChange = vi.fn();
    const { Wrapper, queryClient } = setupTestWrapper();
    queryClient.setQueryData(['tratos'], tratosFixture);
    let releaseTratos!: () => void;
    let tratosRequestCount = 0;
    const tratosPending = new Promise<void>((resolve) => {
      releaseTratos = resolve;
    });
    const blockedContacto = contactosFixture.find(
      (contacto) => contacto.id === 'b1111111-bbbb-1111-bbbb-111111111111',
    );
    const relatedTrato = tratosFixture.find(
      (trato) => trato.contactoId === blockedContacto?.id,
    );
    if (!blockedContacto || !relatedTrato) throw new Error('Expected blocked contact fixture');

    server.use(
      http.get('/api/tratos/get-all', async () => {
        tratosRequestCount += 1;
        await tratosPending;
        return HttpResponse.json(tratosFixture);
      }),
      http.delete('/api/contactos/delete', () =>
        HttpResponse.json(
          {
            status: 409,
            error: 'CONFLICT',
            message: 'El contacto tiene tratos activos',
            details: [{ field: 'trato_id', message: relatedTrato.id }],
          },
          { status: 409 },
        ),
      ),
    );

    render(
      <ContactoDeleteDialog
        contacto={blockedContacto}
        onOpenChange={onOpenChange}
      />,
      { wrapper: Wrapper },
    );

    const loadingButton = await screen.findByRole('button', { name: /cargando/i });
    expect(loadingButton).toBeDisabled();
    await waitFor(() => expect(tratosRequestCount).toBe(1));
    await act(async () => {
      releaseTratos();
    });
    await waitFor(() => expect(queryClient.isFetching({ queryKey: ['tratos'] })).toBe(0));

    await act(async () => {
      fireEvent.click(await screen.findByRole('button', { name: /^eliminar$/i }));
    });

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining(relatedTrato.nombre),
    );
    expect(toast.error).not.toHaveBeenCalledWith(expect.stringContaining(relatedTrato.id));
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });
});
