// Tests de routing Lote E — Strict TDD T_E.1
// Cubre: (a) /tareas renderiza TareasListPage; (b) /tareas/:id renderiza TareaDetailPage;
// (c) NavItem "Mis tareas" existe y apunta a /tareas?responsable_id del usuario logueado.
// (d) TareasListPage inicializa filtro responsable desde query param responsable_id.

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router';

import { TareasListPage } from '../pages/TareasListPage';
import { TareaDetailPage } from '../pages/TareaDetailPage';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuthStore } from '@/store/authStore';

// ── IDs de fixtures ────────────────────────────────────────────────────────────
const USUARIO_ID = '22222222-2222-2222-2222-222222222222';
const TAREA_ID = 'e1111111-eeee-1111-eeee-111111111111'; // "Demo presencial con CTO"

// ── Helpers ────────────────────────────────────────────────────────────────────
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

function renderRoute(path: string, routes: React.ReactNode) {
  return render(
    <QueryClientProvider client={makeQueryClient()}>
      <MemoryRouter initialEntries={[path]}>{routes}</MemoryRouter>
    </QueryClientProvider>,
  );
}

// ── Setup ──────────────────────────────────────────────────────────────────────
beforeEach(() => {
  useAuthStore.setState({
    token: 'fake-token',
    usuario: {
      subject: 'sub-test',
      username: 'María González',
      email: 'maria@crm.test',
      usuario_id: USUARIO_ID,
      super_usuario_id: 'super-uuid-001',
      roles: ['SUPER_USUARIO'],
    },
  });
});

// ── Tests ──────────────────────────────────────────────────────────────────────
describe('Routing tareas', () => {
  it('(a) /tareas renderiza TareasListPage', async () => {
    renderRoute(
      '/tareas',
      <Routes>
        <Route path="/tareas" element={<TareasListPage />} />
      </Routes>,
    );

    // El heading "Tareas" es el marcador de TareasListPage
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Tareas' })).toBeInTheDocument(),
    );
  });

  it('(b) /tareas/:id renderiza TareaDetailPage', async () => {
    renderRoute(
      `/tareas/${TAREA_ID}`,
      <Routes>
        <Route path="/tareas" element={<TareasListPage />} />
        <Route path="/tareas/:id" element={<TareaDetailPage />} />
      </Routes>,
    );

    // TareaDetailPage muestra el título de la tarea del fixture para TAREA_ID
    await waitFor(() =>
      expect(screen.getByText('Demo presencial con CTO')).toBeInTheDocument(),
    );
  });

  it('(c) NavItem "Mis tareas" existe en el sidebar con href que contiene responsable_id del usuario logueado', () => {
    renderRoute(
      '/tareas',
      <Routes>
        <Route
          path="*"
          element={
            <Sidebar />
          }
        />
      </Routes>,
    );

    const link = screen.getByRole('link', { name: /mis tareas/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', expect.stringContaining(USUARIO_ID));
  });

  it('(d) TareasListPage inicializa filtro responsable desde query param responsable_id (en tab Lista)', async () => {
    // Navegar a /tareas?tab=lista&responsable_id=USUARIO_ID debe inicializar el Select de Responsable.
    // ?tab=lista es necesario porque kanban es el tab por defecto y los filtros solo son visibles en Lista.
    renderRoute(
      `/tareas?tab=lista&responsable_id=${USUARIO_ID}`,
      <Routes>
        <Route path="/tareas" element={<TareasListPage />} />
      </Routes>,
    );

    await userEvent.setup().click(screen.getByRole('button', { name: /mostrar filtros/i }));

    // Esperar que la página cargue y que el trigger del Select de responsable
    // muestre el nombre del usuario una vez que los usuarios del fixture estén disponibles.
    // María González está en el fixture de usuarios (id 22222222)
    await waitFor(() => {
      const responsableTrigger = screen.getByRole('combobox', { name: /responsable/i });
      expect(responsableTrigger).toHaveTextContent('María González');
    });
  });
});
