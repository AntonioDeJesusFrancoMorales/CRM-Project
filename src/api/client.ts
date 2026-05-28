// Cliente HTTP delgado sobre fetch. Inyecta Bearer desde authStore,
// parsea JSON, lanza HttpError en !ok, y dispara logout automático en 401.

import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { HttpError } from './http-error';
import type { ApiError } from './types';

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

const BASE_URL: string = import.meta.env.VITE_API_BASE_URL || '/api';

async function request<T>(method: Method, path: string, body?: unknown): Promise<T> {
  const token = useAuthStore.getState().token;
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
      const hadSession = useAuthStore.getState().token !== null;
      useAuthStore.getState().logout();
      if (hadSession) {
        toast.error(payload.message || 'Tu sesión expiró. Vuelve a iniciar sesión.');
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
