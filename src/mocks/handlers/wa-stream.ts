import { http, HttpResponse } from 'msw';

const API = '/api';

// The SSE route is retained because it is a runtime-only backend contract.
export const waStreamHandlers = [
  http.get(`${API}/wa/stream`, () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(': connected\n\n'));
        controller.close();
      },
    });
    return new HttpResponse(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    });
  }),
];
