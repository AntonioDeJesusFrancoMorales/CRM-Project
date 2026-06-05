// Tests del hook useTokenRefresh — change harden-token-lifecycle.
// Verifica: (1) refresca con MARGEN (MIN_VALIDITY) en cada tick del intervalo,
// (2) si el refresh es imposible dispara el corte de sesión, (3) registra y LIMPIA
// el handler onTokenExpired al desmontar (no fuga callbacks).
// Layer: Unit (renderHook + fake timers; store y keycloak mockeados).

import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import type { ReactNode } from 'react';
import { useTokenRefresh } from '../useTokenRefresh';
import { useAuthStore } from '@/store/authStore';
import { registerOnTokenExpired } from '@/lib/keycloak';

vi.mock('@/lib/keycloak', () => ({
  keycloak: { token: 'jwt', authenticated: true },
  isKeycloakAuthenticated: vi.fn(() => true),
  registerOnTokenExpired: vi.fn(() => vi.fn()),
  logoutWithKeycloak: vi.fn(),
  refreshToken: vi.fn(() => Promise.resolve(true)),
  getKeycloakToken: vi.fn(() => 'jwt'),
  MIN_VALIDITY: 120,
  REFRESH_INTERVAL: 60_000,
}));

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

function wrapper({ children }: { children: ReactNode }) {
  return <MemoryRouter initialEntries={['/empresas']}>{children}</MemoryRouter>;
}

describe('useTokenRefresh', () => {
  let refreshSpy: Mock;
  let sessionExpiredSpy: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    refreshSpy = vi.fn(() => Promise.resolve(true));
    sessionExpiredSpy = vi.fn(() => Promise.resolve());
    useAuthStore.setState({
      token: 'jwt',
      isKeycloakReady: true,
      refreshKeycloakToken: refreshSpy as never,
      handleSessionExpired: sessionExpiredSpy as never,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('(a) refresca con MIN_VALIDITY en cada tick del intervalo', async () => {
    renderHook(() => useTokenRefresh(), { wrapper });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });

    expect(refreshSpy).toHaveBeenCalledWith(120);
  });

  it('(b) si el refresh es imposible dispara handleSessionExpired', async () => {
    refreshSpy.mockResolvedValue(false);
    renderHook(() => useTokenRefresh(), { wrapper });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });

    expect(sessionExpiredSpy).toHaveBeenCalledTimes(1);
  });

  it('(c) registra onTokenExpired y lo limpia al desmontar', () => {
    const { unmount } = renderHook(() => useTokenRefresh(), { wrapper });

    expect(registerOnTokenExpired).toHaveBeenCalledTimes(1);
    const cleanup = (registerOnTokenExpired as Mock).mock.results[0].value as Mock;

    unmount();

    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});
