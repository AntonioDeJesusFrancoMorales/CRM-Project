// Estado de autenticación. Persiste token + usuario en localStorage
// para que la sesión sobreviva al reload.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Usuario } from '@/api/types';

export type AuthUser = Pick<
  Usuario,
  'id' | 'nombre' | 'correo' | 'rol_sistema' | 'rol_empresa'
>;

interface AuthState {
  token: string | null;
  usuario: AuthUser | null;
  setSession: (token: string, usuario: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      usuario: null,
      setSession: (token, usuario) => set({ token, usuario }),
      logout: () => set({ token: null, usuario: null }),
    }),
    {
      name: 'crm-auth',
      // Solo persistimos los campos serializables, no las funciones.
      partialize: (state) => ({ token: state.token, usuario: state.usuario }),
    },
  ),
);
