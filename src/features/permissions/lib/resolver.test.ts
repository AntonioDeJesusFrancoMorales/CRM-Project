import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import type { Rol, Usuario } from '@/api/types';
import { resolveCapabilities } from './resolver';

vi.mock('@/api/client', () => ({
  apiClient: { get: vi.fn() },
}));

describe('resolveCapabilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolves the authenticated user and then its CRM role', async () => {
    const usuario: Usuario = {
      id: 'user-1',
      nombre: 'User One',
      correo: 'user@example.com',
      rolId: 'role-1',
      creadoEn: '2026-01-01T00:00:00Z',
      activo: true,
      keycloakId: 'keycloak-1',
    };
    const rol: Rol = {
      id: 'role-1',
      nombre: 'Operativo',
      descripcion: null,
      activo: true,
      permisos: [
        {
          recurso: 'TRATO',
          acciones: ['LEER'],
          alcance: 'TODO_COMPARTIDO',
          idsPermitidos: null,
          gruposLectura: null,
          gruposEscritura: null,
        },
      ],
    };
    const get = vi.mocked(apiClient.get);
    get.mockResolvedValueOnce(usuario).mockResolvedValueOnce(rol);

    await expect(resolveCapabilities(usuario.id)).resolves.toMatchObject({ usuario, rol });
    expect(get).toHaveBeenNthCalledWith(1, endpoints.usuarios.getById(usuario.id));
    expect(get).toHaveBeenNthCalledWith(2, endpoints.roles.getById(usuario.rolId));
  });

  it('fails closed when the user has no CRM role assignment', async () => {
    const get = vi.mocked(apiClient.get);
    get.mockResolvedValueOnce({ rolId: null });

    await expect(resolveCapabilities('user-without-role')).rejects.toThrow('rol CRM asignado');
    expect(get).toHaveBeenCalledTimes(1);
  });
});
