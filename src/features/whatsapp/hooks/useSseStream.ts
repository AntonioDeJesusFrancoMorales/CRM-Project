import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

const BASE_URL: string = import.meta.env.VITE_API_BASE_URL || '/api';

interface SseEvent {
  name: string;
  data: unknown;
}

// Conecta al SSE del backend (/api/wa/stream) usando fetch con ReadableStream
// para poder enviar el header Authorization (EventSource nativo no lo soporta).
export function useSseStream(onEvent: (event: SseEvent) => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    let aborted = false;
    const controller = new AbortController();

    async function connect() {
      const token = useAuthStore.getState().getCurrentToken();
      const headers: HeadersInit = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      try {
        const res = await fetch(`${BASE_URL}/wa/stream`, {
          headers,
          signal: controller.signal,
        });

        if (!res.ok || !res.body) return;

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (!aborted) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          let eventName = 'message';
          for (const line of lines) {
            if (line.startsWith('event:')) {
              eventName = line.slice(6).trim();
            } else if (line.startsWith('data:')) {
              const raw = line.slice(5).trim();
              try {
                onEvent({ name: eventName, data: JSON.parse(raw) });
              } catch {
                onEvent({ name: eventName, data: raw });
              }
              eventName = 'message';
            }
          }
        }
      } catch {
        // Reconectar tras 3s si no fue un abort intencional
        if (!aborted) setTimeout(connect, 3_000);
      }
    }

    void connect();

    return () => {
      aborted = true;
      controller.abort();
    };
  }, [enabled, onEvent]);
}
