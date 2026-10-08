import { describe, expect, it } from 'vitest';

describe('POST /api/agent/messages', () => {
  it('returns the real 200 response shape with a deterministic echo', async () => {
    const response = await fetch('/api/agent/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Resume mis tareas', idempotencyKey: 'mock-turn-1' }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      content: 'Respuesta simulada del asistente: Resume mis tareas',
    });
  });

  it('validates the required message and idempotency key fields', async () => {
    const response = await fetch('/api/agent/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '   ', idempotencyKey: '' }),
    });

    expect(response.status).toBe(422);
  });
});
