import { http, HttpResponse } from 'msw';
import { findUsuarioByCreds, findUsuarioById, toUsuarioDto } from '@/mocks/fixtures/usuarios';
import { fakeJwt, decodeFakeJwt } from '@/mocks/utils/fake-jwt';
import { withDelay } from '@/mocks/utils/withDelay';
import { errors } from '@/mocks/utils/error';
import type { LoginResponse } from '@/api/types';

const API = '/api';

interface LoginBody {
  email?: string;
  password?: string;
}

export const authHandlers = [
  http.post(`${API}/auth/login`, async ({ request }) => {
    await withDelay();
    const body = (await request.json().catch(() => ({}))) as LoginBody;
    const details: Array<{ field: string; message: string }> = [];
    if (!body.email) details.push({ field: 'email', message: 'El correo es requerido' });
    if (!body.password) details.push({ field: 'password', message: 'La contraseña es requerida' });
    if (details.length > 0) return errors.validation(details);

    const user = findUsuarioByCreds(body.email!, body.password!);
    if (!user) return errors.unauthorized('Credenciales inválidas');

    // UsuarioSesion se construye directamente desde UsuarioMock (que tiene rol_sistema/rol_empresa).
    // toUsuarioDto ya no incluye esos campos (son exclusivos del mock de auth).
    const response: LoginResponse = {
      token: fakeJwt({ id: user.id, nombre: user.nombre, rol_sistema: user.rol_sistema }),
      usuario: {
        id: user.id,
        nombre: user.nombre,
        correo: user.correo,
        rol_sistema: user.rol_sistema,
        rol_empresa: user.rol_empresa,
      },
    };
    return HttpResponse.json(response);
  }),

  http.post(`${API}/auth/logout`, async () => {
    await withDelay();
    return HttpResponse.json({}, { status: 200 });
  }),

  http.get(`${API}/auth/me`, async ({ request }) => {
    await withDelay();
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return errors.unauthorized();
    const payload = decodeFakeJwt(authHeader.slice(7));
    if (!payload) return errors.unauthorized();
    if (payload.exp * 1000 < Date.now()) return errors.unauthorized('Token expirado');
    const user = findUsuarioById(payload.sub);
    if (!user) return errors.unauthorized();
    return HttpResponse.json({ usuario: toUsuarioDto(user) });
  }),

  // Stub: cambio de contraseña diferido (Change posterior).
  http.patch(`${API}/auth/me/password`, async () =>
    HttpResponse.json(
      { status: 501, error: 'NOT_IMPLEMENTED', message: 'Cambio de contraseña diferido a Change posterior' },
      { status: 501 },
    ),
  ),
];
