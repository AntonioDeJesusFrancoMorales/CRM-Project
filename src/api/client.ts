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
    const fallback: ApiError = {
      status: res.status,
      error: 'UNKNOWN_ERROR',
      message: `Request failed with ${res.status}`,
    };
    const payload = (await res.json().catch(() => fallback)) as ApiError;

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
