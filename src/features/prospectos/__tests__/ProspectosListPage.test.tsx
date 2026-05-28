import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { setupTestWrapper } from '@/test/wrappers';
import { ProspectosListPage } from '../pages/ProspectosListPage';
import { server } from '@/test/server';
import { useAuthStore } from '@/store/authStore';

// REQ-PROS-LISTADO-001..003, REQ-PROS-FILTROS-001..004, REQ-CONV-TAB-001..004
// REQ-PROS-ROUTING-001

// IDs de fixtures
const ADMIN_ID = '11111111-1111-1111-1111-111111111111';

beforeEach(() => {
  useAuthStore.setState({
    token: 'fake-token',
    usuario: {
      id: ADMIN_ID,
      nombre: 'Antonio Franco',
      correo: 'admin@crm.test',
      rol_sistema: 'admin',
      rol_empresa: 'Director Comercial',
    },
  });
});

describe('ProspectosListPage', () => {
  it('renderiza el Kanban con los prospectos activos del fixture', async () => {
    const { Wrapper } = setupTestWrapper(['/prospectos']);
    render(<ProspectosListPage />, { wrapper: Wrapper });

    // Esperar a que cargue la lista
    await waitFor(() =>
      expect(screen.getByText('Carlos Méndez')).toBeInTheDocument(),
    );

    // Columnas del Kanban presentes (getAllByText porque el label puede coincidir con el Select inline)
    expect(screen.getAllByText('Frío').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Tibio').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Caliente').length).toBeGreaterThanOrEqual(1);

    // Prospectos activos visibles (no convertidos)
    expect(screen.getByText('Lucía Pérez')).toBeInTheDocument();
    expect(screen.getByText('Roberto Sánchez')).toBeInTheDocument();

    // Los prospectos convertidos NO aparecen en el Kanban activo
    expect(screen.queryByText('Valentina Cruz')).not.toBeInTheDocument();
    expect(screen.queryByText('Marco Herrera')).not.toBeInTheDocument();
  });

  it('filtra los prospectos con el campo de búsqueda', async () => {
    const user = userEvent.setup();
    const { Wrapper } = setupTestWrapper(['/prospectos']);
    render(<ProspectosListPage />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(screen.getByText('Carlos Méndez')).toBeInTheDocument(),
    );

    // Buscar por nombre parcial
    const input = screen.getByPlaceholderText(/buscar/i);
    await user.type(input, 'Carlos');

    // Solo Carlos aparece en el Kanban
    expect(screen.getByText('Carlos Méndez')).toBeInTheDocument();
    expect(screen.queryByText('Lucía Pérez')).not.toBeInTheDocument();
    expect(screen.queryByText('Roberto Sánchez')).not.toBeInTheDocument();
  });

  it('muestra el tab Convertidos con Valentina Cruz en "este mes"', async () => {
    const user = userEvent.setup();
    const { Wrapper } = setupTestWrapper(['/prospectos']);
    render(<ProspectosListPage />, { wrapper: Wrapper });

    // Esperar carga inicial
    await waitFor(() =>
      expect(screen.getByText('Carlos Méndez')).toBeInTheDocument(),
    );

    // Cambiar al tab Convertidos
    const tabConvertidos = screen.getByRole('tab', { name: /convertidos/i });
    await user.click(tabConvertidos);

    // Sección "este mes" visible
    await waitFor(() =>
      expect(screen.getByText('Convertidos este mes')).toBeInTheDocument(),
    );

    // Valentina Cruz (convertida en mayo 2026 = este mes según el fixture y la fecha del test 2026-05-22)
    expect(screen.getByText('Valentina Cruz')).toBeInTheDocument();
  });

  it('abre el dialog "Nuevo prospecto" al hacer click en el botón', async () => {
    const user = userEvent.setup();
    const { Wrapper } = setupTestWrapper(['/prospectos']);
    render(<ProspectosListPage />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(screen.getByText('Carlos Méndez')).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('button', { name: /nuevo prospecto/i }));

    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByRole('heading', { name: /nuevo prospecto/i }),
    ).toBeInTheDocument();
  });

  // ── LOTE G — Fix 1: Filtros "Solo míos" y Select responsable ──────────────

  it('REQ-PROS-FILTROS-002: toggle "Solo míos" filtra prospectos por el usuario en sesión', async () => {
    const user = userEvent.setup();
    let capturedUrl = '';

    server.use(
      http.get('/api/prospectos', ({ request }) => {
        capturedUrl = request.url;
        // Devolver solo Roberto Sánchez que tiene responsable_id = ADMIN_ID
        const url = new URL(request.url);
        const responsableId = url.searchParams.get('responsable_id');
        if (responsableId === ADMIN_ID) {
          return HttpResponse.json([
            {
              id: 'b3333333-bbbb-3333-bbbb-333333333333',
              empresa_id: 'a3333333-aaaa-3333-aaaa-333333333333',
              responsable_id: ADMIN_ID,
              creado_por: ADMIN_ID,
              nombre_contacto: 'Roberto Sánchez',
              correo_contacto: null,
              telefono_contacto: null,
              cargo_contacto: null,
              como_nos_conocio: null,
              estado_posible_cliente: 'frio',
              notas: null,
              creado_en: '2026-04-20T16:00:00.000Z',
              actualizado_en: '2026-04-20T16:00:00.000Z',
            },
          ]);
        }
        return HttpResponse.json([]);
      }),
    );

    const { Wrapper } = setupTestWrapper(['/prospectos']);
    render(<ProspectosListPage />, { wrapper: Wrapper });

    // Esperar carga inicial
    await waitFor(() =>
      expect(screen.queryByText('Cargando prospectos...')).not.toBeInTheDocument(),
    );

    // Activar toggle "Solo míos"
    const toggleSoloMios = screen.getByRole('checkbox', { name: /solo míos/i });
    await user.click(toggleSoloMios);

    // Verificar que el query param fue enviado con el id del usuario en sesión
    await waitFor(() =>
      expect(capturedUrl).toContain(`responsable_id=${ADMIN_ID}`),
    );
  });

  it('REQ-PROS-FILTROS-003: Select de responsable pasa responsable_id al endpoint', async () => {
    const VENDEDOR_ID = '22222222-2222-2222-2222-222222222222';
    let capturedUrl = '';

    server.use(
      http.get('/api/prospectos', ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json([]);
      }),
    );

    const { Wrapper } = setupTestWrapper(['/prospectos']);
    render(<ProspectosListPage />, { wrapper: Wrapper });

    // Esperar carga inicial
    await waitFor(() =>
      expect(screen.queryByText('Cargando prospectos...')).not.toBeInTheDocument(),
    );

    // Abrir el Select de responsable y elegir a María González (vendedor)
    const selectResponsable = screen.getByRole('combobox', { name: /responsable/i });
    await userEvent.click(selectResponsable);

    const option = await screen.findByRole('option', { name: /maría gonzález/i });
    await userEvent.click(option);

    // Verificar que el query param fue enviado con el id del responsable seleccionado
    await waitFor(() =>
      expect(capturedUrl).toContain(`responsable_id=${VENDEDOR_ID}`),
    );
  });

  // ── LOTE G — Fix 2: Botón "Reintentar" en error state ─────────────────────

  it('REQ-PROS-LISTADO-001 Error: muestra botón "Reintentar" cuando el endpoint responde 500', async () => {
    let callCount = 0;

    server.use(
      http.get('/api/prospectos', () => {
        callCount += 1;
        if (callCount === 1) {
          // Primera llamada: 500
          return HttpResponse.json(
            { status: 500, error: 'INTERNAL_SERVER_ERROR', message: 'Boom' },
            { status: 500 },
          );
        }
        // Segunda llamada (refetch): éxito con Carlos Méndez
        return HttpResponse.json([
          {
            id: 'b1111111-bbbb-1111-bbbb-111111111111',
            empresa_id: 'a1111111-aaaa-1111-aaaa-111111111111',
            responsable_id: '22222222-2222-2222-2222-222222222222',
            creado_por: ADMIN_ID,
            nombre_contacto: 'Carlos Méndez',
            correo_contacto: null,
            telefono_contacto: null,
            cargo_contacto: null,
            como_nos_conocio: null,
            estado_posible_cliente: 'caliente',
            notas: null,
            creado_en: '2026-04-01T10:00:00.000Z',
            actualizado_en: '2026-05-08T14:30:00.000Z',
          },
        ]);
      }),
    );

    const user = userEvent.setup();
    const { Wrapper } = setupTestWrapper(['/prospectos']);
    render(<ProspectosListPage />, { wrapper: Wrapper });

    // Esperar a que aparezca el error state
    await waitFor(() =>
      expect(
        screen.getByText(/no fue posible cargar los prospectos/i),
      ).toBeInTheDocument(),
    );

    // Botón "Reintentar" debe estar visible
    const btnReintentar = screen.getByRole('button', { name: /reintentar/i });
    expect(btnReintentar).toBeInTheDocument();

    // Click en Reintentar → segunda llamada → lista se renderiza
    await user.click(btnReintentar);

    await waitFor(() =>
      expect(screen.getByText('Carlos Méndez')).toBeInTheDocument(),
    );
  });
});

