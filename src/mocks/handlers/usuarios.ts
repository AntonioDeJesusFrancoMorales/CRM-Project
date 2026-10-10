import { http, HttpResponse } from 'msw';
import { withDelay } from '@/mocks/utils/withDelay';
import { errors } from '@/mocks/utils/error';
import { nowIso } from '@/mocks/utils/crud';
import { usuariosFixture, toUsuarioDto } from '@/mocks/fixtures/usuarios';
import type { UsuarioMock } from '@/mocks/fixtures/usuarios';
import type { Usuario } from '@/api/types';

const API = '/api';

// Handlers RPC del back — rutas /get-all, /create, /edit?id=, /delete?id=, /get-by-id?id=.
// El id va siempre como query param (nunca en el path).
// Los handlers operan sobre usuariosFixture (UsuarioMock[]).
// Las respuestas pasan por toUsuarioDto para excluir password, rol_sistema, rol_empresa.
export const usuariosHandlers = [
  // GET /api/usuarios/get-all — retorna lista completa
  http.get(`${API}/usuarios/get-all`, async () => {
    await withDelay();
    return HttpResponse.json(usuariosFixture.map(toUsuarioDto));
  }),

  // GET /api/usuarios/get-by-id?id= — retorna usuario individual por query param
  http.get(`${API}/usuarios/get-by-id`, async ({ request }) => {
    await withDelay();
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const u = usuariosFixture.find((x) => x.id === id);
    return u ? HttpResponse.json(toUsuarioDto(u)) : errors.notFound();
  }),

  // POST /api/usuarios/create — crea usuario; body: nombre, correo, rolId, initialPassword
  http.post(`${API}/usuarios/create`, async ({ request }) => {
    await withDelay();
    const body = (await request.json()) as Record<string, unknown>;

    // Validacion basica: campos requeridos
    const missing: Array<{ field: string; message: string }> = [];
    if (!body['nombre']) missing.push({ field: 'nombre', message: 'El nombre es requerido' });
    if (!body['correo']) missing.push({ field: 'correo', message: 'El correo es requerido' });
    if (!body['rolId']) missing.push({ field: 'rolId', message: 'El rol es requerido' });
    if (!body['initialPassword']) missing.push({ field: 'initialPassword', message: 'La contrasena inicial es requerida' });
    if (missing.length > 0) {
      return errors.validation(missing);
    }

    const nuevo: UsuarioMock = {
      id: crypto.randomUUID(),
      nombre: String(body['nombre']),
      correo: String(body['correo']),
      rolId: String(body['rolId']),
      creadoEn: nowIso(),
      activo: true,
      keycloakId: (body['keycloakId'] as string | null) ?? null,
      password: String(body['initialPassword']),
      rol_sistema: 'usuario',
      rol_empresa: null,
    };
    usuariosFixture.push(nuevo);
    // La response NO incluye initialPassword ni campos de auth
    return HttpResponse.json(toUsuarioDto(nuevo), { status: 201 });
  }),

  // PUT /api/usuarios/edit?id= — actualiza usuario; id en query param; sin activo ni initialPassword
  http.put(`${API}/usuarios/edit`, async ({ request }) => {
    await withDelay();
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const idx = usuariosFixture.findIndex((u) => u.id === id);
    if (idx === -1) return errors.notFound();

    const body = (await request.json()) as Record<string, unknown>;

    // Validacion basica para edit
    const details: Array<{ field: string; message: string }> = [];
    if (body['nombre'] !== undefined && !body['nombre']) {
      details.push({ field: 'nombre', message: 'El nombre no puede estar vacio' });
    }
    if (body['correo'] !== undefined && !body['correo']) {
      details.push({ field: 'correo', message: 'El correo no puede estar vacio' });
    }
    if (details.length > 0) {
      return errors.validation(details);
    }

    // NO se actualiza activo ni se acepta initialPassword
    const { activo: _activo, initialPassword: _ip, password: _pw, ...safeBody } = body as {
      activo?: unknown;
      initialPassword?: unknown;
      password?: unknown;
      [key: string]: unknown;
    };

    usuariosFixture[idx] = {
      ...usuariosFixture[idx]!,
      ...(safeBody as Partial<UsuarioMock>),
    };
    return HttpResponse.json(toUsuarioDto(usuariosFixture[idx]!));
  }),

  // DELETE /api/usuarios/delete?id= — elimina usuario; responde 204
  http.delete(`${API}/usuarios/delete`, async ({ request }) => {
    await withDelay();
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const idx = usuariosFixture.findIndex((u) => u.id === id);
    if (idx === -1) return errors.notFound();
    usuariosFixture.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),

];

// Re-exportamos el tipo para otros modulos que lo necesiten
export type { Usuario };
