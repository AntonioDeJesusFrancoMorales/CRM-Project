// Tests para getKeycloakUserFromToken — Phase 2.1 RED.
// Verifica que mapea tokenParsed al nuevo KeycloakUser (ActorContext-aligned).
// Layer: Unit (pura — mockea el singleton keycloak).

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mockeamos el módulo keycloak-js para controlar tokenParsed
vi.mock('keycloak-js', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      tokenParsed: undefined,
      subject: undefined,
    })),
  };
});

// Importamos después del mock
import { keycloak, getKeycloakUserFromToken } from '../keycloak';

describe('getKeycloakUserFromToken', () => {
  beforeEach(() => {
    // Resetear tokenParsed antes de cada test
    (keycloak as { tokenParsed: unknown }).tokenParsed = undefined;
  });

  it('(a) token con super_usuario_id retorna usuario con super_usuario_id non-null', () => {
    (keycloak as { tokenParsed: unknown }).tokenParsed = {
      sub: 'sub-admin-uuid',
      preferred_username: 'admin_user',
      email: 'admin@crm.test',
      usuario_id: 'usr-uuid-admin',
      super_usuario_id: 'super-uuid-001',
      realm_access: { roles: ['SUPER_USUARIO', 'USUARIO'] },
    };

    const result = getKeycloakUserFromToken();

    expect(result).not.toBeNull();
    expect(result!.subject).toBe('sub-admin-uuid');
    expect(result!.username).toBe('admin_user');
    expect(result!.email).toBe('admin@crm.test');
    expect(result!.usuario_id).toBe('usr-uuid-admin');
    expect(result!.super_usuario_id).toBe('super-uuid-001');
    expect(result!.roles).toEqual(['SUPER_USUARIO', 'USUARIO']);
  });

  it('(b) token sin super_usuario_id retorna super_usuario_id: null', () => {
    (keycloak as { tokenParsed: unknown }).tokenParsed = {
      sub: 'sub-normal-uuid',
      preferred_username: 'normal_user',
      email: 'normal@crm.test',
      usuario_id: 'usr-uuid-normal',
      // sin super_usuario_id
      realm_access: { roles: ['USUARIO'] },
    };

    const result = getKeycloakUserFromToken();

    expect(result).not.toBeNull();
    expect(result!.subject).toBe('sub-normal-uuid');
    expect(result!.username).toBe('normal_user');
    expect(result!.super_usuario_id).toBeNull();
    expect(result!.roles).toEqual(['USUARIO']);
  });

  it('(c) tokenParsed undefined retorna null', () => {
    (keycloak as { tokenParsed: unknown }).tokenParsed = undefined;

    const result = getKeycloakUserFromToken();

    expect(result).toBeNull();
  });

  it('(d) realm_access ausente retorna roles: []', () => {
    (keycloak as { tokenParsed: unknown }).tokenParsed = {
      sub: 'sub-noroles',
      preferred_username: 'noroles_user',
      email: 'noroles@crm.test',
      usuario_id: 'usr-noroles',
      // sin realm_access
    };

    const result = getKeycloakUserFromToken();

    expect(result).not.toBeNull();
    expect(result!.roles).toEqual([]);
  });
});
