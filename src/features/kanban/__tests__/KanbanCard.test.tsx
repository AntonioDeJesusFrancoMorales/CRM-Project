// Tests de componente para KanbanCard — Strict TDD B6.3 (RED).
// Cubre: renderiza tratoId, accesibilidad draggable, data-testid.
// DnD real (arrastre de browser) no es testeable en jsdom — se testea la estructura.
// Batch 3: FichaForm + FichaCreateDialog tests.

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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

const FICHA_BASE: Ficha = {
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

const FICHA_SIN_TRATO: Ficha = {
  ...FICHA_BASE,
  id: 'h2222222-hhhh-2222-hhhh-222222222222',
  tratoId: null,
  tipoFicha: 'TAREA',
  tareaId: 'e9999999-eeee-9999-eeee-999999999999',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

// KanbanCard now uses useTratos() internally → wrap in QueryClientProvider.
// We stub /api/tratos/get-all so the hook doesn't throw unmatched request errors.

describe('KanbanCard — renderizado', () => {
  it('(a) renderiza el tratoId como texto identificable', () => {
    server.use(http.get('/api/tratos/get-all', () => HttpResponse.json([])));
    const qc = buildQueryClient();
    render(
      <QueryClientProvider client={qc}>
        <KanbanCard ficha={FICHA_BASE} />
      </QueryClientProvider>,
    );
    // Before tratos load, falls back to tratoId UUID
    expect(screen.getByText(/d1111111/)).toBeInTheDocument();
  });

  it('(b) tiene data-testid="kanban-card"', () => {
    server.use(http.get('/api/tratos/get-all', () => HttpResponse.json([])));
    const qc = buildQueryClient();
    render(
      <QueryClientProvider client={qc}>
        <KanbanCard ficha={FICHA_BASE} />
      </QueryClientProvider>,
    );
    expect(screen.getByTestId('kanban-card')).toBeInTheDocument();
  });

  it('(c) cuando tratoId es null muestra fallback "Sin trato"', () => {
    server.use(http.get('/api/tratos/get-all', () => HttpResponse.json([])));
    const qc = buildQueryClient();
    render(
      <QueryClientProvider client={qc}>
        <KanbanCard ficha={FICHA_SIN_TRATO} />
      </QueryClientProvider>,
    );
    expect(screen.getByText(/sin trato/i)).toBeInTheDocument();
  });
});

describe('KanbanCard — atributos de accesibilidad/DnD', () => {
  it('(d) tiene role="button" o aria-grabbed para indicar que es draggable', () => {
    server.use(http.get('/api/tratos/get-all', () => HttpResponse.json([])));
    const qc = buildQueryClient();
    render(
      <QueryClientProvider client={qc}>
        <KanbanCard ficha={FICHA_BASE} />
      </QueryClientProvider>,
    );
    const card = screen.getByTestId('kanban-card');
    // @dnd-kit establece role="button" en el elemento draggable
    expect(card).toBeInTheDocument();
    // Verifica que tenga algún atributo que indique interactividad de DnD
    // (role button, data-draggable, o similar — exacto depende de @dnd-kit versión)
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

// Tratos fixture: t1 sin ficha, t2 con ficha
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

// t2 has a ficha — kept for fixture completeness (previously used in integration tests with useTratosSinFicha)
// FICHA_T2 is no longer needed since FichaForm doesn't fetch tratos internally anymore (Batch 4 refactor).
// The comment is kept for historical context; the variable is removed to avoid unused-variable TS error.

function buildQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

// Migrado en Batch 4.1: FichaForm ahora recibe tipoFicha + items como props (no fetches internamente).
// renderFichaForm pasa tipoFicha='TRATO' + items mapeados desde tratos.

function renderFichaForm(props: Partial<Parameters<typeof FichaForm>[0]> = {}) {
  const queryClient = buildQueryClient();
  // Stub usuarios para el selector de responsable
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
    // FichaForm ya no fetches tratos — el padre pasa items ya filtrados.
    // Aquí pasamos solo t1 como item disponible (t2 ya tiene ficha, el padre lo filtraría).
    renderFichaForm({
      tipoFicha: 'TRATO',
      items: [{ id: TRATO_T1.id, label: TRATO_T1.nombre }],
    });

    // Open selector (field se llama ahora 'entidadId', label 'Trato')
    const tratoTrigger = await screen.findByRole('combobox', { name: /trato/i });
    await userEvent.click(tratoTrigger);

    // t1 must appear
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
      // FormMessage renders a <p> with error text
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
    // El campo se renombró de tratoId a entidadId — server errors deben usar 'entidadId'
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

// Helper: open a Radix Select and click the option with given text in the listbox
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
    // FichaCreateDialog remapea 'tratoId' → 'entidadId' antes de pasar a FichaForm
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
            // El back sigue devolviendo 'tratoId' — FichaCreateDialog lo remapea a 'entidadId'
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
    // Dialog must remain open
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

    // When isDeleting=true button text changes to "Eliminando..." — match both states
    const confirmBtn = await screen.findByRole('button', { name: /eliminando/i });
    expect(confirmBtn).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// KanbanCard con dropdown — Batch 4 RED tests (task 4.3)
// ---------------------------------------------------------------------------

describe('KanbanCard — muestra trato.nombre si está disponible', () => {
  it('(a) muestra el nombre del trato cuando está cargado en cache', async () => {
    server.use(
      http.get('/api/tratos/get-all', () => HttpResponse.json([TRATO_T1])),
      http.get('/api/fichas/get-all', () => HttpResponse.json([])),
    );

    const queryClient = buildQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <KanbanCard ficha={FICHA_BASE} />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Implementación CRM Innovatech')).toBeInTheDocument();
    });
  });

  it('(b) muestra el tratoId como fallback cuando los tratos no están cargados', () => {
    const queryClient = buildQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <KanbanCard ficha={FICHA_BASE} />
      </QueryClientProvider>,
    );

    // Before tratos load — falls back to tratoId
    expect(screen.getByText(/d1111111/)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// KanbanCard — prop `label` opcional (Batch 3 RED — Change 6)
// ---------------------------------------------------------------------------

describe('KanbanCard — prop label opcional', () => {
  it('(g) muestra el label explícito cuando se pasa la prop label', () => {
    server.use(http.get('/api/tratos/get-all', () => HttpResponse.json([TRATO_T1])));
    const qc = buildQueryClient();
    render(
      <QueryClientProvider client={qc}>
        <KanbanCard ficha={FICHA_BASE} label="Tarea de seguimiento importante" />
      </QueryClientProvider>,
    );
    expect(screen.getByText('Tarea de seguimiento importante')).toBeInTheDocument();
  });

  it('(h) cuando label es explícito NO muestra el tratoId ni el nombre del trato del cache', async () => {
    server.use(http.get('/api/tratos/get-all', () => HttpResponse.json([TRATO_T1])));
    const qc = buildQueryClient();
    render(
      <QueryClientProvider client={qc}>
        <KanbanCard ficha={FICHA_BASE} label="Mi tarea personalizada" />
      </QueryClientProvider>,
    );
    // Label explícito debe aparecer
    expect(screen.getByText('Mi tarea personalizada')).toBeInTheDocument();
    // El nombre del trato NO debe aparecer (el label lo reemplaza)
    expect(screen.queryByText('Implementación CRM Innovatech')).not.toBeInTheDocument();
  });

  it('(i) sin prop label cae al fallback interno (tratoId o nombre del trato)', async () => {
    server.use(http.get('/api/tratos/get-all', () => HttpResponse.json([TRATO_T1])));
    const qc = buildQueryClient();
    render(
      <QueryClientProvider client={qc}>
        <KanbanCard ficha={FICHA_BASE} />
      </QueryClientProvider>,
    );
    // Sin label, debe mostrar algo — el tratoId UUID al menos
    expect(screen.getByText(/d1111111/)).toBeInTheDocument();
  });

  it('(j) con label="Sin tarea" y ficha TAREA muestra el label pasado', () => {
    server.use(http.get('/api/tratos/get-all', () => HttpResponse.json([])));
    const qc = buildQueryClient();
    render(
      <QueryClientProvider client={qc}>
        <KanbanCard ficha={FICHA_SIN_TRATO} label="Revisión de contrato" />
      </QueryClientProvider>,
    );
    expect(screen.getByText('Revisión de contrato')).toBeInTheDocument();
    // El fallback "Sin trato" NO debe aparecer cuando hay label
    expect(screen.queryByText(/sin trato/i)).not.toBeInTheDocument();
  });
});

describe('KanbanCard — dropdown Eliminar', () => {
  it('(c) abre el dropdown y muestra la opción "Eliminar"', async () => {
    server.use(
      http.get('/api/tratos/get-all', () => HttpResponse.json([TRATO_T1])),
      http.get('/api/fichas/get-all', () => HttpResponse.json([])),
    );

    const queryClient = buildQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <KanbanCard ficha={FICHA_BASE} />
      </QueryClientProvider>,
    );

    // Open dropdown menu
    const menuBtn = await screen.findByRole('button', { name: /acciones de ficha/i });
    await userEvent.click(menuBtn);

    // "Eliminar" option must appear
    expect(await screen.findByRole('menuitem', { name: /eliminar/i })).toBeInTheDocument();
  });

  it('(d) seleccionar "Eliminar" abre el FichaDeleteDialog', async () => {
    server.use(
      http.get('/api/tratos/get-all', () => HttpResponse.json([TRATO_T1])),
      http.get('/api/fichas/get-all', () => HttpResponse.json([])),
    );

    const queryClient = buildQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <KanbanCard ficha={FICHA_BASE} />
      </QueryClientProvider>,
    );

    const menuBtn = await screen.findByRole('button', { name: /acciones de ficha/i });
    await userEvent.click(menuBtn);

    const eliminarItem = await screen.findByRole('menuitem', { name: /eliminar/i });
    await userEvent.click(eliminarItem);

    // AlertDialog should be open — look for its title
    expect(await screen.findByRole('alertdialog')).toBeInTheDocument();
  });

  it('(e) confirmar invoca DELETE /api/fichas/delete?id=', async () => {
    let deleteCalled = false;
    server.use(
      http.get('/api/tratos/get-all', () => HttpResponse.json([TRATO_T1])),
      http.get('/api/fichas/get-all', () => HttpResponse.json([])),
      http.delete('/api/fichas/delete', () => {
        deleteCalled = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const queryClient = buildQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <KanbanCard ficha={FICHA_BASE} />
      </QueryClientProvider>,
    );

    // Open dropdown → click Eliminar → open dialog → confirm
    const menuBtn = await screen.findByRole('button', { name: /acciones de ficha/i });
    await userEvent.click(menuBtn);
    await userEvent.click(await screen.findByRole('menuitem', { name: /eliminar/i }));
    await userEvent.click(await screen.findByRole('button', { name: /^eliminar$/i }));

    await waitFor(() => {
      expect(deleteCalled).toBe(true);
    });
  });

  it('(f) cancelar en el dialog NO invoca DELETE', async () => {
    let deleteCalled = false;
    server.use(
      http.get('/api/tratos/get-all', () => HttpResponse.json([TRATO_T1])),
      http.get('/api/fichas/get-all', () => HttpResponse.json([])),
      http.delete('/api/fichas/delete', () => {
        deleteCalled = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const queryClient = buildQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <KanbanCard ficha={FICHA_BASE} />
      </QueryClientProvider>,
    );

    // Open dropdown → click Eliminar → open dialog → cancel
    const menuBtn = await screen.findByRole('button', { name: /acciones de ficha/i });
    await userEvent.click(menuBtn);
    await userEvent.click(await screen.findByRole('menuitem', { name: /eliminar/i }));
    await userEvent.click(await screen.findByRole('button', { name: /cancelar/i }));

    // Give time for any async calls
    await new Promise((r) => setTimeout(r, 50));
    expect(deleteCalled).toBe(false);
  });
});
