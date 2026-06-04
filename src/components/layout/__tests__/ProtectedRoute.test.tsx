import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';

import { ProtectedRoute } from '../ProtectedRoute';
import { useAuthStore } from '@/store/authStore';

function renderWithRouter(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<div>Pantalla de Login</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/empresas" element={<div>Contenido Protegido</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null, usuario: null });
  });

  it('redirige a /login cuando no hay token', () => {
    renderWithRouter('/empresas');
    expect(screen.getByText(/pantalla de login/i)).toBeInTheDocument();
    expect(screen.queryByText(/contenido protegido/i)).not.toBeInTheDocument();
  });

  it('renderiza el contenido protegido cuando hay token válido', () => {
    useAuthStore.setState({
      token: 'mock-token',
      usuario: {
        subject: 'sub-test',
        username: 'Test',
        email: 'test@test.com',
        usuario_id: 'usr-test-1',
        super_usuario_id: 'super-uuid-001',
        roles: ['SUPER_USUARIO'],
      },
    });

    renderWithRouter('/empresas');
    expect(screen.getByText(/contenido protegido/i)).toBeInTheDocument();
    expect(screen.queryByText(/pantalla de login/i)).not.toBeInTheDocument();
  });
});
