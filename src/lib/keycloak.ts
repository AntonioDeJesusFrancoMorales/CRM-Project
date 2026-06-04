import Keycloak, { type KeycloakInitOptions, type KeycloakTokenParsed } from 'keycloak-js';

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
  subject: string;           // token.sub
  username: string;          // token.preferred_username
  email: string;             // token.email
  usuario_id: string;        // token.usuario_id (claim custom, UUID)
  super_usuario_id: string | null; // token.super_usuario_id (null si usuario normal)
  roles: string[];           // token.realm_access.roles
}

type KeycloakTokenClaims = KeycloakTokenParsed & {
  name?: string;
  given_name?: string;
  family_name?: string;
  preferred_username?: string;
  email?: string;
  usuario_id?: string;
  super_usuario_id?: string;
  realm_access?: { roles?: string[] };
};

// Lee los datos del usuario directamente del access token ya parseado por keycloak-js.
// Evita llamar al endpoint /account (loadUserProfile), que rechaza el token con 401
// porque su audience es crm2-api y no account. Todos los datos viven en el token.
// El modelo retornado es isomorfo al ActorContext del back.
export function getKeycloakUserFromToken(): KeycloakUser | null {
  const token = keycloak.tokenParsed as KeycloakTokenClaims | undefined;
  if (!token) return null;

  return {
    subject: token.sub ?? keycloak.subject ?? '',
    username: token.preferred_username || token.email || 'unknown',
    email: token.email || '',
    usuario_id: token.usuario_id || keycloak.subject || '',
    super_usuario_id: token.super_usuario_id ?? null,
    roles: token.realm_access?.roles ?? [],
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
