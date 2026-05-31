// Tests de componente para KanbanCard — contrato presentacional (Cambio 2 refactor).
// KanbanCard es PURAMENTE presentacional: recibe titulo, detalles y badge ya resueltos.
// No hace fetches internos. DnD real no testeable en jsdom — se testea la estructura.
// Batch 3 & 4 mantienen FichaForm, FichaCreateDialog y FichaDeleteDialog tests.
// Lote 6 añade tests de navegación: to prop, click navega, menu no navega.

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/server';
import type { Ficha } from '@/features/kanban/schemas/ficha.schema';
import type { Trato } from '@/api/types';

import { KanbanCard } from '../components/KanbanCard';
import { FichaForm } from '../components/FichaForm';
import { FichaCreateDialog } from '../components/FichaCreateDialog';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const FICHA_TRATO: Ficha = {
  id: 'h1111111-hhhh-1111-hhhh-111111111111',
  columnaId: 'a1111111-aaaa-1111-aaaa-111111111111',
  tipoFicha: 'TRATO',
  tratoId: 'd1111111-dddd-1111-dddd-111111111111',
  tareaId: null,
  responsableId: '22222222-2222-2222-2222-222222222222',
  creadoPor: '22222222-2222-2222-2222-222222222222',
  creadoEn: '2026-04-10T08:00:00Z',
  actualizadoEn: '2026-04-10T08:00:00Z',
};

const FICHA_TAREA: Ficha = {
  ...FICHA_TRATO,
  id: 'h2222222-hhhh-2222-hhhh-222222222222',
  tratoId: null,
  tipoFicha: 'TAREA',
  tareaId: 'e1111111-eeee-1111-eeee-111111111111',
};

function buildQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

function renderCard(
  ficha: Ficha,
  props?: {
    titulo?: string;
    detalles?: Array<{ label: string; value: string }>;
    badge?: { text: string; classes: string };
    to?: string;
  },
) {
  const qc = buildQueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/tableros/t1']}>
        <KanbanCard
          ficha={ficha}
          titulo={props?.titulo ?? 'Título por defecto'}
          detalles={props?.detalles ?? []}
          badge={props?.badge}
          to={props?.to}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// Componente auxiliar que expone la ruta actual en el DOM para aserciones de navegación.
function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location-pathname">{location.pathname}</div>;
}

