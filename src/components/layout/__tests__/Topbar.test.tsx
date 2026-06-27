// Tests del Topbar — Phase 5.1 RED.
// Verifica que usa username y email (no nombre/correo).
// getInitials debe manejar usernames de una sola palabra.
// Layer: Integration (RTL).

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { Topbar } from '../Topbar';
import { useAuthStore } from '@/store/authStore';

// Topbar usa useLocation() para mostrar el título de la página — requiere un Router.
function renderTopbar() {
  return render(
    <MemoryRouter>
      <Topbar />
    </MemoryRouter>,
  );
}

// Mocks mínimos para evitar errores de hooks sin contexto
import { vi } from 'vitest';
vi.mock('@/features/auth/hooks/useLogout', () => ({
  useLogout: () => ({ mutate: vi.fn(), isPending: false }),
}));
// ThemeToggle requiere ThemeProvider — lo mockeamos con un stub sin-op para aislar el Topbar.
vi.mock('@/components/theme/ThemeToggle', () => ({
  ThemeToggle: () => null,
}));
vi.mock('@/features/global-search/components/GlobalSearch', () => ({
  GlobalSearch: () => null,
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────
const usuarioNombre = {
  subject: 'sub-1',
  username: 'Juan Pérez',
  email: 'juan@crm.test',
  usuario_id: 'usr-1',
  super_usuario_id: null,
  roles: [],
};

const usuarioSingleWord = {
  subject: 'sub-2',
  username: 'jdoe',
  email: 'jdoe@crm.test',
  usuario_id: 'usr-2',
  super_usuario_id: null,
  roles: [],
};

// ── Setup ─────────────────────────────────────────────────────────────────────
beforeEach(() => {
  useAuthStore.setState({ token: null, usuario: null });
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Topbar — usa username para iniciales y nombre', () => {
  it('(a) muestra iniciales derivadas de username con dos palabras (J P)', () => {
    useAuthStore.setState({ token: 'tok', usuario: usuarioNombre });
    renderTopbar();
    // getInitials("Juan Pérez") = "JP"
    expect(screen.getByText('JP')).toBeInTheDocument();
  });

  it('(b) muestra username como texto del botón', () => {
    useAuthStore.setState({ token: 'tok', usuario: usuarioNombre });
    renderTopbar();
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
  });
});

describe('Topbar — getInitials maneja username de una sola palabra', () => {
  it('(c) username="jdoe" → iniciales "JD" (2 primeros chars)', () => {
    useAuthStore.setState({ token: 'tok', usuario: usuarioSingleWord });
    renderTopbar();
    // getInitials("jdoe") con slice(0,2).toUpperCase() = "JD"
    expect(screen.getByText('JD')).toBeInTheDocument();
  });
});

describe('Topbar — dropdown muestra email', () => {
  it('(d) el dropdown label muestra el email del usuario al abrir el menú', async () => {
    const user = userEvent.setup();
    useAuthStore.setState({ token: 'tok', usuario: usuarioNombre });
    renderTopbar();
    // Abrir el dropdown del avatar — tiene texto con el username del usuario
    const trigger = screen.getByRole('button', { name: /juan pérez/i });
    await user.click(trigger);
    // El contenido del dropdown ahora está en el DOM
    expect(screen.getByText('juan@crm.test')).toBeInTheDocument();
  });
});
