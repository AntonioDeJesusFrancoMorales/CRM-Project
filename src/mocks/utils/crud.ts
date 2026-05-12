// Factory genérico de handlers CRUD para un dominio. Reduce boilerplate
// en handlers que solo siguen el patrón estándar GET/GET-by-id/POST/PATCH/DELETE.

import { http, HttpResponse, type HttpHandler } from 'msw';
import { withDelay } from './withDelay';
import { errors } from './error';

export function makeCrudHandlers<T extends { id: string }>(
  basePath: string,
  store: T[],
  factory: (body: Record<string, unknown>, id: string) => T,
  updater: (item: T, body: Record<string, unknown>) => T,
): HttpHandler[] {
  return [
    http.get(basePath, async () => {
      await withDelay();
      return HttpResponse.json(store);
    }),
    http.get(`${basePath}/:id`, async ({ params }) => {
      await withDelay();
      const item = store.find((i) => i.id === params['id']);
      return item ? HttpResponse.json(item) : errors.notFound();
    }),
    http.post(basePath, async ({ request }) => {
      await withDelay();
      const body = (await request.json()) as Record<string, unknown>;
      const item = factory(body, crypto.randomUUID());
      store.push(item);
      return HttpResponse.json(item, { status: 201 });
    }),
    http.patch(`${basePath}/:id`, async ({ params, request }) => {
      await withDelay();
      const idx = store.findIndex((i) => i.id === params['id']);
      if (idx === -1) return errors.notFound();
      const current = store[idx];
      if (!current) return errors.notFound();
      const body = (await request.json()) as Record<string, unknown>;
      const updated = updater(current, body);
      store[idx] = updated;
      return HttpResponse.json(updated);
    }),
    http.delete(`${basePath}/:id`, async ({ params }) => {
      await withDelay();
      const idx = store.findIndex((i) => i.id === params['id']);
      if (idx === -1) return errors.notFound();
      store.splice(idx, 1);
      return new HttpResponse(null, { status: 204 });
    }),
  ];
}

export const nowIso = (): string => new Date().toISOString();
