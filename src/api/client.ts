import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { HttpError } from './http-error';
import type { ApiError } from './types';
import { isKeycloakAuthenticated } from '@/lib/keycloak';

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

const BASE_URL: string = import.meta.env.VITE_API_BASE_URL || '/api';

async function request<T>(method: Method, path: string, body?: unknown, retryAfterRefresh = true): Promise<T> {
  const token = useAuthStore.getState().getCurrentToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const init: RequestInit = { method, headers };
  if (body !== undefined) init.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, init);

  if (!res.ok) {
    // El back puede responder { error: "<texto>" } (su forma RPC) o { status, error, message }.
    // Normalizamos a ApiError para que la UI siempre tenga un mensaje legible y el status real.
    const raw = (await res.json().catch(() => ({}))) as Partial<ApiError>;
    const payload: ApiError = {
      status: res.status,
      error: raw.error ?? 'UNKNOWN_ERROR',
      message: raw.message ?? raw.error ?? `Request failed with ${res.status}`,
      details: raw.details,
    };

    if (res.status === 401) {
      if (isKeycloakAuthenticated() && retryAfterRefresh) {
        const refreshed = await useAuthStore.getState().refreshKeycloakToken();
        if (refreshed) {
          return request<T>(method, path, body, false);
        }
      }

      if (!isKeycloakAuthenticated() && useAuthStore.getState().token !== null) {
        const logout = useAuthStore.getState().logout;
        await logout();
        toast.error('Tu sesión expiró. Vuelve a iniciar sesión.');
      }
    }

    // 403 Forbidden: el back rechazó esta operación puntual. IMPORTANTE: el back NO autoriza
    // por rol de negocio (solo exige autenticación), así que un 403 NO es una restricción de
    // rol que administre el front. Por eso acá NO deslogueamos ni inventamos mensajes del tipo
    // "no tenés permisos de rol": propagamos el HttpError con el mensaje real del back para que
    // el hook/UI lo muestre tal cual. La autorización real es responsabilidad del back.

    throw new HttpError(payload);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const apiClient = {
  get: <T>(path: string): Promise<T> => request<T>('GET', path),
  post: <T>(path: string, body?: unknown): Promise<T> => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown): Promise<T> => request<T>('PATCH', path, body),
  put: <T>(path: string, body?: unknown): Promise<T> => request<T>('PUT', path, body),
  delete: <T>(path: string): Promise<T> => request<T>('DELETE', path),
};
