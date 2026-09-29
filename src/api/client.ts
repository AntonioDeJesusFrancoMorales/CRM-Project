import { useAuthStore } from '@/store/authStore';
import { HttpError } from './http-error';
import type { ApiError } from './types';
import { isKeycloakAuthenticated, MIN_VALIDITY } from '@/lib/keycloak';
import { localizeApiErrorMessage } from '@/lib/api-error';

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

const BASE_URL: string = import.meta.env.VITE_API_BASE_URL || '/api';

async function request<T>(method: Method, path: string, body?: unknown, retryAfterRefresh = true): Promise<T> {
  // Capa 2: refresh proactivo on-demand. Si el token está por vencer (≤MIN_VALIDITY) lo
  // renueva ANTES de salir; si aún es válido, updateToken es un no-op sin red. Cubre el
  // caso de tab en background con el setInterval throttleado. Solo en el intento original.
  if (retryAfterRefresh && isKeycloakAuthenticated()) {
    await useAuthStore.getState().refreshKeycloakToken(MIN_VALIDITY);
  }

  const token = useAuthStore.getState().getCurrentToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const init: RequestInit = {
    method,
    headers,
    // Las respuestas 304 no traen body. Para endpoints RPC/get-all consumidos por
    // React Query necesitamos siempre un JSON parseable; la cache del cliente ya la
    // administra React Query, no el HTTP cache del navegador/proxy.
    cache: method === 'GET' ? 'no-store' : undefined,
  };
  if (body !== undefined) init.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, init);

  if (!res.ok) {
    // El back puede responder { error: "<texto>" } (su forma RPC) o { status, error, message }.
    // Normalizamos a ApiError para que la UI siempre tenga un mensaje legible y el status real.
    const raw = (await res.json().catch(() => ({}))) as Partial<ApiError>;
    const payload: ApiError = {
      status: res.status,
      error: raw.error ?? 'UNKNOWN_ERROR',
      message: localizeApiErrorMessage(
        raw.message ?? raw.error ?? `Request failed with ${res.status}`,
        raw.details?.[0]?.field,
      ),
      details: raw.details,
    };

    if (res.status === 401) {
      // SINGLE RETRY: si todavía estamos autenticados y es el intento original, intentamos
      // un refresh reactivo y reintentamos UNA vez (retryAfterRefresh=false). Si el refresh
      // es imposible (refresh token vencido), cortamos la sesión. El reintento ya entra con
      // retryAfterRefresh=false, así que jamás hay recursión más allá de un retry.
      if (retryAfterRefresh) {
        if (isKeycloakAuthenticated()) {
          const refreshed = await useAuthStore.getState().refreshKeycloakToken();
          if (refreshed) {
            return request<T>(method, path, body, false);
          }
        }
        // Refresh imposible o sesión ausente: corte limpio e idempotente.
        if (useAuthStore.getState().token !== null) {
          await useAuthStore.getState().handleSessionExpired();
        }
      }
    }

    // 403 Forbidden: el back rechazó esta operación puntual. IMPORTANTE: el back NO autoriza
    // por rol de negocio (solo exige autenticación), así que un 403 NO es una restricción de
    // rol que administre el front. Por eso acá NO deslogueamos ni inventamos mensajes del tipo
    // "no tenés permisos de rol": propagamos el HttpError con el mensaje real del back para que
    // el hook/UI lo muestre tal cual. La autorización real es responsabilidad del back.

    throw new HttpError(payload);
  }

  // 204 No Content y 202 Accepted vienen SIN cuerpo (el back usa accepted().build() para
  // flujos async como request-password-change). Parsear JSON sobre body vacío tiraría error,
  // así que cortamos antes y devolvemos undefined.
  if (res.status === 204 || res.status === 202) return undefined as T;
  return (await res.json()) as T;
}

export const apiClient = {
  get: <T>(path: string): Promise<T> => request<T>('GET', path),
  post: <T>(path: string, body?: unknown): Promise<T> => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown): Promise<T> => request<T>('PATCH', path, body),
  put: <T>(path: string, body?: unknown): Promise<T> => request<T>('PUT', path, body),
  delete: <T>(path: string): Promise<T> => request<T>('DELETE', path),
};
