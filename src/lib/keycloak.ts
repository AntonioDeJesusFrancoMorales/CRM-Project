import Keycloak, { type KeycloakInitOptions, type KeycloakProfile } from 'keycloak-js';

const keycloakUrl = import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8180';
const keycloakRealm = import.meta.env.VITE_KEYCLOAK_REALM || 'crm2-local';
const keycloakClientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'crm2-frontend';

export const keycloak = new Keycloak({
  url: keycloakUrl,
  realm: keycloakRealm,
  clientId: keycloakClientId,
});

let keycloakInitPromise: Promise<boolean> | null = null;

export interface KeycloakUser {
  id: string;
  nombre: string;
  correo: string;
  rol_sistema: 'admin' | 'usuario';
  rol_empresa: string | null;
}

export function mapKeycloakProfileToUser(profile: KeycloakProfile): KeycloakUser {
  const username = profile.username || profile.email || 'unknown';
  const nombre = profile.firstName && profile.lastName
    ? `${profile.firstName} ${profile.lastName}`
    : profile.firstName || username;

  const profileAny = profile as Record<string, unknown>;
  const roles = profileAny['kc:roles'] as string[] | undefined;
  const rol_sistema: 'admin' | 'usuario' = roles?.includes('admin') ? 'admin' : 'usuario';

  return {
    id: profile.id || username,
    nombre,
    correo: profile.email || username,
    rol_sistema,
    rol_empresa: null,
  };
}

export async function initKeycloak(): Promise<boolean> {
  if (keycloakInitPromise) {
    return keycloakInitPromise;
  }

  const initOptions: KeycloakInitOptions = {
    onLoad: 'check-sso',
    silentCheckSsoRedirectUri: window.location.origin + '/silent-sso.html',
    pkceMethod: 'S256',
    enableLogging: import.meta.env.DEV,
    flow: 'standard',
  };

  keycloakInitPromise = keycloak.init(initOptions).catch((error) => {
    keycloakInitPromise = null;
    console.error('Keycloak initialization failed:', error);
    return false;
  });

  return keycloakInitPromise;
}

export async function loginWithKeycloak(): Promise<void> {
  try {
    await keycloak.login({
      redirectUri: window.location.origin + '/empresas',
    });
  } catch (error) {
    console.error('Keycloak login failed:', error);
    throw error;
  }
}

export async function logoutWithKeycloak(): Promise<void> {
  try {
    await keycloak.logout({
      redirectUri: window.location.origin + '/login',
    });
  } catch (error) {
    console.error('Keycloak logout failed:', error);
    keycloak.clearToken();
  }
}

export async function refreshToken(): Promise<boolean> {
  try {
    const refreshed = await keycloak.updateToken(300);
    return refreshed;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return false;
  }
}

export function getKeycloakToken(): string | undefined {
  return keycloak.token;
}

export function isKeycloakAuthenticated(): boolean {
  return keycloak.authenticated ?? false;
}

export function getKeycloakUserProfile(): Promise<KeycloakProfile | null> {
  return keycloak.loadUserProfile();
}
