// Tests para ColumnaEditDialog — Fase 4 kanban-personalizacion-columnas.
// Cubre: precarga nombre/color, edición ok (MSW), duplicado → error sin API,
//        color legacy preservado/mostrado, cancelar.
// Patrón: QueryClientProvider + MemoryRouter + MSW.

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';

import { ColumnaEditDialog } from '../components/ColumnaEditDialog';
import { server } from '@/test/server';
import { columnasTablTratosIds, columnasFixture } from '@/mocks/fixtures/tableros';
import { COLUMN_PALETTE } from '../lib/columnPalette';
import type { ColumnaTablero } from '@/features/kanban/schemas/tablero.schema';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const COLUMNA_PALETTE_COLOR: ColumnaTablero = {
  id: columnasTablTratosIds.enNegociacion,
  nombre: 'En negociación',
  color: COLUMN_PALETTE[1]!, // '#60a5fa' — color de paleta
  limiteWip: 5,
  nota: null,
  totalValorEstimado: 0,
};

const COLUMNA_LEGACY_COLOR: ColumnaTablero = {
  ...COLUMNA_PALETTE_COLOR,
  id: 'custom-legacy-id',
  nombre: 'Columna legacy',
  color: '#1a2b3c', // color fuera de paleta
};

// ---------------------------------------------------------------------------
// Helper de render
// ---------------------------------------------------------------------------

interface RenderEditDialogOptions {
  open?: boolean;
  columna?: ColumnaTablero;
  nombresExistentes?: string[];
  onOpenChange?: (open: boolean) => void;
}

function renderDialog({
  open = true,
  columna = COLUMNA_PALETTE_COLOR,
  nombresExistentes = [],
  onOpenChange = vi.fn(),
}: RenderEditDialogOptions = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return {
    onOpenChange,
    ...render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ColumnaEditDialog
            open={open}
            onOpenChange={onOpenChange}
            columna={columna}
            nombresExistentes={nombresExistentes}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    ),
  };
}

// ---------------------------------------------------------------------------
// MSW mock para edición exitosa
// ---------------------------------------------------------------------------

function mockEditOk(columnaId: string) {
  server.use(
    http.put('/api/columnas/edit', ({ request }) => {
      const url = new URL(request.url);
      const id = url.searchParams.get('id');
      if (id !== columnaId) return new HttpResponse(null, { status: 404 });
      return HttpResponse.json({
        id: columnaId,
        nombre: 'Nombre editado',
        color: COLUMN_PALETTE[2],
        tipoTablero: 'TRATOS',
        tipoColumna: 'PERSONALIZADA',
      });
    }),
    http.get('/api/columnas/get-all', () => HttpResponse.json([])),
    http.get('/api/tableros/get-all', () => HttpResponse.json([])),
  );
}

// ---------------------------------------------------------------------------
// Tests: render y precarga
// ---------------------------------------------------------------------------

