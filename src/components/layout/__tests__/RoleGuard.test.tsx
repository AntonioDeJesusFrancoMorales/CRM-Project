// Tests del RoleGuard — Phase 4.3 RED.
// Verifica que protege rutas admin basándose en super_usuario_id (no en rol_sistema).
// Layer: Integration (RTL + MemoryRouter).

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import { RoleGuard } from '../RoleGuard';
import { useAuthStore } from '@/store/authStore';

// ── Fixtures ──────────────────────────────────────────────────────────────────
const superUsuario = {
  subject: 'sub-admin',
  username: 'admin_user',
  email: 'admin@crm.test',
  usuario_id: 'usr-admin-uuid',
  super_usuario_id: 'super-uuid-001',
  roles: ['SUPER_USUARIO'],
};

const usuarioNormal = {
  subject: 'sub-normal',
  username: 'normal_user',
  email: 'normal@crm.test',
  usuario_id: 'usr-normal-uuid',
  super_usuario_id: null,
  roles: ['USUARIO'],
};

// ── Helper ────────────────────────────────────────────────────────────────────
function renderGuard() {
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route path="/empresas" element={<div>Redirigido a empresas</div>} />
        <Route element={<RoleGuard role="admin" />}>
          <Route path="/admin" element={<div>Zona admin</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

// ── Setup ─────────────────────────────────────────────────────────────────────
beforeEach(() => {
  useAuthStore.setState({ token: null, usuario: null });
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('RoleGuard — super usuario accede a ruta admin', () => {
  it('(a) super usuario (super_usuario_id non-null) ve el contenido protegido', () => {
    useAuthStore.setState({ token: 'tok', usuario: superUsuario });
    renderGuard();
    expect(screen.getByText('Zona admin')).toBeInTheDocument();
    expect(screen.queryByText('Redirigido a empresas')).not.toBeInTheDocument();
  });
});

describe('RoleGuard — usuario normal bloqueado en ruta admin', () => {
  it('(b) usuario normal (super_usuario_id null) es redirigido a /empresas', () => {
    useAuthStore.setState({ token: 'tok', usuario: usuarioNormal });
    renderGuard();
    expect(screen.getByText('Redirigido a empresas')).toBeInTheDocument();
    expect(screen.queryByText('Zona admin')).not.toBeInTheDocument();
  });
});

describe('RoleGuard — sin usuario autenticado', () => {
  it('(c) usuario null es redirigido a /empresas', () => {
    useAuthStore.setState({ token: null, usuario: null });
    renderGuard();
    expect(screen.getByText('Redirigido a empresas')).toBeInTheDocument();
    expect(screen.queryByText('Zona admin')).not.toBeInTheDocument();
  });
});
