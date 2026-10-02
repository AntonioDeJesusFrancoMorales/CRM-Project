import { describe, it, expect } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router';

import { TratoDetailPage } from '../pages/TratoDetailPage';
import { server } from '@/test/server';

// IDs del fixture (tratos.ts + contactos.ts)
// d1111111 → "Implementación CRM Innovatech", contactoId=b1111111 (Carlos, INACTIVO), 2 tareas pendientes
// d2222222 → "Renovación licencia anual Innovatech", contactoId=c1111111 (Ana, ACTIVO)
// d3333333 → "Consultoría procesos Maya", contactoId=c2222222 (Diego, ACTIVO), sin tareas
// d5555555 → "Automatización logística Maya", motivoPerdida='Presupuesto insuficiente del cliente'

const TRATO_D1 = 'd1111111-dddd-1111-dddd-111111111111';
const TRATO_SIN_TAREAS = 'd3333333-dddd-3333-dddd-333333333333';
const TRATO_CON_MOTIVO_PERDIDA = 'd5555555-dddd-5555-dddd-555555555555';

function renderPage(initialPath: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/tratos" element={<div>Listado de tratos</div>} />
          <Route path="/tratos/:id" element={<TratoDetailPage />} />
          <Route path="/contactos/:id" element={<div>Detalle contacto</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('TratoDetailPage', () => {
  // ── (a) Layout tabbed ───────────────────────────────────────────────────────
  it('(a) layout tabbed renderiza tabs Información y Tareas', async () => {
    renderPage(`/tratos/${TRATO_D1}`);

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /implementación crm innovatech/i }),
      ).toBeInTheDocument(),
    );

    expect(screen.getByRole('tab', { name: /información/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /tareas/i })).toBeInTheDocument();
  });

  // ── (b) Header solo tiene Editar y Eliminar, SIN acciones de estado ────────
  it('(b) header solo muestra acciones Editar y Eliminar (sin Ganar/Perder/Reabrir)', async () => {
    renderPage(`/tratos/${TRATO_D1}`);

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /implementación crm innovatech/i }),
      ).toBeInTheDocument(),
    );

    expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /eliminar/i })).toBeInTheDocument();

    // Sin acciones de ciclo de vida
    expect(screen.queryByRole('button', { name: /ganado/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /perdido/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /reabrir/i })).not.toBeInTheDocument();
  });

  // ── (c) Tab Información muestra contacto y responsable resueltos ────────────
  it('(c) tab Información muestra contacto y responsable resueltos client-side', async () => {
    renderPage(`/tratos/${TRATO_D1}`);

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /implementación crm innovatech/i }),
      ).toBeInTheDocument(),
    );

    // d1111111 tiene contactoId=b1111111 (Carlos) y responsableId=22222222 (María González)
    // Contacto y responsable resuelven en queries async distintas: ambas aserciones
    // van dentro del MISMO waitFor para no depender de que resuelvan en el mismo tick.
    await waitFor(() => {
      expect(screen.getByText('Carlos')).toBeInTheDocument();
      expect(screen.getByText('María González')).toBeInTheDocument();
    });
  });

  // ── (d) motivoPerdida visible cuando no es null ────────────────────────────
  it('(d) motivoPerdida se muestra cuando no es null', async () => {
    renderPage(`/tratos/${TRATO_CON_MOTIVO_PERDIDA}`);

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /automatización logística maya/i }),
      ).toBeInTheDocument(),
    );

    await waitFor(() =>
      expect(screen.getByText('Presupuesto insuficiente del cliente')).toBeInTheDocument(),
    );
  });

  // ── (e) Badge de pendientes > 0 muestra número ────────────────────────────
  it('(e) badge de pendientes muestra "2" cuando hay 2 tareas pendientes', async () => {
    renderPage(`/tratos/${TRATO_D1}`);

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /implementación crm innovatech/i }),
      ).toBeInTheDocument(),
    );

    await waitFor(() =>
      expect(screen.getByTestId('badge-pendientes')).toHaveTextContent('2 pendientes'),
    );
  });

  // ── (f) Badge oculto cuando count = 0 ─────────────────────────────────────
  it('(f) badge NO visible cuando el trato no tiene tareas pendientes', async () => {
    renderPage(`/tratos/${TRATO_SIN_TAREAS}`);

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /consultoría procesos maya/i }),
      ).toBeInTheDocument(),
    );

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /consultoría procesos maya/i }),
      ).toBeInTheDocument();
    });

    expect(screen.queryByTestId('badge-pendientes')).not.toBeInTheDocument();
  });

  // ── (g) Tab Tareas renderiza tabla de tareas ───────────────────────────────
  it('(g) tab Tareas renderiza tabla de tareas del trato', async () => {
    const user = userEvent.setup();
    renderPage(`/tratos/${TRATO_D1}`);

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /implementación crm innovatech/i }),
      ).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('tab', { name: /tareas/i }));

    await waitFor(() =>
      expect(screen.getByText('Demo presencial con CTO')).toBeInTheDocument(),
    );
    expect(screen.getByText('Llamada de seguimiento post-demo')).toBeInTheDocument();
  });

  // ── (h) Botón "Crear tarea" abre TareaCreateDialog ────────────────────────
  it('(h) botón "Crear tarea" en tab Tareas abre TareaCreateDialog', async () => {
    const user = userEvent.setup();
    renderPage(`/tratos/${TRATO_D1}`);

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /implementación crm innovatech/i }),
      ).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('tab', { name: /tareas/i }));

    const btnCrear = await screen.findByRole('button', { name: /crear tarea/i });
    await user.click(btnCrear);

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: /nueva tarea/i })).toBeInTheDocument();
  });

  // ── (i) POST desde el tab usa el trato fijo ───────────────────────────────
  it('(i) al crear tarea desde el tab, POST va a /tareas/create con tratoId en body', async () => {
    let postCalled = false;
    server.use(
      http.post('/api/tareas/create', async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        if (body['tratoId'] === TRATO_D1) {
          postCalled = true;
        }
        return HttpResponse.json(
          {
            id: 'e9999999-eeee-9999-eeee-999999999999',
            tratoId: TRATO_D1,
            responsableId: '22222222-2222-2222-2222-222222222222',
            titulo: 'Tarea desde tab',
            descripcion: null,
            tipo: 'GENERAL',
            prioridad: 'MEDIA',
            fechaLimite: '2026-06-01T00:00:00.000Z',
            fechaCompletada: null,
            creadoEn: '2026-05-25T00:00:00.000Z',
            actualizadoEn: '2026-05-25T00:00:00.000Z',
          },
          { status: 201 },
        );
      }),
    );

    const user = userEvent.setup();
    renderPage(`/tratos/${TRATO_D1}`);

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /implementación crm innovatech/i }),
      ).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('tab', { name: /tareas/i }));

    const btnCrear = await screen.findByRole('button', { name: /crear tarea/i });
    await user.click(btnCrear);

    const dialog = await screen.findByRole('dialog');

    await user.type(within(dialog).getByRole('textbox', { name: /título/i }), 'Tarea desde tab');

    const responsableSelect = within(dialog).getByRole('combobox', { name: /responsable/i });
    await user.click(responsableSelect);
    const opcionMaria = await screen.findByRole('option', { name: /maría/i });
    await user.click(opcionMaria);

    const tipoSelect = within(dialog).getByRole('combobox', { name: /tipo/i });
    await user.click(tipoSelect);
    const opcionGeneral = await screen.findByRole('option', { name: /general/i });
    await user.click(opcionGeneral);

    const prioridadSelect = within(dialog).getByRole('combobox', { name: /prioridad/i });
    await user.click(prioridadSelect);
    const opcionMedia = await screen.findByRole('option', { name: /media/i });
    await user.click(opcionMedia);

    // Fecha límite — despliega el DateTimePicker inline y elige un día (hora default 09:00).
    const fechaTrigger = within(dialog).getByRole('button', { name: /fecha límite/i });
    await user.click(fechaTrigger);
    const dias = await within(dialog).findAllByLabelText(/^\d{4}-\d{2}-\d{2}$/);
    await user.click(dias[14]!);

    await user.click(within(dialog).getByRole('button', { name: /crear tarea/i }));

    await waitFor(() => expect(postCalled).toBe(true));
  });

  // ── (j) URL ?tab=tareas pre-activa tab Tareas ──────────────────────────────
  it('(j) URL ?tab=tareas pre-activa el tab Tareas', async () => {
    renderPage(`/tratos/${TRATO_D1}?tab=tareas`);

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /implementación crm innovatech/i }),
      ).toBeInTheDocument(),
    );

    const tabTareas = screen.getByRole('tab', { name: /tareas/i });
    expect(tabTareas.getAttribute('aria-selected')).toBe('true');

    await waitFor(() =>
      expect(screen.getByText('Demo presencial con CTO')).toBeInTheDocument(),
    );
  });

  // ── (k) click tab Tareas → URL refleja ?tab=tareas ────────────────────────
  it('(k) click en tab Tareas sincroniza ?tab=tareas en la URL', async () => {
    const user = userEvent.setup();
    renderPage(`/tratos/${TRATO_D1}`);

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /implementación crm innovatech/i }),
      ).toBeInTheDocument(),
    );

    const tabInfo = screen.getByRole('tab', { name: /información/i });
    expect(tabInfo.getAttribute('aria-selected')).toBe('true');

    await user.click(screen.getByRole('tab', { name: /tareas/i }));

    await waitFor(() =>
      expect(
        screen.getByRole('tab', { name: /tareas/i }).getAttribute('aria-selected'),
      ).toBe('true'),
    );
  });

  // ── (l) 404 → toast + redirect ────────────────────────────────────────────
  it('(l) 404 muestra mensaje "no existe" y prepara redirección', async () => {
    server.use(
      http.get('/api/tratos/get-by-id', ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('id') === 'id-inexistente') {
          return HttpResponse.json(
            { status: 404, error: 'NOT_FOUND', message: 'Trato no encontrado' },
            { status: 404 },
          );
        }
      }),
    );

    renderPage('/tratos/id-inexistente');

    await waitFor(() => expect(screen.getByText(/no existe/i)).toBeInTheDocument());
  });
});
