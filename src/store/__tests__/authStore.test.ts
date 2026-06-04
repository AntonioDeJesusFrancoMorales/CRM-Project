// Tests del authStore — Phase 3.1 RED.
// Verifica que setKeycloakSession persiste el nuevo shape (ActorContext-aligned)
// y que la versión del store protege contra shapes viejos al rehidratar.
// Layer: Unit (Zustand store directo, sin render).

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '../authStore';

// Mockeamos keycloak para que getKeycloakToken retorne un valor controlable
vi.mock('@/lib/keycloak', () => ({
  keycloak: { token: 'mock-token', authenticated: true },
  getKeycloakToken: vi.fn(() => 'mock-jwt-token'),
  isKeycloakAuthenticated: vi.fn(() => true),
  logoutWithKeycloak: vi.fn(),
  refreshToken: vi.fn(),
}));

describe('authStore — setKeycloakSession con modelo nuevo', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null, usuario: null });
  });

  it('(a) persiste subject, username, email, usuario_id, super_usuario_id, roles', () => {
    useAuthStore.getState().setKeycloakSession({
      subject: 'sub-admin',
      username: 'admin_user',
      email: 'admin@crm.test',
      usuario_id: 'usr-uuid-admin',
      super_usuario_id: 'super-uuid-001',
      roles: ['SUPER_USUARIO'],
    });

    const { usuario, token } = useAuthStore.getState();

    expect(token).toBe('mock-jwt-token');
    expect(usuario).not.toBeNull();
    expect(usuario!.subject).toBe('sub-admin');
    expect(usuario!.username).toBe('admin_user');
    expect(usuario!.email).toBe('admin@crm.test');
    expect(usuario!.usuario_id).toBe('usr-uuid-admin');
    expect(usuario!.super_usuario_id).toBe('super-uuid-001');
    expect(usuario!.roles).toEqual(['SUPER_USUARIO']);
  });

  it('(b) persiste super_usuario_id: null para usuario normal', () => {
    useAuthStore.getState().setKeycloakSession({
      subject: 'sub-normal',
      username: 'normal_user',
      email: 'normal@crm.test',
      usuario_id: 'usr-uuid-normal',
      super_usuario_id: null,
      roles: ['USUARIO'],
    });

    const { usuario } = useAuthStore.getState();

    expect(usuario).not.toBeNull();
    expect(usuario!.super_usuario_id).toBeNull();
    expect(usuario!.roles).toEqual(['USUARIO']);
  });
});

describe('authStore — version bump protege contra shapes viejos', () => {
  it('(c) el store tiene versión >= 2 (indicada en el persist middleware)', () => {
    // El Zustand persist tiene un campo `version` en su configuración.
    // Verificamos que el store expone la versión correcta via la API pública.
    // Si la versión es < 2 o no existe, al rehidratar un shape viejo
    // no habrá migración y el test de rehidratación fallará.
    const storeAPI = useAuthStore;
    // persist API: storeAPI.persist.getOptions() retorna la config del middleware
    const persistOptions = (storeAPI as unknown as { persist: { getOptions: () => { version?: number } } }).persist?.getOptions?.();
    expect(persistOptions?.version).toBeGreaterThanOrEqual(2);
  });
});
