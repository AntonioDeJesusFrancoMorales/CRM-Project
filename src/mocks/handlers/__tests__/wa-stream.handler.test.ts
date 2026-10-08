import { describe, expect, it } from 'vitest';

describe('GET /api/wa/stream', () => {
  it('returns an SSE response with the initial heartbeat', async () => {
    const response = await fetch('/api/wa/stream');

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/event-stream');

    const reader = response.body?.getReader();
    expect(reader).toBeDefined();
    if (!reader) throw new Error('Expected an SSE response body');

    const { value } = await reader.read();
    expect(new TextDecoder().decode(value)).toContain(': connected');
    await reader.cancel();
  });
});
