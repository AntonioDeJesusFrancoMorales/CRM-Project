import { http, HttpResponse } from 'msw';
import { makeCrudHandlers, nowIso } from '@/mocks/utils/crud';
import { withDelay } from '@/mocks/utils/withDelay';
import { errors } from '@/mocks/utils/error';
import { usuariosFixture, toUsuarioDto } from '@/mocks/fixtures/usuarios';
import type { Usuario } from '@/api/types';

const API = '/api/v1';

// La fixture incluye password (mock). Las respuestas usan toUsuarioDto para excluirlo.
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
  ...makeCrudHandlers<Usuario>(
    `${API}/usuarios`,
    [], // store vacío para POST (en stub no persistimos creaciones de usuario reales)
    (body, id) => ({
      id,
      nombre: String(body['nombre'] ?? ''),
      correo: String(body['correo'] ?? ''),
      rol_sistema: (body['rol_sistema'] as Usuario['rol_sistema']) ?? 'usuario',
      rol_empresa: (body['rol_empresa'] as string | null) ?? null,
      activo: true,
      creado_en: nowIso(),
    }),
    (item, body) => ({ ...item, ...body }) as Usuario,
  ).slice(2), // toma solo POST/PATCH/DELETE; el GET de lista y detalle ya están arriba
  http.patch(`${API}/usuarios/:id/desactivar`, async ({ params }) => {
    await withDelay();
    const idx = usuariosFixture.findIndex((u) => u.id === params['id']);
    if (idx === -1) return errors.notFound();
    const user = usuariosFixture[idx]!;
    user.activo = false;
    return HttpResponse.json(toUsuarioDto(user));
  }),
];
