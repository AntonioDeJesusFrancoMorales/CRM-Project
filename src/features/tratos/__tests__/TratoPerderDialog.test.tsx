// TratoPerderDialog.test.tsx
// Tests de integración para el diálogo de motivo de pérdida.
// Cubre: render del dialog abierto, cancelar cierra sin llamar al endpoint,
// confirmar con motivo llama PATCH /perder.

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';

import { server } from '@/test/server';
import { TratoPerderDialog } from '../components/TratoPerderDialog';

const TRATO_ID = 'd1111111-dddd-1111-dddd-111111111111';
const NOMBRE = 'Implementación CRM Innovatech';

function renderDialog(open: boolean, onOpenChange = vi.fn()) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <TratoPerderDialog
          open={open}
          onOpenChange={onOpenChange}
          tratoId={TRATO_ID}
          nombre={NOMBRE}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );

  return { onOpenChange };
}

describe('TratoPerderDialog', () => {
  it('muestra el diálogo y el nombre del trato cuando open=true', () => {
    renderDialog(true);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Implementación CRM Innovatech/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /marcar como perdido/i })).toBeInTheDocument();
  });

  it('no muestra el diálogo cuando open=false', () => {
    renderDialog(false);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('cancelar llama onOpenChange(false) sin llamar al endpoint', async () => {
    const user = userEvent.setup();
    let endpointCalled = false;

    server.use(
      http.patch(`/api/tratos/${TRATO_ID}/perder`, () => {
        endpointCalled = true;
        return HttpResponse.json({ id: TRATO_ID, estado: 'perdido' });
      }),
    );

    const { onOpenChange } = renderDialog(true);

    await user.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(endpointCalled).toBe(false);
  });

  it('confirmar con motivo llama PATCH /perder y cierra el diálogo en onSuccess', async () => {
    const user = userEvent.setup();
    let sentBody: unknown = null;

    server.use(
      http.patch(`/api/tratos/${TRATO_ID}/perder`, async ({ request }) => {
        sentBody = await request.json();
        return HttpResponse.json({ id: TRATO_ID, estado: 'perdido' });
      }),
    );

    const { onOpenChange } = renderDialog(true);

    await user.type(
      screen.getByRole('textbox', { hidden: true }) ?? screen.getByPlaceholderText(/presupuesto/i),
      'Precio fuera de rango del cliente',
    );

    await user.click(screen.getByRole('button', { name: /marcar como perdido/i }));

    await waitFor(() => {
      expect(sentBody).toMatchObject({ motivo_perdida: 'Precio fuera de rango del cliente' });
    });

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});

