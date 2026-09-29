import { http, HttpResponse } from 'msw';
import { withDelay } from '@/mocks/utils/withDelay';
import { errors } from '@/mocks/utils/error';
import { nowIso } from '@/mocks/utils/crud';
import { contactosFixture } from '@/mocks/fixtures/contactos';
import { tratosFixture } from '@/mocks/fixtures/tratos';
import type { Contacto } from '@/api/types';

const API = '/api';

export const contactosHandlers = [
  // GET /api/contactos/get-all — retorna lista completa sin filtros server-side
  http.get(`${API}/contactos/get-all`, async () => {
    await withDelay();
    return HttpResponse.json(contactosFixture);
  }),

  // GET /api/contactos/get-by-id?id= — retorna contacto por query param
  http.get(`${API}/contactos/get-by-id`, async ({ request }) => {
    await withDelay();
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const contacto = contactosFixture.find((c) => c.id === id);
    if (!contacto) return errors.notFound();
    return HttpResponse.json(contacto);
  }),

  // POST /api/contactos/create — crea contacto
  http.post(`${API}/contactos/create`, async ({ request }) => {
    await withDelay();
    const body = (await request.json()) as Record<string, unknown>;
    const contacto: Contacto = {
      id: crypto.randomUUID(),
      nombre: String(body['nombre'] ?? ''),
      correo: (body['correo'] as string | null) ?? null,
      telefono: (body['telefono'] as string | null) ?? null,
      empresaId: String(body['empresaId'] ?? ''),
      estadoRelacion: ((body['estadoRelacion'] as Contacto['estadoRelacion']) ?? 'PROSPECTO'),
      cargo: (body['cargo'] as string | null) ?? null,
      comoNosConocio: (body['comoNosConocio'] as string | null) ?? null,
      responsableId: (body['responsableId'] as string | null) ?? null,
      creadoPor: (body['creadoPor'] as string | null) ?? null,
      creadoEn: nowIso(),
      actualizadoEn: nowIso(),
    };
    contactosFixture.push(contacto);
    return HttpResponse.json(contacto, { status: 201 });
  }),

  // PUT /api/contactos/edit?id= — actualiza contacto por query param (no PATCH).
  // El back hace REEMPLAZO TOTAL y valida nombre @NotBlank + estadoRelacion @NotNull.
  // El mock replica esa validación para no enmascarar payloads incompletos.
  http.put(`${API}/contactos/edit`, async ({ request }) => {
    await withDelay();
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const idx = contactosFixture.findIndex((c) => c.id === id);
    if (idx === -1) return errors.notFound();
    const body = (await request.json()) as Record<string, unknown>;

    // Espejo de @NotBlank/@NotNull del back: si falta nombre o estadoRelacion → 400.
    const nombre = body['nombre'];
    if (typeof nombre !== 'string' || nombre.trim() === '') {
      return HttpResponse.json(
        { status: 400, error: 'BAD_REQUEST', message: 'nombre is required' },
        { status: 400 },
      );
    }
    if (!body['estadoRelacion']) {
      return HttpResponse.json(
        { status: 400, error: 'BAD_REQUEST', message: 'estadoRelacion is required' },
        { status: 400 },
      );
    }

    // empresaId y creadoPor son inmutables — no se permiten en el body de edición.
    const { empresaId: _eid, creadoPor: _cp, ...safeBody } = body;
    void _eid;
    void _cp;
    contactosFixture[idx] = {
      ...contactosFixture[idx]!,
      ...safeBody,
      actualizadoEn: nowIso(),
    } as Contacto;
    return HttpResponse.json(contactosFixture[idx]);
  }),

  // PUT /api/contactos/cambiar-estado?id= — cambia SOLO estadoRelacion (body { nuevoEstado }).
  http.put(`${API}/contactos/cambiar-estado`, async ({ request }) => {
    await withDelay();
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const idx = contactosFixture.findIndex((c) => c.id === id);
    if (idx === -1) return errors.notFound();
    const body = (await request.json()) as { nuevoEstado?: Contacto['estadoRelacion'] };
    if (!body.nuevoEstado) {
      return HttpResponse.json(
        { status: 400, error: 'BAD_REQUEST', message: 'nuevoEstado is required' },
        { status: 400 },
      );
    }
    contactosFixture[idx] = {
      ...contactosFixture[idx]!,
      estadoRelacion: body.nuevoEstado,
      actualizadoEn: nowIso(),
    };
    return HttpResponse.json(contactosFixture[idx]);
  }),

  // DELETE /api/contactos/delete?id= — elimina contacto; 409 si tiene tratos abiertos
  http.delete(`${API}/contactos/delete`, async ({ request }) => {
    await withDelay();
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const idx = contactosFixture.findIndex((c) => c.id === id);
    if (idx === -1) return errors.notFound();

    // Guard 409: el contacto tiene tratos si aparece como contactoId en algún trato.
    const tratosRelacionados = tratosFixture.filter((t) => t.contactoId === id);
    if (tratosRelacionados.length > 0) {
      return HttpResponse.json(
        {
          status: 409,
          error: 'CONFLICT',
          message: 'El contacto tiene tratos activos',
          details: [{ field: 'trato_id', message: tratosRelacionados[0]!.id }],
        },
        { status: 409 },
      );
    }

    contactosFixture.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
