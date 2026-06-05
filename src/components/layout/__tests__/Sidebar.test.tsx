// Tests del Sidebar — Phase 4.1 RED.
// Verifica que isAdmin se deriva de super_usuario_id (no de rol_sistema),
// y que el link "Mis tareas" usa usuario_id.
// Layer: Integration (RTL + MemoryRouter).

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { Sidebar } from '../Sidebar';
import { useAuthStore } from '@/store/authStore';

// ── Fixtures ──────────────────────────────────────────────────────────────────
const SUPER_USUARIO_ID = 'super-uuid-001';
const USUARIO_ID = '22222222-2222-2222-2222-222222222222';

const superUsuario = {
  subject: 'sub-admin',
  username: 'admin_user',
  email: 'admin@crm.test',
  usuario_id: USUARIO_ID,
  super_usuario_id: SUPER_USUARIO_ID,
  roles: ['SUPER_USUARIO'],
};

const usuarioNormal = {
  subject: 'sub-normal',
  username: 'normal_user',
  email: 'normal@crm.test',
  usuario_id: USUARIO_ID,
  super_usuario_id: null,
  roles: ['USUARIO'],
};

// ── Helper ────────────────────────────────────────────────────────────────────
function renderSidebar() {
  return render(
    <MemoryRouter initialEntries={['/empresas']}>
      <Sidebar />
    </MemoryRouter>,
  );
}

// ── Setup ─────────────────────────────────────────────────────────────────────
beforeEach(() => {
  useAuthStore.setState({ token: null, usuario: null });
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Sidebar — isAdmin derivado de super_usuario_id', () => {
  it('(a) super usuario (super_usuario_id non-null) ve el item "Usuarios" (adminOnly)', () => {
    useAuthStore.setState({ token: 'tok', usuario: superUsuario });
    renderSidebar();
    expect(screen.getByRole('link', { name: /usuarios/i })).toBeInTheDocument();
  });

  it('(b) usuario normal (super_usuario_id null) NO ve el item "Usuarios" (adminOnly)', () => {
    useAuthStore.setState({ token: 'tok', usuario: usuarioNormal });
    renderSidebar();
    expect(screen.queryByRole('link', { name: /usuarios/i })).not.toBeInTheDocument();
  });
});

describe('Sidebar — link "Mis tareas" usa usuario_id', () => {
  it('(c) el link "Mis tareas" contiene usuario_id en el href', () => {
    useAuthStore.setState({ token: 'tok', usuario: superUsuario });
    renderSidebar();
    const link = screen.getByRole('link', { name: /mis tareas/i });
    expect(link).toHaveAttribute('href', expect.stringContaining(USUARIO_ID));
  });

  it('(d) el link "Mis tareas" contiene usuario_id del usuario normal', () => {
    useAuthStore.setState({ token: 'tok', usuario: usuarioNormal });
    renderSidebar();
    const link = screen.getByRole('link', { name: /mis tareas/i });
    expect(link).toHaveAttribute('href', expect.stringContaining(USUARIO_ID));
  });
});

describe('Sidebar — item "Configuración" (adminOnly)', () => {
  it('(e) super usuario (super_usuario_id non-null) VE el link "Configuración"', () => {
    useAuthStore.setState({ token: 'tok', usuario: superUsuario });
    renderSidebar();
    expect(screen.getByRole('link', { name: /configuración/i })).toBeInTheDocument();
  });

  it('(f) usuario normal (super_usuario_id null) NO ve el link "Configuración"', () => {
    useAuthStore.setState({ token: 'tok', usuario: usuarioNormal });
    renderSidebar();
    expect(screen.queryByRole('link', { name: /configuración/i })).not.toBeInTheDocument();
  });
});
