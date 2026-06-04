import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UsuarioSesion } from '@/api/types';
import { keycloak, type KeycloakUser, logoutWithKeycloak, refreshToken, getKeycloakToken, isKeycloakAuthenticated } from '@/lib/keycloak';

export type AuthUser = UsuarioSesion;

interface AuthState {
  token: string | null;
  usuario: AuthUser | null;
  isKeycloakReady: boolean;
  setSession: (token: string, usuario: AuthUser) => void;
  setKeycloakSession: (user: KeycloakUser) => void;
  setKeycloakReady: (ready: boolean) => void;
  logout: () => Promise<void>;
  refreshKeycloakToken: () => Promise<boolean>;
  getCurrentToken: () => string | null;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      usuario: null,
      isKeycloakReady: false,

      setSession: (token, usuario) => set({ token, usuario }),

      setKeycloakSession: (user: KeycloakUser) => {
        const token = getKeycloakToken();
        if (token) {
          set({
            token,
            usuario: {
              subject: user.subject,
              username: user.username,
              email: user.email,
              usuario_id: user.usuario_id,
              super_usuario_id: user.super_usuario_id,
              roles: user.roles,
            },
          });
        }
      },

      setKeycloakReady: (ready) => set({ isKeycloakReady: ready }),

      logout: async () => {
        set({ token: null, usuario: null });
        await logoutWithKeycloak();
      },

      refreshKeycloakToken: async () => {
        const success = await refreshToken();
        if (success) {
          const token = getKeycloakToken();
          if (token) {
            set({ token });
          }
        }
        return success;
      },

      getCurrentToken: () => {
        const state = get();
        if (state.token && isKeycloakAuthenticated()) {
          return state.token;
        }
        return keycloak.token || state.token;
      },

      isAuthenticated: () => {
        return isKeycloakAuthenticated();
      },
    }),
    {
      name: 'crm-auth',
      version: 2,
      partialize: (state) => ({ usuario: state.usuario }),
      // Al rehidratar: si el shape persisted no tiene `subject` (shape v1 o anterior),
      // se invalida el usuario para forzar un nuevo login.
      migrate: (persistedState: unknown, version: number) => {
        if (version < 2) {
          // Shape viejo (v1 o sin versión) — invalidamos usuario
          return { usuario: null };
        }
        return persistedState as { usuario: unknown };
      },
    },
  ),
);
