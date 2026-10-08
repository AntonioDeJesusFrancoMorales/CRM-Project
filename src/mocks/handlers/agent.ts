import { http, HttpResponse } from 'msw';
import { withDelay } from '@/mocks/utils/withDelay';
import { errors } from '@/mocks/utils/error';
import type { AgentMessageRequest, AgentMessageResponse } from '@/api/types';

const API = '/api';

export const agentHandlers = [
  http.post(`${API}/agent/messages`, async ({ request }) => {
    await withDelay();

    const body = (await request.json()) as Partial<AgentMessageRequest>;
    const message = body.message;
    const idempotencyKey = body.idempotencyKey;

    if (typeof message !== 'string' || message.trim().length === 0 || message.length > 4000) {
      return errors.validation([
        { field: 'message', message: 'message must be 1-4000 characters' },
      ]);
    }

    if (
      typeof idempotencyKey !== 'string' ||
      idempotencyKey.trim().length === 0 ||
      idempotencyKey.length > 200
    ) {
      return errors.validation([
        { field: 'idempotencyKey', message: 'idempotencyKey must be 1-200 characters' },
      ]);
    }

    const response: AgentMessageResponse = {
      content: `Respuesta simulada del asistente: ${message}`,
    };
    return HttpResponse.json(response);
  }),
];