describe('ColumnaEditDialog — render y precarga', () => {
  it('(a) renderiza el dialog con campo nombre y paleta de colores', async () => {
    renderDialog();

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/nombre de la columna/i)).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /paleta de colores/i })).toBeInTheDocument();
  });

  it('(b) precarga el nombre actual de la columna en el input', async () => {
    renderDialog({ columna: COLUMNA_PALETTE_COLOR });

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const input = screen.getByLabelText(/nombre de la columna/i) as HTMLInputElement;
    expect(input.value).toBe(COLUMNA_PALETTE_COLOR.nombre);
  });

  it('(c) precarga el color actual (de paleta) como seleccionado (aria-pressed=true)', async () => {
    renderDialog({ columna: COLUMNA_PALETTE_COLOR });

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // El color de paleta precargado debe estar seleccionado (aria-pressed=true)
    const botonesPresionados = screen.getAllByRole('button', { pressed: true });
    expect(botonesPresionados.length).toBeGreaterThanOrEqual(1);
  });

  it('(d) botones "Guardar cambios" y "Cancelar" presentes', async () => {
    renderDialog();

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /guardar cambios/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Tests: color legacy
// ---------------------------------------------------------------------------

describe('ColumnaEditDialog — color legacy (fuera de paleta)', () => {
  it('(e) columna con color legacy muestra swatch "Color actual" como seleccionado', async () => {
    renderDialog({ columna: COLUMNA_LEGACY_COLOR });

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Debe haber un botón con aria-label "Color actual" (swatch legacy)
    const swatchLegacy = screen.getByRole('button', { name: /color actual/i });
    expect(swatchLegacy).toBeInTheDocument();
    // Debe estar seleccionado (aria-pressed=true) porque es el color actual
    expect(swatchLegacy.getAttribute('aria-pressed')).toBe('true');
  });

  it('(f) el usuario puede elegir otro color de la paleta cuando tiene color legacy', async () => {
    const user = userEvent.setup();
    renderDialog({ columna: COLUMNA_LEGACY_COLOR });

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // El swatch legacy empieza seleccionado
    const swatchLegacy = screen.getByRole('button', { name: /color actual/i });
    expect(swatchLegacy.getAttribute('aria-pressed')).toBe('true');

    // Clic en el primer color de la paleta
    const group = screen.getByRole('group', { name: /paleta de colores/i });
    const botonesPaleta = group.querySelectorAll('button[type="button"]');
    // El primer botón que NO es el legacy
    const primerColorPaleta = Array.from(botonesPaleta).find(
      (b) => b.getAttribute('aria-label') !== 'Color actual',
    );
    expect(primerColorPaleta).toBeTruthy();
    await user.click(primerColorPaleta!);

    // Ahora el swatch legacy ya no está seleccionado
    await waitFor(() => {
      expect(swatchLegacy.getAttribute('aria-pressed')).toBe('false');
    });
  });
});

// ---------------------------------------------------------------------------
// Tests: bloqueo de duplicados
// ---------------------------------------------------------------------------

describe('ColumnaEditDialog — bloqueo de duplicados', () => {
  it('(g) nombre igual a otro existente muestra error sin llamar a la API', async () => {
    const user = userEvent.setup();
    let apiCalled = false;

    server.use(
      http.put('/api/columnas/edit', () => {
        apiCalled = true;
        return HttpResponse.json({});
      }),
    );

    renderDialog({
      columna: COLUMNA_PALETTE_COLOR,
      nombresExistentes: ['Por contactar', 'Ganados'],
    });

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Limpiar el campo nombre y escribir un nombre duplicado
    const input = screen.getByLabelText(/nombre de la columna/i);
    await user.clear(input);
    await user.type(input, 'Por contactar'); // nombre existente

    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/ya existe una columna con ese nombre en este tablero/i),
      ).toBeInTheDocument();
    });

    expect(apiCalled).toBe(false);
  });

  it('(h) nombre distinto no muestra el error de duplicado', async () => {
    mockEditOk(COLUMNA_PALETTE_COLOR.id);
    const user = userEvent.setup();

    renderDialog({
      columna: COLUMNA_PALETTE_COLOR,
      nombresExistentes: ['Por contactar'],
    });

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const input = screen.getByLabelText(/nombre de la columna/i);
    await user.clear(input);
    await user.type(input, 'Nombre nuevo único');

    expect(
      screen.queryByText(/ya existe una columna con ese nombre/i),
    ).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Tests: submit OK (MSW)
// ---------------------------------------------------------------------------

describe('ColumnaEditDialog — submit OK', () => {
  it('(i) submit válido llama PUT /columnas/edit y cierra el dialog', async () => {
    let editCalled = false;
    let capturedBody: unknown = null;

    server.use(
      http.put('/api/columnas/edit', async ({ request }) => {
        editCalled = true;
        capturedBody = await request.json();
        return HttpResponse.json({
          id: COLUMNA_PALETTE_COLOR.id,
          nombre: 'Nombre modificado',
          color: COLUMNA_PALETTE_COLOR.color,
          tipoTablero: 'TRATOS',
          tipoColumna: 'PERSONALIZADA',
        });
      }),
      // El catálogo debe traer la columna editada — el dialog cruza el id para
      // resolver tipoTablero/tipoColumna (el back los exige en el PUT).
      http.get('/api/columnas/get-all', () => HttpResponse.json(columnasFixture)),
      http.get('/api/tableros/get-all', () => HttpResponse.json([])),
    );

    const onOpenChange = vi.fn();
    const user = userEvent.setup();

    renderDialog({
      columna: COLUMNA_PALETTE_COLOR,
      onOpenChange,
    });

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Modificar el nombre
    const input = screen.getByLabelText(/nombre de la columna/i);
    await user.clear(input);
    await user.type(input, 'Nombre modificado');

    // Submit
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(editCalled).toBe(true);
    });

    // Verificar el payload enviado
    const body = capturedBody as Record<string, unknown>;
    expect(body.nombre).toBe('Nombre modificado');
    expect(body.color).toBe(COLUMNA_PALETTE_COLOR.color);
    // tipoTablero/tipoColumna resueltos desde el catálogo — el back los EXIGE.
    // enNegociacion en el catálogo es TRATOS / PERSONALIZADA.
    expect(body.tipoTablero).toBe('TRATOS');
    expect(body.tipoColumna).toBe('PERSONALIZADA');

    // El dialog debe cerrarse
    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});

// ---------------------------------------------------------------------------
// Tests: cancelar
// ---------------------------------------------------------------------------

describe('ColumnaEditDialog — cancelar', () => {
  it('(j) clic en "Cancelar" llama onOpenChange(false)', async () => {
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
