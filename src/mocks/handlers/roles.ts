import { http, HttpResponse } from 'msw';
import { withDelay } from '@/mocks/utils/withDelay';
import { errors } from '@/mocks/utils/error';
import { rolesFixture } from '@/mocks/fixtures/roles';
import { usuariosFixture } from '@/mocks/fixtures/usuarios';
import type { Rol } from '@/api/types';

const API = '/api';

// Handlers RPC del back para roles — rutas /get-all, /get-by-id?id=, /create, /edit?id=, /delete?id=.
// El id va siempre como query param (nunca en el path). Operan sobre rolesFixture (store mutable).
export const rolesHandlers = [
  // GET /api/roles/get-all — retorna lista completa de roles
  http.get(`${API}/roles/get-all`, async () => {
    await withDelay();
    return HttpResponse.json(rolesFixture);
  }),

  // GET /api/roles/get-by-id?id= — retorna un rol por id
  http.get(`${API}/roles/get-by-id`, async ({ request }) => {
    await withDelay();
    const id = new URL(request.url).searchParams.get('id');
    const rol = rolesFixture.find((r) => r.id === id);
    return rol ? HttpResponse.json(rol) : errors.notFound();
  }),

  // POST /api/roles/create — crea rol; body: nombre (req), descripcion (opt). activo = true siempre.
  http.post(`${API}/roles/create`, async ({ request }) => {
    await withDelay();
    const body = (await request.json()) as Record<string, unknown>;
    if (!body['nombre']) {
      return errors.validation([{ field: 'nombre', message: 'El nombre es requerido' }]);
    }
    const nuevo: Rol = {
      id: crypto.randomUUID(),
      nombre: String(body['nombre']),
      descripcion: (body['descripcion'] as string | null | undefined) ?? null,
      activo: true,
    };
    rolesFixture.push(nuevo);
    return HttpResponse.json(nuevo, { status: 201 });
  }),

  // PUT /api/roles/edit?id= — actualiza rol; id en query param. No se edita activo.
  http.put(`${API}/roles/edit`, async ({ request }) => {
    await withDelay();
    const id = new URL(request.url).searchParams.get('id');
    const idx = rolesFixture.findIndex((r) => r.id === id);
    if (idx === -1) return errors.notFound();

    const body = (await request.json()) as Record<string, unknown>;
    if (body['nombre'] !== undefined && !body['nombre']) {
      return errors.validation([{ field: 'nombre', message: 'El nombre no puede estar vacio' }]);
    }

    const current = rolesFixture[idx]!;
    rolesFixture[idx] = {
      ...current,
      ...(body['nombre'] !== undefined ? { nombre: String(body['nombre']) } : {}),
      ...(body['descripcion'] !== undefined
        ? { descripcion: (body['descripcion'] as string | null) ?? null }
        : {}),
    };
    return HttpResponse.json(rolesFixture[idx]);
  }),

  // DELETE /api/roles/delete?id= — elimina rol; 204.
  // Regla de negocio del back: si el rol tiene usuarios asignados → 409 Conflict.
  http.delete(`${API}/roles/delete`, async ({ request }) => {
    await withDelay();
    const id = new URL(request.url).searchParams.get('id');
    const idx = rolesFixture.findIndex((r) => r.id === id);
    if (idx === -1) return errors.notFound();

    const tieneUsuarios = usuariosFixture.some((u) => u.rolId === id);
    if (tieneUsuarios) {
      return errors.conflict('Este rol tiene usuarios asignados y no puede eliminarse');
    }

    rolesFixture.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
