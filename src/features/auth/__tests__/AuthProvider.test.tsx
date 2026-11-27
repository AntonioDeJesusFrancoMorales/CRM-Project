import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import { AuthProvider } from '../components/AuthProvider';
import { useAuthStore } from '@/store/authStore';
import {
  getKeycloakToken,
  getKeycloakUserFromToken,
  initKeycloak,
  isKeycloakAuthenticated,
  loginWithKeycloak,
  refreshToken,
  registerOnTokenExpired,
} from '@/lib/keycloak';

vi.mock('@/lib/keycloak', () => ({
  keycloak: {},
  initKeycloak: vi.fn(),
  loginWithKeycloak: vi.fn(),
  getKeycloakUserFromToken: vi.fn(),
  getKeycloakToken: vi.fn(),
  isKeycloakAuthenticated: vi.fn(),
  logoutWithKeycloak: vi.fn(),
  refreshToken: vi.fn(),
  registerOnTokenExpired: vi.fn(() => vi.fn()),
  MIN_VALIDITY: 120,
  REFRESH_INTERVAL: 60_000,
}));

const realUser = {
  subject: 'real-subject',
  username: 'real-user',
  email: 'real@example.test',
  usuario_id: 'real-user-id',
  super_usuario_id: null,
  roles: ['usuario'],
};

function SessionScreen() {
  const usuario = useAuthStore((state) => state.usuario);
  const token = useAuthStore((state) => state.token);
  const ready = useAuthStore((state) => state.isKeycloakReady);
  const location = useLocation();

  return (
    <main>
      <h1>Aplicación</h1>
      <output aria-label="Sesión">{JSON.stringify({ usuario, token, ready })}</output>
      <output aria-label="Ruta">{location.pathname}</output>
    </main>
  );
}

function renderProvider(path = '/tratos') {
  return render(
    <StrictMode>
      <MemoryRouter initialEntries={[path]}>
        <AuthProvider>
          <SessionScreen />
        </AuthProvider>
      </MemoryRouter>
    </StrictMode>,
  );
}

function expectNoKeycloakCalls() {
  expect(initKeycloak).not.toHaveBeenCalled();
  expect(loginWithKeycloak).not.toHaveBeenCalled();
  expect(getKeycloakUserFromToken).not.toHaveBeenCalled();
  expect(getKeycloakToken).not.toHaveBeenCalled();
  expect(refreshToken).not.toHaveBeenCalled();
  expect(registerOnTokenExpired).not.toHaveBeenCalled();
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('DEV', true);
  vi.stubEnv('VITE_ENABLE_MSW', 'false');
  vi.stubEnv('VITE_BYPASS_AUTH', 'false');
  useAuthStore.setState({
    token: null,
    usuario: null,
    isKeycloakReady: false,
    isLoggingOut: false,
  });
  vi.mocked(isKeycloakAuthenticated).mockReturnValue(false);
  vi.mocked(initKeycloak).mockResolvedValue(true);
  vi.mocked(loginWithKeycloak).mockResolvedValue();
  vi.mocked(getKeycloakToken).mockReturnValue('real-token');
  vi.mocked(getKeycloakUserFromToken).mockReturnValue(realUser);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('AuthProvider — MSW de desarrollo', () => {
  it.each([
    ['/login', '/'],
    ['/tratos', '/tratos'],
  ])('abre %s como administrador mock sin Keycloak y termina en %s', async (path, destination) => {
    vi.stubEnv('VITE_ENABLE_MSW', 'true');
    renderProvider(path);

    expect(await screen.findByRole('heading', { name: 'Aplicación' })).toBeInTheDocument();
    expect(screen.getByLabelText('Ruta')).toHaveTextContent(destination);
    expect(JSON.parse(screen.getByLabelText('Sesión').textContent!)).toEqual({
      token: 'mock-dev-token',
      ready: true,
      usuario: {
        displayName: 'Ana Torres',
        subject: '8b43ac67-3c03-4804-ab09-40e3b7476940',
        username: 'admin',
        email: 'admin@pipely.local',
        usuario_id: 'b2000000-0000-4000-8000-000000000001',
        super_usuario_id: null,
        roles: ['admin'],
      },
    });
    expect(screen.queryByText('Cargando...')).not.toBeInTheDocument();
    expectNoKeycloakCalls();
  });
});

describe('AuthProvider — conserva la autenticación real', () => {
  it.each([
    { dev: true, msw: 'false', path: '/tratos', destination: '/tratos' },
    { dev: false, msw: 'true', path: '/login', destination: '/' },
    { dev: false, msw: 'false', path: '/tratos', destination: '/tratos' },
    { dev: true, msw: 'TRUE', path: '/tratos', destination: '/tratos' },
  ])('inicializa Keycloak con DEV=$dev y MSW=$msw', async ({ dev, msw, path, destination }) => {
    vi.stubEnv('DEV', dev);
    vi.stubEnv('VITE_ENABLE_MSW', msw);
    renderProvider(path);

    expect(await screen.findByRole('heading', { name: 'Aplicación' })).toBeInTheDocument();
    expect(initKeycloak).toHaveBeenCalled();
    expect(getKeycloakUserFromToken).toHaveBeenCalled();
    expect(loginWithKeycloak).not.toHaveBeenCalled();
    expect(JSON.parse(screen.getByLabelText('Sesión').textContent!)).toEqual({
      token: 'real-token',
      ready: true,
      usuario: realUser,
    });
    expect(screen.getByLabelText('Ruta')).toHaveTextContent(destination);
  });

  it.each([
    { dev: true, msw: 'false' },
    { dev: false, msw: 'true' },
  ])('sin sesión inicia login una sola vez con DEV=$dev y MSW=$msw', async ({ dev, msw }) => {
    vi.stubEnv('DEV', dev);
    vi.stubEnv('VITE_ENABLE_MSW', msw);
    vi.mocked(initKeycloak).mockResolvedValue(false);
    renderProvider();

    await waitFor(() => expect(loginWithKeycloak).toHaveBeenCalledTimes(1));
    expect(initKeycloak).toHaveBeenCalled();
    expect(getKeycloakUserFromToken).not.toHaveBeenCalled();
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().usuario).toBeNull();
    expect(useAuthStore.getState().isKeycloakReady).toBe(true);
  });
});

describe('AuthProvider — bypass explícito existente', () => {
  it.each([true, false])('mantiene VITE_BYPASS_AUTH=true con DEV=%s y sin MSW', async (dev) => {
    vi.stubEnv('DEV', dev);
    vi.stubEnv('VITE_BYPASS_AUTH', 'true');
    renderProvider('/login');

    expect(await screen.findByRole('heading', { name: 'Aplicación' })).toBeInTheDocument();
    expect(screen.getByLabelText('Ruta')).toHaveTextContent('/');
    expect(JSON.parse(screen.getByLabelText('Sesión').textContent!)).toEqual({
      token: 'mock-dev-token',
      ready: true,
      usuario: {
        subject: 'dev-user-id',
        username: 'dev',
        email: 'dev@local.test',
        usuario_id: 'dev-user-id',
        super_usuario_id: null,
        roles: ['admin'],
      },
    });
    expectNoKeycloakCalls();
  });
});
