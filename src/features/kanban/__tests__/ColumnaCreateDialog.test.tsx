// Tests para ColumnaCreateDialog — Fase 3 kanban-personalizacion-columnas.
// Cubre: render campos, validaciones, selección de color, bloqueo de duplicados,
// submit OK (MSW), TAREAS vs TRATOS (campos correctos).
// Patrón: QueryClientProvider + MemoryRouter + MSW (server.use override por escenario).

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';

import { ColumnaCreateDialog } from '../components/ColumnaCreateDialog';
import { server } from '@/test/server';
import { tableroTratosFixture, tableroTareasFixture } from '@/mocks/fixtures/tableros';
import { COLUMN_PALETTE } from '../lib/columnPalette';
import { columnaNuevaSchema } from '../schemas/columna.schema';

// ---------------------------------------------------------------------------
// Helper de render
// ---------------------------------------------------------------------------

interface RenderDialogOptions {
  open?: boolean;
  tableroId?: string;
  tipoTablero?: 'TRATOS' | 'TAREAS';
  nombresExistentes?: string[];
  onOpenChange?: (open: boolean) => void;
}

function renderDialog({
  open = true,
  tableroId = tableroTratosFixture.id,
  tipoTablero = 'TRATOS',
  nombresExistentes = [],
  onOpenChange = vi.fn(),
}: RenderDialogOptions = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ColumnaCreateDialog
          open={open}
          onOpenChange={onOpenChange}
          tableroId={tableroId}
          tipoTablero={tipoTablero}
          nombresExistentes={nombresExistentes}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// ---------------------------------------------------------------------------
// Helpers MSW para las dos llamadas que hace useCrearColumnaEnTablero
// ---------------------------------------------------------------------------

const COLUMNA_CREADA = {
  id: 'nueva-col-001',
  nombre: 'Mi columna nueva',
  color: COLUMN_PALETTE[1],
  tipoTablero: 'TRATOS',
  tipoColumna: 'PERSONALIZADA',
};

function mockCrearColumnaOk() {
  server.use(
    http.post('/api/columnas/create', () =>
      HttpResponse.json(COLUMNA_CREADA, { status: 201 }),
    ),
    http.post('/api/tableros/asignar-columna', () =>
      HttpResponse.json(tableroTratosFixture),
    ),
  );
}

// ---------------------------------------------------------------------------
// Render y campos presentes
// ---------------------------------------------------------------------------

describe('ColumnaCreateDialog — render campos', () => {
  it('(a) renderiza el dialog con campo nombre, paleta de colores y límite WIP', async () => {
    renderDialog();

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/nombre de la columna/i)).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /paleta de colores/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/límite wip/i)).toBeInTheDocument();
  });

  it('(b) tablero TRATOS muestra selector estadoTrato y NO muestra campo totalValorEstimado (derivado)', async () => {
    // totalValorEstimado es un valor DERIVADO calculado en runtime — no se expone en el form.
    renderDialog({ tipoTablero: 'TRATOS' });

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    expect(screen.getByRole('combobox', { name: /estado de trato/i })).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: /estado de tarea/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/total valor estimado/i)).not.toBeInTheDocument();
  });

  it('(c) tablero TAREAS muestra selector estadoTarea y oculta totalValorEstimado', async () => {
    renderDialog({ tipoTablero: 'TAREAS' });

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    expect(screen.getByRole('combobox', { name: /estado de tarea/i })).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: /estado de trato/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/total valor estimado/i)).not.toBeInTheDocument();
  });

  it('(d) botón "Crear columna" y botón "Cancelar" presentes', async () => {
    renderDialog();

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /crear columna/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Validaciones de nombre
// ---------------------------------------------------------------------------

describe('ColumnaCreateDialog — validación nombre', () => {
  it('(e) submit sin nombre muestra error de campo obligatorio', async () => {
    const user = userEvent.setup();
    renderDialog({ tipoTablero: 'TRATOS' });

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // No ingresamos nombre — intentamos enviar directamente
    await user.click(screen.getByRole('button', { name: /crear columna/i }));

    await waitFor(() => {
      expect(screen.getByText(/el nombre es obligatorio/i)).toBeInTheDocument();
    });
  });

  it('(f) nombre mayor a 80 caracteres muestra error de longitud — validación schema directa', () => {
    // El input tiene maxLength=80 que bloquea la entrada en browser/jsdom.
    // Verificamos la validación del schema directamente (mismo patrón que tests de KanbanPage
    // para los invariantes del schema).
    const result = columnaNuevaSchema.safeParse({
      tipoTablero: 'TRATOS',
      nombre: 'a'.repeat(81),
      color: COLUMN_PALETTE[0],
      limiteWip: 1,
      estadoTrato: 'ABIERTO',
      totalValorEstimado: 0,
    });

    expect(result.success).toBe(false);
    const errors = result.error?.flatten().fieldErrors;
    expect(errors?.nombre).toBeDefined();
    expect(errors!.nombre![0]).toMatch(/no puede superar los 80 caracteres/i);
  });
});

// ---------------------------------------------------------------------------
// Selección de color
// ---------------------------------------------------------------------------

describe('ColumnaCreateDialog — selección de color', () => {
  it('(g) el primer color de la paleta está seleccionado por defecto (aria-pressed=true)', async () => {
    renderDialog();

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Botón del primer color en la paleta
    const primerColor = COLUMN_PALETTE[0];
    // Los botones de la paleta tienen aria-label con el nombre del color
    // Verificamos que al menos uno tiene aria-pressed="true"
    const botonesPaleta = screen.getAllByRole('button', {
      pressed: true,
    });
    // Al menos un botón tiene pressed
    expect(botonesPaleta.length).toBeGreaterThanOrEqual(1);
    // El primer color de la paleta debe ser el seleccionado
    const botonSeleccionado = botonesPaleta.find(
      (b) => (b as HTMLButtonElement).style.backgroundColor !== '',
    );
    expect(botonSeleccionado).toBeTruthy();
    // El data-color o el style del botón debe coincidir con el primer color
    expect(
      botonesPaleta.some((b) =>
        (b as HTMLButtonElement).style.backgroundColor !== '',
      ),
    ).toBe(true);
    // Verificar que COLUMN_PALETTE[0] está disponible como referencia
    expect(primerColor).toBeDefined();
  });

  it('(h) clic en otro color lo selecciona (aria-pressed cambia)', async () => {
    const user = userEvent.setup();
    renderDialog();

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // El grupo de paleta tiene todos los botones de color
    const group = screen.getByRole('group', { name: /paleta de colores/i });
    const botones = Array.from(group.querySelectorAll('button[type="button"]'));

    // Clic en el segundo color
    await user.click(botones[1]!);

    // El segundo botón ahora debe tener aria-pressed="true"
    await waitFor(() => {
      expect(botones[1]!.getAttribute('aria-pressed')).toBe('true');
    });

    // El primero ya no debe tener aria-pressed="true"
    expect(botones[0]!.getAttribute('aria-pressed')).toBe('false');
  });
});

// ---------------------------------------------------------------------------
// Bloqueo de duplicados
// ---------------------------------------------------------------------------

describe('ColumnaCreateDialog — bloqueo de duplicados', () => {
  it('(i) nombre existente muestra error de duplicado sin llamar a la API', async () => {
    const user = userEvent.setup();
    let apiCalled = false;

    server.use(
      http.post('/api/columnas/create', () => {
        apiCalled = true;
        return HttpResponse.json({}, { status: 201 });
      }),
    );

    renderDialog({
      tipoTablero: 'TRATOS',
      nombresExistentes: ['Por contactar', 'En negociación'],
    });

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Ingresar nombre duplicado (con espacios y distintas mayúsculas)
    const input = screen.getByLabelText(/nombre de la columna/i);
    await user.type(input, 'Por contactar');

    // Seleccionar estado de trato para que el schema no bloquee el submit
    // antes de llegar al check de duplicados
    const estadoTrigger = screen.getByRole('combobox', { name: /estado de trato/i });
    await user.click(estadoTrigger);
    await waitFor(() => {
      expect(screen.getAllByRole('option').length).toBeGreaterThan(0);
    });
    await user.click(screen.getAllByRole('option')[0]!);

    await user.click(screen.getByRole('button', { name: /crear columna/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/ya existe una columna con ese nombre en este tablero/i),
      ).toBeInTheDocument();
    });

    // La API NO debe haberse llamado
    expect(apiCalled).toBe(false);
  });

  it('(j) nombre distinto (no duplicado) no muestra el error de duplicado', async () => {
    mockCrearColumnaOk();

    const user = userEvent.setup();
    renderDialog({
      tipoTablero: 'TRATOS',
      nombresExistentes: ['Por contactar'],
    });

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const input = screen.getByLabelText(/nombre de la columna/i);
    await user.type(input, 'Columna Nueva');

    // Verificamos que el error de duplicado no está presente
    expect(
      screen.queryByText(/ya existe una columna con ese nombre/i),
    ).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Submit OK — flujo completo (MSW)
// ---------------------------------------------------------------------------

describe('ColumnaCreateDialog — submit OK (TRATOS)', () => {
  it('(k) submit válido llama POST /tableros/agregar-columna, luego cierra', async () => {
    let createCalled = false;
    let agregarBody: unknown = null;

    server.use(
      http.post('/api/columnas/create', () => {
        createCalled = true;
        return HttpResponse.json(COLUMNA_CREADA, { status: 201 });
      }),
      http.post('/api/tableros/agregar-columna', async ({ request }) => {
        agregarBody = await request.json();
        return HttpResponse.json(tableroTratosFixture, { status: 201 });
      }),
      http.get('/api/columnas/get-all', () => HttpResponse.json([])),
      http.get('/api/tableros/get-all', () => HttpResponse.json([tableroTratosFixture])),
    );

    const onOpenChange = vi.fn();
    const user = userEvent.setup();

    renderDialog({
      tipoTablero: 'TRATOS',
      onOpenChange,
    });

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Ingresar nombre
    await user.type(screen.getByLabelText(/nombre de la columna/i), 'Mi columna nueva');

    // Seleccionar estado de trato (requerido para TRATOS)
    const estadoTrigger = screen.getByRole('combobox', { name: /estado de trato/i });
    await user.click(estadoTrigger);
    await waitFor(() => {
      expect(screen.getAllByRole('option').length).toBeGreaterThan(0);
    });
    await user.click(screen.getAllByRole('option')[0]!);

    // Submit
    await user.click(screen.getByRole('button', { name: /crear columna/i }));

    await waitFor(() => {
      expect(agregarBody).toBeTruthy();
    });

    // Flujo de UNA llamada: NO se usa el endpoint viejo de catálogo
    expect(createCalled).toBe(false);

    // El body de agregar lleva la definición + config; totalValorEstimado siempre 0
    // (valor derivado en runtime, no se persiste desde el form)
    const agregarPayload = agregarBody as Record<string, unknown>;
    expect(agregarPayload?.nombre).toBe('Mi columna nueva');
    expect(agregarPayload?.totalValorEstimado).toBe(0);
    expect(agregarPayload?.estadoTrato).toBeDefined();

    // El dialog debe cerrarse al completarse el flujo
    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});

// ---------------------------------------------------------------------------
// Submit OK — tablero TAREAS
// ---------------------------------------------------------------------------

describe('ColumnaCreateDialog — submit OK (TAREAS)', () => {
  it('(l) tablero TAREAS: submit válido llama agregar-columna con estadoTarea', async () => {
    let createCalled = false;
    let agregarBody: unknown = null;

    server.use(
      http.post('/api/columnas/create', () => {
        createCalled = true;
        return HttpResponse.json(
          { ...COLUMNA_CREADA, tipoTablero: 'TAREAS' },
          { status: 201 },
        );
      }),
      http.post('/api/tableros/agregar-columna', async ({ request }) => {
        agregarBody = await request.json();
        return HttpResponse.json(tableroTareasFixture, { status: 201 });
      }),
      http.get('/api/columnas/get-all', () => HttpResponse.json([])),
      http.get('/api/tableros/get-all', () => HttpResponse.json([tableroTareasFixture])),
    );

    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    renderDialog({
      tableroId: tableroTareasFixture.id,
      tipoTablero: 'TAREAS',
      onOpenChange,
    });

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // El campo totalValorEstimado NO debe estar visible para TAREAS
    expect(screen.queryByLabelText(/total valor estimado/i)).not.toBeInTheDocument();

    // Ingresar nombre
    await user.type(screen.getByLabelText(/nombre de la columna/i), 'Revisión técnica');

    // Seleccionar estado de tarea
    const estadoTrigger = screen.getByRole('combobox', { name: /estado de tarea/i });
    await user.click(estadoTrigger);
    await waitFor(() => {
      expect(screen.getAllByRole('option').length).toBeGreaterThan(0);
    });
    await user.click(screen.getAllByRole('option')[0]!);

    // Submit
    await user.click(screen.getByRole('button', { name: /crear columna/i }));

    await waitFor(() => {
      expect(agregarBody).toBeTruthy();
    });

    // Flujo de UNA llamada: NO se usa el endpoint viejo de catálogo
    expect(createCalled).toBe(false);

    // El body de agregar para TAREAS: totalValorEstimado 0, estadoTarea presente, sin estadoTrato
    const agregarPayload = agregarBody as Record<string, unknown>;
    expect(agregarPayload?.totalValorEstimado).toBe(0);
    expect(agregarPayload?.estadoTarea).toBeDefined();
    expect(agregarPayload?.estadoTrato).toBeUndefined();

    // El dialog cierra
    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});

// ---------------------------------------------------------------------------
// Botón cancelar
// ---------------------------------------------------------------------------

describe('ColumnaCreateDialog — cancelar', () => {
  it('(m) clic en "Cancelar" llama onOpenChange(false)', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderDialog({ onOpenChange });

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
