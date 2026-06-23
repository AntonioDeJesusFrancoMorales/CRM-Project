import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';

const BASE_URL: string = import.meta.env.VITE_API_BASE_URL || '/api';

interface SseEvent {
  name: string;
  data: unknown;
}

// Conecta al SSE del backend (/api/wa/stream) usando fetch con ReadableStream
// para poder enviar el header Authorization (EventSource nativo no lo soporta).
export function useSseStream(onEvent: (event: SseEvent) => void, enabled = true) {
  // onEvent vive en un ref para que el efecto no dependa de su identidad:
  // si el caller pasa una función inline (sin useCallback), no debe reconectar el SSE.
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!enabled) return;

    let aborted = false;
    let controller = new AbortController();
    let watchdog: ReturnType<typeof setInterval> | undefined;

    // Si un proxy intermedio corta la conexión sin emitir error (silenciosamente
    // deja de mandar bytes), fetch+ReadableStream se queda "colgado" sin que el
    // catch se dispare. El backend manda un ping cada 25s (ver SseEmitterRegistry);
    // si no vemos actividad en 60s, forzamos el abort para que reconecte.
    let lastActivity = Date.now();

    async function connect() {
      const token = useAuthStore.getState().getCurrentToken();
      const headers: HeadersInit = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      controller = new AbortController();
      lastActivity = Date.now();
      watchdog = setInterval(() => {
        if (Date.now() - lastActivity > 60_000) controller.abort();
      }, 10_000);

      try {
        const res = await fetch(`${BASE_URL}/wa/stream`, {
          headers,
          signal: controller.signal,
        });

        if (!res.ok || !res.body) throw new Error('SSE response not ok');

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (!aborted) {
          const { done, value } = await reader.read();
          if (done) break;
          lastActivity = Date.now();

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
                onEventRef.current({ name: eventName, data: JSON.parse(raw) });
              } catch {
                onEventRef.current({ name: eventName, data: raw });
              }
              eventName = 'message';
            }
          }
        }
        if (!aborted) setTimeout(connect, 1_000);
      } catch {
        // Reconectar tras 3s si no fue un abort intencional
        if (!aborted) setTimeout(connect, 3_000);
      } finally {
        if (watchdog) clearInterval(watchdog);
      }
    }

    void connect();

    return () => {
      aborted = true;
      if (watchdog) clearInterval(watchdog);
      controller.abort();
    };
  }, [enabled]);
}
