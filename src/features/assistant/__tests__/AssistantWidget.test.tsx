import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/server';
import { setupTestWrapper } from '@/test/wrappers';
import { AssistantWidget } from '../components/AssistantWidget';

function renderWidget() {
  const user = userEvent.setup();
  const { Wrapper } = setupTestWrapper();
  render(<AssistantWidget />, { wrapper: Wrapper });
  return { user };
}

async function openWidget(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /abrir asistente de chat/i }));
  expect(await screen.findByRole('dialog')).toBeInTheDocument();
}

describe('AssistantWidget', () => {
  it('opens the chat popup from the accessible floating button', async () => {
    const { user } = renderWidget();

    await openWidget(user);

    expect(screen.getByRole('heading', { name: 'Asistente' })).toBeInTheDocument();
    expect(screen.getByText('¡Hola! ¿En qué puedo ayudarte?')).toBeInTheDocument();
  });

  it('keeps the dialog shell mounted while closed for the opening animation', () => {
    renderWidget();

    expect(document.querySelector('[role="dialog"][data-state="closed"]')).toBeInTheDocument();
  });

  it('keeps the page clear and uses a larger fixed trigger', async () => {
    const { user } = renderWidget();
    const trigger = screen.getByRole('button', { name: /abrir asistente de chat/i });

    expect(trigger).toHaveClass('fixed', 'h-14', 'w-14');
    expect(trigger.querySelector('svg')).toHaveClass('h-7', 'w-7');

    await openWidget(user);

    const overlay = document.querySelector('[data-state="open"].inset-0');
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveClass(
      'bg-transparent',
      'backdrop-blur-none',
      'supports-[backdrop-filter]:backdrop-blur-none',
    );
  });

  it('sends with the button and Enter, while Shift+Enter only adds a newline', async () => {
    const requestBodies: Array<Record<string, unknown>> = [];
    server.use(
      http.post('/api/agent/messages', async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        requestBodies.push(body);
        return HttpResponse.json({ content: `Respuesta: ${body['message']}` });
      }),
    );

    const { user } = renderWidget();
    await openWidget(user);
    const textarea = screen.getByRole('textbox', { name: /mensaje para el asistente/i });

    await user.type(textarea, 'Mensaje con botón');
    await user.click(screen.getByRole('button', { name: /enviar mensaje/i }));
    await waitFor(() =>
      expect(screen.getByText('Respuesta: Mensaje con botón')).toBeInTheDocument(),
    );

    await user.type(textarea, 'Mensaje con Enter');
    await user.keyboard('{Enter}');
    await waitFor(() =>
      expect(screen.getByText('Respuesta: Mensaje con Enter')).toBeInTheDocument(),
    );

    await user.type(textarea, 'Primera línea');
    await user.keyboard('{Shift>}{Enter}{/Shift}');
    await user.type(textarea, 'Segunda línea');

    expect(textarea).toHaveValue('Primera línea\nSegunda línea');
    expect(requestBodies).toHaveLength(2);
    expect(requestBodies[0]).toEqual({
      message: 'Mensaje con botón',
      idempotencyKey: expect.any(String),
    });
    expect(requestBodies[1]).toEqual({
      message: 'Mensaje con Enter',
      idempotencyKey: expect.any(String),
    });
    expect(requestBodies[0]?.['idempotencyKey']).not.toBe(requestBodies[1]?.['idempotencyKey']);
    expect(screen.getAllByText('Mensaje con botón')).toHaveLength(1);
    expect(screen.getAllByText('Respuesta: Mensaje con botón')).toHaveLength(1);
  });

  it('disables submit while waiting for the backend response', async () => {
    let releaseResponse!: () => void;
    const responseGate = new Promise<void>((resolve) => {
      releaseResponse = resolve;
    });
    server.use(
      http.post('/api/agent/messages', async () => {
        await responseGate;
        return HttpResponse.json({ content: 'Respuesta tardía' });
      }),
    );

    const { user } = renderWidget();
    await openWidget(user);
    const textarea = screen.getByRole('textbox', { name: /mensaje para el asistente/i });
    const submitButton = screen.getByRole('button', { name: /enviar mensaje/i });

    await user.type(textarea, 'Espera');
    fireEvent.click(submitButton);

    await waitFor(() => expect(submitButton).toBeDisabled());
    expect(textarea).toBeDisabled();

    releaseResponse();
    await waitFor(() => expect(screen.getByText('Respuesta tardía')).toBeInTheDocument());
  });

  it('ignores blank messages and prevents rapid duplicate submissions', async () => {
    let requestCount = 0;
    let releaseResponse!: () => void;
    const responseGate = new Promise<void>((resolve) => {
      releaseResponse = resolve;
    });
    server.use(
      http.post('/api/agent/messages', async () => {
        requestCount += 1;
        await responseGate;
        return HttpResponse.json({ content: 'Respuesta única' });
      }),
    );

    const { user } = renderWidget();
    await openWidget(user);
    const textarea = screen.getByRole('textbox', { name: /mensaje para el asistente/i });
    const submitButton = screen.getByRole('button', { name: /enviar mensaje/i });

    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });
    await user.type(textarea, '   ');
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });
    expect(requestCount).toBe(0);

    await user.clear(textarea);
    await user.type(textarea, 'Una sola solicitud');
    fireEvent.click(submitButton);
    fireEvent.click(submitButton);

    await waitFor(() => expect(requestCount).toBe(1));
    releaseResponse();
    await waitFor(() => expect(screen.getByText('Respuesta única')).toBeInTheDocument());
  });

  it('keeps the failed draft and retries with the same idempotency key', async () => {
    let requestCount = 0;
    const requestBodies: Array<Record<string, unknown>> = [];
    server.use(
      http.post('/api/agent/messages', async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        requestBodies.push(body);
        requestCount += 1;
        if (requestCount === 1) {
          return HttpResponse.json(
            { status: 503, error: 'AGENT_UNAVAILABLE', message: 'El agente no está disponible' },
            { status: 503 },
          );
        }
        return HttpResponse.json({ content: 'Respuesta después del reintento' });
      }),
    );

    const { user } = renderWidget();
    await openWidget(user);
    const textarea = screen.getByRole('textbox', { name: /mensaje para el asistente/i });
    const draft = 'Conserva este mensaje';

    await user.type(textarea, draft);
    await user.click(screen.getByRole('button', { name: /enviar mensaje/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('El agente no está disponible');
    expect(textarea).toHaveValue(draft);

    await user.click(screen.getByRole('button', { name: /reintentar/i }));
    await waitFor(() =>
      expect(screen.getByText('Respuesta después del reintento')).toBeInTheDocument(),
    );

    expect(requestBodies).toHaveLength(2);
    expect(requestBodies[1]?.['idempotencyKey']).toBe(requestBodies[0]?.['idempotencyKey']);
    expect(screen.getAllByText(draft)).toHaveLength(1);
  });
});
