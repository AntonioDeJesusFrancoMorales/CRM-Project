import { describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/server';
import { setupTestWrapper } from '@/test/wrappers';
import { useSendAssistantMessage } from '../hooks/useSendAssistantMessage';

describe('useSendAssistantMessage', () => {
  it('sends the exact agent payload without identity fields', async () => {
    let capturedBody: Record<string, unknown> | null = null;
    server.use(
      http.post('/api/agent/messages', async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ content: 'Respuesta del agente' });
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useSendAssistantMessage(), { wrapper: Wrapper });
    const payload = { message: '¿Qué tareas tengo?', idempotencyKey: 'assistant-turn-1' };

    await result.current.mutateAsync(payload);

    expect(capturedBody).toEqual(payload);
    expect(capturedBody).not.toHaveProperty('userId');
    expect(capturedBody).not.toHaveProperty('tenantId');
    expect(capturedBody).not.toHaveProperty('conversationId');
  });

  it('returns the backend response on success', async () => {
    server.use(
      http.post('/api/agent/messages', () =>
        HttpResponse.json({ content: 'Respuesta determinista' }),
      ),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useSendAssistantMessage(), { wrapper: Wrapper });

    result.current.mutate({ message: 'Hola', idempotencyKey: 'assistant-turn-2' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ content: 'Respuesta determinista' });
  });

  it('exposes an error and does not retry the POST automatically', async () => {
    let requestCount = 0;
    server.use(
      http.post('/api/agent/messages', () => {
        requestCount += 1;
        return HttpResponse.json(
          { status: 503, error: 'AGENT_UNAVAILABLE', message: 'Agent unavailable' },
          { status: 503 },
        );
      }),
    );

    const { Wrapper } = setupTestWrapper();
    const { result } = renderHook(() => useSendAssistantMessage(), { wrapper: Wrapper });

    await expect(
      result.current.mutateAsync({ message: 'Hola', idempotencyKey: 'assistant-turn-3' }),
    ).rejects.toMatchObject({ status: 503 });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(requestCount).toBe(1);
  });
});
