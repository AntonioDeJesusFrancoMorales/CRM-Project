// Tests del item "Tableros" en el Sidebar — B7.7.
// Verifica que el item esté habilitado (sin disabled), sin badge "Próximamente",
// y que tenga el link correcto a /tableros.
// Patrón: RTL + MemoryRouter (Sidebar usa NavLink).

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import { Sidebar } from '@/components/layout/Sidebar';

// Necesitamos el auth store con un usuario mínimo para que el Sidebar no crashee.
// El store usa zustand — accedemos directamente al mock de auth.
import { useAuthStore } from '@/store/authStore';

function renderSidebar() {
  // Simular usuario logueado mínimo para que Sidebar funcione
  useAuthStore.setState({
    usuario: {
      id: '22222222-2222-2222-2222-222222222222',
      nombre: 'Test User',
      correo: 'test@test.com',
      rol_sistema: 'usuario',
      rol_empresa: null,
    },
    token: 'fake-token',
  });

  return render(
    <MemoryRouter initialEntries={['/tableros']}>
      <Sidebar />
    </MemoryRouter>,
  );
}

describe('Sidebar — item Tableros habilitado (B7.6)', () => {
  it('(a) item "Tableros" está presente en el sidebar', () => {
    renderSidebar();
    expect(screen.getByText('Tableros')).toBeInTheDocument();
  });

  it('(b) item "Tableros" es un NavLink (no un div disabled)', () => {
    renderSidebar();
    const link = screen.getByRole('link', { name: /tableros/i });
    expect(link).toBeInTheDocument();
    expect(link).not.toHaveAttribute('aria-disabled', 'true');
  });

  it('(c) badge "Próximamente" NO aparece junto al item Tableros', () => {
    renderSidebar();
    expect(screen.queryByText(/próximamente/i)).not.toBeInTheDocument();
  });

  it('(d) el NavLink de Tableros apunta a /tableros', () => {
    renderSidebar();
    const link = screen.getByRole('link', { name: /tableros/i });
    expect(link).toHaveAttribute('href', '/tableros');
  });
});