function renderCardWithLocation(
  ficha: Ficha,
  props?: {
    titulo?: string;
    to?: string;
  },
) {
  const qc = buildQueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/tableros/t1']}>
        <Routes>
          <Route
            path="/tableros/t1"
            element={
              <>
                <KanbanCard
                  ficha={ficha}
                  titulo={props?.titulo ?? 'Título'}
                  detalles={[]}
                  to={props?.to}
                />
                <LocationDisplay />
              </>
            }
          />
          <Route path="/tratos/:id" element={<div data-testid="trato-detail">Detalle del trato</div>} />
          <Route path="/tareas/:id" element={<div data-testid="tarea-detail">Detalle de la tarea</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// ---------------------------------------------------------------------------
// Tests — nuevo contrato presentacional
// ---------------------------------------------------------------------------

describe('KanbanCard — contrato presentacional: titulo, detalles, badge', () => {
  it('(a) renderiza el titulo recibido por prop', () => {
    renderCard(FICHA_TRATO, { titulo: 'Implementación CRM Innovatech' });
    expect(screen.getByText('Implementación CRM Innovatech')).toBeInTheDocument();
  });

  it('(b) tiene data-testid="kanban-card"', () => {
    renderCard(FICHA_TRATO, { titulo: 'Mi trato' });
    expect(screen.getByTestId('kanban-card')).toBeInTheDocument();
  });

  it('(c) renderiza detalles label+value cuando se pasan', () => {
    renderCard(FICHA_TRATO, {
      titulo: 'Trato A',
      detalles: [
        { label: 'Valor', value: 'USD 250.000' },
        { label: 'Prob.', value: '70%' },
      ],
    });
    // Los labels se renderizan en <dt> con ":" concatenado — buscar por regex
    expect(screen.getByText(/Valor/)).toBeInTheDocument();
    expect(screen.getByText('USD 250.000')).toBeInTheDocument();
    expect(screen.getByText(/Prob\./)).toBeInTheDocument();
    expect(screen.getByText('70%')).toBeInTheDocument();
  });

  it('(d) sin detalles no muestra ningún label de detalle', () => {
    renderCard(FICHA_TRATO, { titulo: 'Trato sin datos extras', detalles: [] });
    // Solo el título, sin items adicionales
    expect(screen.getByText('Trato sin datos extras')).toBeInTheDocument();
    expect(screen.queryByText('Valor')).not.toBeInTheDocument();
  });

  it('(e) renderiza badge cuando se pasa', () => {
    renderCard(FICHA_TAREA, {
      titulo: 'Demo presencial con CTO',
      badge: { text: 'Urgente', classes: 'bg-red-100 text-red-800' },
    });
    expect(screen.getByText('Urgente')).toBeInTheDocument();
  });

  it('(f) sin badge no muestra ningún elemento de badge', () => {
    renderCard(FICHA_TRATO, { titulo: 'Trato', badge: undefined });
    expect(screen.queryByText('Urgente')).not.toBeInTheDocument();
    expect(screen.queryByText('Alta')).not.toBeInTheDocument();
  });

  it('(g) NO hace fetch de /api/tratos/get-all (es puramente presentacional)', async () => {
    let tratosFetched = false;
    server.use(
      http.get('/api/tratos/get-all', () => {
        tratosFetched = true;
        return HttpResponse.json([]);
      }),
    );

    renderCard(FICHA_TRATO, { titulo: 'Trato X' });

    // Dar tiempo para posibles fetches
    await new Promise((r) => setTimeout(r, 50));
    expect(tratosFetched).toBe(false);
  });
});

describe('KanbanCard — atributos de accesibilidad/DnD', () => {
  it('(h) tiene role="button" o aria-grabbed para indicar que es draggable', () => {
    renderCard(FICHA_TRATO, { titulo: 'Trato drag' });
    const card = screen.getByTestId('kanban-card');
    expect(card).toBeInTheDocument();
    const hasInteractiveRole =
      card.getAttribute('role') === 'button' ||
      card.hasAttribute('aria-grabbed') ||
      card.hasAttribute('data-draggable') ||
      card.hasAttribute('draggable');
    expect(hasInteractiveRole).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// FichaForm — Batch 3 RED tests
// ---------------------------------------------------------------------------

const TRATO_T1: Trato = {
  id: 'd1111111-dddd-1111-dddd-111111111111',
  contactoId: 'b1111111-bbbb-1111-bbbb-111111111111',
  responsableId: '22222222-2222-2222-2222-222222222222',
  nombre: 'Implementación CRM Innovatech',
  valorEstimado: 250000,
  probabilidad: 70,
  fechaCierreEsperada: '2026-06-30',
  tipoContrato: 'SERVICIO',
  motivoPerdida: null,
  creadoEn: '2026-04-05T10:00:00.000Z',
  actualizadoEn: '2026-05-08T15:00:00.000Z',
};

const TRATO_T2: Trato = {
  id: 'd2222222-dddd-2222-dddd-222222222222',
  contactoId: 'c1111111-cccc-1111-cccc-111111111111',
  responsableId: '22222222-2222-2222-2222-222222222222',
  nombre: 'Renovación licencia anual',
  valorEstimado: 180000,
  probabilidad: 90,
  fechaCierreEsperada: '2026-09-15',
  tipoContrato: 'LICENCIA',
  motivoPerdida: null,
  creadoEn: '2026-04-25T11:00:00.000Z',
  actualizadoEn: '2026-05-05T09:30:00.000Z',
};

function renderFichaForm(props: Partial<Parameters<typeof FichaForm>[0]> = {}) {
  const queryClient = buildQueryClient();
  server.use(http.get('/api/usuarios/get-all', () => HttpResponse.json([])));

  const defaults: Parameters<typeof FichaForm>[0] = {
    columnaId: 'a1111111-aaaa-1111-aaaa-111111111111',
    tipoFicha: 'TRATO',
    items: [
      { id: TRATO_T1.id, label: TRATO_T1.nombre },
      { id: TRATO_T2.id, label: TRATO_T2.nombre },
    ],
    onSubmit: vi.fn(),
    isSubmitting: false,
    ...props,
  };
  return render(
    <QueryClientProvider client={queryClient}>
      <FichaForm {...defaults} />
    </QueryClientProvider>,
  );
}

describe('FichaForm — selector de tratos (migrado Batch 4.1)', () => {
  it('(a) muestra solo tratos sin ficha en el selector: items precargados por el padre', async () => {
    renderFichaForm({
      tipoFicha: 'TRATO',
      items: [{ id: TRATO_T1.id, label: TRATO_T1.nombre }],
    });

    const tratoTrigger = await screen.findByRole('combobox', { name: /trato/i });
    await userEvent.click(tratoTrigger);

    const option = await screen.findByRole('option', { name: 'Implementación CRM Innovatech' });
    expect(option).toBeInTheDocument();
  });

  it('(b) cuando ambos tratos están en items, ambos aparecen en el selector', async () => {
    renderFichaForm({
      tipoFicha: 'TRATO',
      items: [
        { id: TRATO_T1.id, label: TRATO_T1.nombre },
        { id: TRATO_T2.id, label: TRATO_T2.nombre },
      ],
    });

    const tratoTrigger = await screen.findByRole('combobox', { name: /trato/i });
    await userEvent.click(tratoTrigger);

    expect(await screen.findByRole('option', { name: 'Implementación CRM Innovatech' })).toBeInTheDocument();
    expect(await screen.findByRole('option', { name: 'Renovación licencia anual' })).toBeInTheDocument();
  });
});

describe('FichaForm — validación entidadId requerido (migrado Batch 4.1)', () => {
  it('(c) muestra error de validación si se envía sin seleccionar entidad', async () => {
    const onSubmit = vi.fn();
    renderFichaForm({ onSubmit, items: [] });

    const submitBtn = await screen.findByRole('button', { name: /crear ficha/i });
    await userEvent.click(submitBtn);

    await waitFor(() => {
      const allTexts = screen.getAllByText(/selecciona un trato/i);
      const errorParagraph = allTexts.find(
        (el) => el.tagName === 'P' && el.className.includes('destructive'),
      );
      expect(errorParagraph).toBeTruthy();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe('FichaForm — columnaId read-only display', () => {
  it('(d) muestra el columnaId precargado como texto no editable', async () => {
    const COLUMNA_ID = 'a1111111-aaaa-1111-aaaa-111111111111';
    renderFichaForm({ columnaId: COLUMNA_ID, items: [] });

    await waitFor(() => {
      expect(screen.getByText(COLUMNA_ID)).toBeInTheDocument();
    });
    const editableInputs = screen.queryAllByRole('textbox');
    const editableWithValue = editableInputs.filter(
      (el) => (el as HTMLInputElement).value === COLUMNA_ID,
    );
    expect(editableWithValue).toHaveLength(0);
  });
});

describe('FichaForm — serverErrors 422 (migrado Batch 4.1)', () => {
  it('(e) muestra el mensaje de serverError en el campo entidadId', async () => {
    renderFichaForm({
      items: [],
      serverErrors: [{ field: 'entidadId', message: 'El trato ya tiene una ficha asignada' }],
    });

    await waitFor(() => {
      expect(screen.getByText('El trato ya tiene una ficha asignada')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// FichaCreateDialog — Batch 3 RED tests
// ---------------------------------------------------------------------------

function renderFichaCreateDialog(props: Partial<Parameters<typeof FichaCreateDialog>[0]> = {}) {
  const queryClient = buildQueryClient();
  const defaults: Parameters<typeof FichaCreateDialog>[0] = {
    open: true,
    onOpenChange: vi.fn(),
    columnaId: 'a1111111-aaaa-1111-aaaa-111111111111',
    ...props,
  };
  return render(
    <QueryClientProvider client={queryClient}>
      <FichaCreateDialog {...defaults} />
    </QueryClientProvider>,
  );
}

describe('FichaCreateDialog — columnaId precargado', () => {
  it('(a) muestra el columnaId dentro del dialog como dato no editable', async () => {
    server.use(
      http.get('/api/tratos/get-all', () => HttpResponse.json([TRATO_T1])),
      http.get('/api/fichas/get-all', () => HttpResponse.json([])),
      http.get('/api/usuarios', () => HttpResponse.json([])),
    );

    const COLUMNA_ID = 'a1111111-aaaa-1111-aaaa-111111111111';
    renderFichaCreateDialog({ columnaId: COLUMNA_ID });

    await waitFor(() => {
      expect(screen.getByText(COLUMNA_ID)).toBeInTheDocument();
    });
  });
});

async function selectOption(triggerName: RegExp, optionText: string) {
  const trigger = await screen.findByRole('combobox', { name: triggerName });
  await userEvent.click(trigger);
  const listbox = await screen.findByRole('listbox');
  const options = Array.from(listbox.querySelectorAll('[role="option"]'));
  const target = options.find((o) => o.textContent === optionText);
  if (!target) throw new Error(`Option "${optionText}" not found in listbox`);
  await userEvent.click(target);
}

describe('FichaCreateDialog — envío con creadoPor MOCK_USER_ID', () => {
  it('(b) envía POST /api/fichas/create con creadoPor UUID válido y tipoFicha TRATO', async () => {
    let capturedBody: Record<string, unknown> | null = null;
    server.use(
      http.get('/api/tratos/get-all', () => HttpResponse.json([TRATO_T1])),
      http.get('/api/fichas/get-all', () => HttpResponse.json([])),
      http.get('/api/usuarios/get-all', () =>
        HttpResponse.json([
          { id: '11111111-1111-1111-1111-111111111111', nombre: 'Antonio Franco', rolId: 'rol-admin-uuid-1111-111111111111', creadoEn: '2026-01-15T10:00:00Z', activo: true, keycloakId: null, correo: 'admin@crm.test' },
        ]),
      ),
      http.post('/api/fichas/create', async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          {
            id: 'h9999999-hhhh-9999-hhhh-999999999999',
            columnaId: capturedBody['columnaId'],
            tipoFicha: 'TRATO',
            tratoId: capturedBody['tratoId'],
            tareaId: null,
            responsableId: capturedBody['responsableId'],
            creadoPor: capturedBody['creadoPor'],
            creadoEn: '2026-05-29T00:00:00Z',
            actualizadoEn: '2026-05-29T00:00:00Z',
          },
          { status: 201 },
        );
      }),
    );

    const onOpenChange = vi.fn();
    renderFichaCreateDialog({
      columnaId: 'a1111111-aaaa-1111-aaaa-111111111111',
      onOpenChange,
    });

    await selectOption(/trato/i, 'Implementación CRM Innovatech');
    await selectOption(/responsable/i, 'Antonio Franco');

    const submitBtn = await screen.findByRole('button', { name: /crear ficha/i });
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(capturedBody).not.toBeNull();
    });

    expect(capturedBody!['creadoPor']).toBe('00000000-0000-0000-0000-000000000001');
    expect(capturedBody!['tipoFicha']).toBe('TRATO');
    expect(capturedBody!['columnaId']).toBe('a1111111-aaaa-1111-aaaa-111111111111');
    expect(capturedBody!['tratoId']).toBe('d1111111-dddd-1111-dddd-111111111111');
  });

  it('(c) cierra el dialog tras éxito', async () => {
    server.use(
      http.get('/api/tratos/get-all', () => HttpResponse.json([TRATO_T1])),
      http.get('/api/fichas/get-all', () => HttpResponse.json([])),
      http.get('/api/usuarios/get-all', () =>
        HttpResponse.json([
          { id: '11111111-1111-1111-1111-111111111111', nombre: 'Antonio Franco', rolId: 'rol-admin-uuid-1111-111111111111', creadoEn: '2026-01-15T10:00:00Z', activo: true, keycloakId: null, correo: 'admin@crm.test' },
        ]),
      ),
      http.post('/api/fichas/create', async () =>
        HttpResponse.json(
          {
            id: 'h9999999-hhhh-9999-hhhh-999999999999',
            columnaId: 'a1111111-aaaa-1111-aaaa-111111111111',
            tipoFicha: 'TRATO',
            tratoId: 'd1111111-dddd-1111-dddd-111111111111',
            tareaId: null,
            responsableId: '11111111-1111-1111-1111-111111111111',
            creadoPor: '00000000-0000-0000-0000-000000000001',
            creadoEn: '2026-05-29T00:00:00Z',
            actualizadoEn: '2026-05-29T00:00:00Z',
          },
          { status: 201 },
        ),
      ),
    );

    const onOpenChange = vi.fn();
    renderFichaCreateDialog({ onOpenChange });

    await selectOption(/trato/i, 'Implementación CRM Innovatech');
    await selectOption(/responsable/i, 'Antonio Franco');

    await userEvent.click(await screen.findByRole('button', { name: /crear ficha/i }));

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});

describe('FichaCreateDialog — error 422 mantiene dialog abierto', () => {
  it('(d) muestra serverError cuando back responde 422 con tratoId (remapeado a entidadId) y mantiene dialog abierto', async () => {
    server.use(
      http.get('/api/tratos/get-all', () => HttpResponse.json([TRATO_T1])),
      http.get('/api/fichas/get-all', () => HttpResponse.json([])),
      http.get('/api/usuarios/get-all', () =>
        HttpResponse.json([
          { id: '11111111-1111-1111-1111-111111111111', nombre: 'Antonio Franco', rolId: 'rol-admin-uuid-1111-111111111111', creadoEn: '2026-01-15T10:00:00Z', activo: true, keycloakId: null, correo: 'admin@crm.test' },
        ]),
      ),
      http.post('/api/fichas/create', () =>
        HttpResponse.json(
          {
            status: 422,
            error: 'UNPROCESSABLE_ENTITY',
            details: [{ field: 'tratoId', message: 'El trato ya tiene una ficha asignada' }],
          },
          { status: 422 },
        ),
      ),
    );

    const onOpenChange = vi.fn();
    renderFichaCreateDialog({ onOpenChange });

    await selectOption(/trato/i, 'Implementación CRM Innovatech');
    await selectOption(/responsable/i, 'Antonio Franco');

    await userEvent.click(await screen.findByRole('button', { name: /crear ficha/i }));

    await waitFor(() => {
      expect(screen.getByText('El trato ya tiene una ficha asignada')).toBeInTheDocument();
    });
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });
});

// ---------------------------------------------------------------------------
// FichaDeleteDialog — Batch 4 RED tests (task 4.1)
// ---------------------------------------------------------------------------

import { FichaDeleteDialog } from '../components/FichaDeleteDialog';

function renderFichaDeleteDialog(props: Partial<Parameters<typeof FichaDeleteDialog>[0]> = {}) {
  const queryClient = buildQueryClient();
  const defaults: Parameters<typeof FichaDeleteDialog>[0] = {
    open: true,
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    isDeleting: false,
    ...props,
  };
  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        <FichaDeleteDialog {...defaults} />
      </QueryClientProvider>,
    ),
    props: defaults,
  };
}

describe('FichaDeleteDialog — presentacional', () => {
  it('(a) cancelar llama onCancel y NO llama onConfirm', async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    renderFichaDeleteDialog({ onConfirm, onCancel });

    const cancelBtn = await screen.findByRole('button', { name: /cancelar/i });
    await userEvent.click(cancelBtn);

    expect(onCancel).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('(b) cuando isDeleting=true el botón confirmar está deshabilitado', async () => {
    renderFichaDeleteDialog({ isDeleting: true });

    const confirmBtn = await screen.findByRole('button', { name: /eliminando/i });
    expect(confirmBtn).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// KanbanCard — dropdown Eliminar (Batch 4)
// ---------------------------------------------------------------------------

describe('KanbanCard — dropdown Eliminar', () => {
  it('(c) abre el dropdown y muestra la opción "Eliminar"', async () => {
    const { findByRole } = renderCard(FICHA_TRATO, { titulo: 'Trato con dropdown' });

    // Open dropdown menu
    const menuBtn = await findByRole('button', { name: /acciones de ficha/i });
    await userEvent.click(menuBtn);

    expect(await findByRole('menuitem', { name: /eliminar/i })).toBeInTheDocument();
  });

  it('(d) seleccionar "Eliminar" abre el FichaDeleteDialog', async () => {
    const { findByRole } = renderCard(FICHA_TRATO, { titulo: 'Trato para borrar' });

    const menuBtn = await findByRole('button', { name: /acciones de ficha/i });
    await userEvent.click(menuBtn);

    const eliminarItem = await findByRole('menuitem', { name: /eliminar/i });
    await userEvent.click(eliminarItem);

    expect(await findByRole('alertdialog')).toBeInTheDocument();
  });

  it('(e) confirmar invoca DELETE /api/fichas/delete?id=', async () => {
    let deleteCalled = false;
    server.use(
      http.delete('/api/fichas/delete', () => {
        deleteCalled = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { findByRole } = renderCard(FICHA_TRATO, { titulo: 'Trato borrable' });

    const menuBtn = await findByRole('button', { name: /acciones de ficha/i });
    await userEvent.click(menuBtn);
    await userEvent.click(await findByRole('menuitem', { name: /eliminar/i }));
    await userEvent.click(await findByRole('button', { name: /^eliminar$/i }));

    await waitFor(() => {
      expect(deleteCalled).toBe(true);
    });
  });

  it('(f) cancelar en el dialog NO invoca DELETE', async () => {
    let deleteCalled = false;
    server.use(
      http.delete('/api/fichas/delete', () => {
        deleteCalled = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { findByRole } = renderCard(FICHA_TRATO, { titulo: 'Trato no borrar' });

    const menuBtn = await findByRole('button', { name: /acciones de ficha/i });
    await userEvent.click(menuBtn);
    await userEvent.click(await findByRole('menuitem', { name: /eliminar/i }));
    await userEvent.click(await findByRole('button', { name: /cancelar/i }));

    await new Promise((r) => setTimeout(r, 50));
    expect(deleteCalled).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// KanbanCard — navegación al detalle (Lote 6)
// ---------------------------------------------------------------------------

describe('KanbanCard — navegación: prop to', () => {
  it('(nav-a) click en la tarjeta navega a la ruta del trato cuando to="/tratos/d1"', async () => {
    const user = userEvent.setup();
    renderCardWithLocation(FICHA_TRATO, {
      titulo: 'Trato navegable',
      to: '/tratos/d1111111-dddd-1111-dddd-111111111111',
    });

    // Verificar estado inicial
    expect(screen.getByTestId('location-pathname')).toHaveTextContent('/tableros/t1');

    // Click en el título (zona navegable)
    const titleEl = screen.getByText('Trato navegable');
    await user.click(titleEl);

    await waitFor(() => {
      expect(screen.getByTestId('trato-detail')).toBeInTheDocument();
    });
  });

  it('(nav-b) click en la tarjeta navega a la ruta de la tarea cuando to="/tareas/e1"', async () => {
    const user = userEvent.setup();
    renderCardWithLocation(FICHA_TAREA, {
      titulo: 'Tarea navegable',
      to: '/tareas/e1111111-eeee-1111-eeee-111111111111',
    });

    expect(screen.getByTestId('location-pathname')).toHaveTextContent('/tableros/t1');

    const titleEl = screen.getByText('Tarea navegable');
    await user.click(titleEl);

    await waitFor(() => {
      expect(screen.getByTestId('tarea-detail')).toBeInTheDocument();
    });
  });

  it('(nav-c) click en el menu "Eliminar" NO navega', async () => {
    const user = userEvent.setup();
    renderCardWithLocation(FICHA_TRATO, {
      titulo: 'Trato menu no navega',
      to: '/tratos/d1111111-dddd-1111-dddd-111111111111',
    });

    expect(screen.getByTestId('location-pathname')).toHaveTextContent('/tableros/t1');

    const menuBtn = screen.getByRole('button', { name: /acciones de ficha/i });
    await user.click(menuBtn);

    const eliminarItem = await screen.findByRole('menuitem', { name: /eliminar/i });
    await user.click(eliminarItem);

    // Debe haber abierto el dialog de confirmación, NO navegar
    expect(await screen.findByRole('alertdialog')).toBeInTheDocument();
    // La URL sigue siendo la misma (no navegó al detalle)
    expect(screen.getByTestId('location-pathname')).toHaveTextContent('/tableros/t1');
  });

  it('(nav-d) sin prop to la tarjeta NO renderiza un elemento navegable', () => {
    renderCardWithLocation(FICHA_TRATO, {
      titulo: 'Trato sin to',
      to: undefined,
    });

    // Sin `to` no debe haber un link apuntando a ningún detalle
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
