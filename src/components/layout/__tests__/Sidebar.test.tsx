// Tests del Sidebar.
// Tras align-authorization-to-backend-reality: los ítems "Usuarios" y "Configuración"
// se muestran a CUALQUIER usuario autenticado (no hay gate de rol; el back no lo enforza).
// El link "Mis tareas" usa usuario_id.
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

describe('Sidebar — "Usuarios" visible a cualquier autenticado', () => {
  it('(a) super usuario ve el item "Usuarios"', () => {
    useAuthStore.setState({ token: 'tok', usuario: superUsuario });
    renderSidebar();
    expect(screen.getByRole('link', { name: /usuarios/i })).toBeInTheDocument();
  });

  it('(b) usuario normal (super_usuario_id null) TAMBIÉN ve el item "Usuarios" (sin gate de rol)', () => {
    useAuthStore.setState({ token: 'tok', usuario: usuarioNormal });
    renderSidebar();
    expect(screen.getByRole('link', { name: /usuarios/i })).toBeInTheDocument();
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

describe('Sidebar — "Configuración" visible a cualquier autenticado', () => {
  it('(e) super usuario ve el link "Configuración"', () => {
    useAuthStore.setState({ token: 'tok', usuario: superUsuario });
    renderSidebar();
    expect(screen.getByRole('link', { name: /configuración/i })).toBeInTheDocument();
  });

  it('(f) usuario normal (super_usuario_id null) TAMBIÉN ve el link "Configuración" (sin gate de rol)', () => {
    useAuthStore.setState({ token: 'tok', usuario: usuarioNormal });
    renderSidebar();
    expect(screen.getByRole('link', { name: /configuración/i })).toBeInTheDocument();
  });
});
