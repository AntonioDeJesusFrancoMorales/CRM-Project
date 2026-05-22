import { http, HttpResponse } from 'msw';
import { nowIso } from '@/mocks/utils/crud';
import { withDelay } from '@/mocks/utils/withDelay';
import { errors } from '@/mocks/utils/error';
import { usuariosFixture, toUsuarioDto } from '@/mocks/fixtures/usuarios';
import type { Usuario } from '@/api/types';

const API = '/api/v1';

// Los handlers operan directamente sobre `usuariosFixture` (UsuarioMock[]),
// que incluye `password`. Las respuestas pasan por `toUsuarioDto` para excluirlo.
// Patrón equivalente al de Empresas, pero hand-written por la asimetría de la fixture.
export const usuariosHandlers = [
  http.get(`${API}/usuarios`, async () => {
    await withDelay();
    return HttpResponse.json(usuariosFixture.map(toUsuarioDto));
  }),

  http.get(`${API}/usuarios/:id`, async ({ params }) => {
    await withDelay();
    const u = usuariosFixture.find((x) => x.id === params['id']);
    return u ? HttpResponse.json(toUsuarioDto(u)) : errors.notFound();
  }),

  http.post(`${API}/usuarios`, async ({ request }) => {
    await withDelay();
    const body = (await request.json()) as Record<string, unknown>;
    const nuevo = {
      id: crypto.randomUUID(),
      nombre: String(body['nombre'] ?? ''),
      correo: String(body['correo'] ?? ''),
      password: '', // mock — usuarios creados desde la UI quedan sin password funcional
      rol_sistema: (body['rol_sistema'] as Usuario['rol_sistema']) ?? 'usuario',
      rol_empresa: (body['rol_empresa'] as string | null) ?? null,
      activo: true,
      creado_en: nowIso(),
    };
    usuariosFixture.push(nuevo);
    return HttpResponse.json(toUsuarioDto(nuevo), { status: 201 });
  }),

  http.patch(`${API}/usuarios/:id`, async ({ params, request }) => {
    await withDelay();
    const idx = usuariosFixture.findIndex((u) => u.id === params['id']);
    if (idx === -1) return errors.notFound();
    const body = (await request.json()) as Record<string, unknown>;
    const updated = { ...usuariosFixture[idx]!, ...body };
    usuariosFixture[idx] = updated;
    return HttpResponse.json(toUsuarioDto(updated));
  }),

  http.delete(`${API}/usuarios/:id`, async ({ params }) => {
    await withDelay();
    const idx = usuariosFixture.findIndex((u) => u.id === params['id']);
    if (idx === -1) return errors.notFound();
    usuariosFixture.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  http.patch(`${API}/usuarios/:id/desactivar`, async ({ params }) => {
    await withDelay();
    const idx = usuariosFixture.findIndex((u) => u.id === params['id']);
    if (idx === -1) return errors.notFound();
    usuariosFixture[idx]!.activo = false;
    return HttpResponse.json(toUsuarioDto(usuariosFixture[idx]!));
  }),
];
