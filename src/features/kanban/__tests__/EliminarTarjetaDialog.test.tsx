// EliminarTarjetaDialog + KanbanCard con orquestación — Strict TDD Lote 7 (RED → GREEN)
// Cubre el contrato de UI del borrado orquestado:
//   1. TAREA → confirmar invoca DELETE /tareas/delete + DELETE /fichas/delete
//   2. TRATO sin tareas → confirmar invoca DELETE /tratos/delete + DELETE /fichas/delete
//   3. TRATO con tareas → muestra mensaje de bloqueo, NO hay botón destructivo activo
//   4. FichaDeleteDialog con props de contexto: mensaje acorde al tipoFicha

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { server } from '@/test/server';
import type { Ficha } from '@/features/kanban/schemas/ficha.schema';

import { FichaDeleteDialog } from '../components/FichaDeleteDialog';
import { KanbanCard } from '../components/KanbanCard';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const FICHA_TAREA: Ficha = {
  id: 'h-tarea-001',
  columnaId: 'col-001',
  tipoFicha: 'TAREA',
  tratoId: null,
  // e1111111 tiene tratoId d1111111 (2 tareas en fixture, pero este es FICHA_TAREA)
  tareaId: 'e1111111-eeee-1111-eeee-111111111111',
  responsableId: 'usr-001',
  creadoPor: 'usr-001',
  creadoEn: '2026-04-10T08:00:00Z',
  actualizadoEn: '2026-04-10T08:00:00Z',
};

// d3333333 NO tiene tareas (invariante del fixture)
const FICHA_TRATO_SIN_TAREAS: Ficha = {
  id: 'h-trato-001',
  columnaId: 'col-001',
  tipoFicha: 'TRATO',
  tratoId: 'd3333333-dddd-3333-dddd-333333333333',
  tareaId: null,
  responsableId: 'usr-001',
  creadoPor: 'usr-001',
  creadoEn: '2026-04-10T08:00:00Z',
  actualizadoEn: '2026-04-10T08:00:00Z',
};

// d1111111 tiene EXACTAMENTE 2 tareas (invariante del fixture)
const FICHA_TRATO_CON_TAREAS: Ficha = {
  id: 'h-trato-002',
  columnaId: 'col-001',
  tipoFicha: 'TRATO',
  tratoId: 'd1111111-dddd-1111-dddd-111111111111',
  tareaId: null,
  responsableId: 'usr-001',
  creadoPor: 'usr-001',
  creadoEn: '2026-04-10T08:00:00Z',
  actualizadoEn: '2026-04-10T08:00:00Z',
};

function buildQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

function renderCard(ficha: Ficha) {
  const qc = buildQueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <KanbanCard ficha={ficha} titulo="Título de prueba" detalles={[]} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

async function openDeleteDialog(ficha: Ficha) {
  renderCard(ficha);
  const menuBtn = screen.getByRole('button', { name: /acciones de ficha/i });
  await userEvent.click(menuBtn);
  const eliminarItem = await screen.findByRole('menuitem', { name: /eliminar/i });
  await userEvent.click(eliminarItem);
  return screen.findByRole('alertdialog');
}

// ---------------------------------------------------------------------------
// FichaDeleteDialog — nuevas props de contexto
// ---------------------------------------------------------------------------

describe('FichaDeleteDialog — mensaje contextual por tipoFicha', () => {
  it('(a) con tipoFicha=TAREA muestra mensaje mencionando "tarea"', async () => {
    const qc = buildQueryClient();
    render(
      <QueryClientProvider client={qc}>
        <FichaDeleteDialog
          open={true}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
          tipoFicha="TAREA"
        />
      </QueryClientProvider>,
    );

    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toHaveTextContent(/tarea/i);
  });

  it('(b) con tipoFicha=TRATO muestra mensaje mencionando "trato"', async () => {
    const qc = buildQueryClient();
    render(
      <QueryClientProvider client={qc}>
        <FichaDeleteDialog
          open={true}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
          tipoFicha="TRATO"
        />
      </QueryClientProvider>,
    );

    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toHaveTextContent(/trato/i);
  });

  it('(c) sin tipoFicha (default) sigue funcionando — backward compat', async () => {
    const qc = buildQueryClient();
    render(
      <QueryClientProvider client={qc}>
        <FichaDeleteDialog
          open={true}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      </QueryClientProvider>,
    );

    // Debe renderizar sin errores
    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toBeInTheDocument();
  });
});

describe('FichaDeleteDialog — estado bloqueado (trato con tareas)', () => {
  it('(d) con bloqueado=true muestra mensaje de bloqueo con cantidadTareas', async () => {
    const qc = buildQueryClient();
    render(
      <QueryClientProvider client={qc}>
        <FichaDeleteDialog
          open={true}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
          tipoFicha="TRATO"
          bloqueado={true}
          cantidadTareas={2}
        />
      </QueryClientProvider>,
    );

    const dialog = await screen.findByRole('alertdialog');
    // Debe mencionar la cantidad de tareas
    expect(dialog).toHaveTextContent(/2/);
    // Debe indicar al usuario que borre primero las tareas
    expect(dialog).toHaveTextContent(/tarea/i);
  });

  it('(e) con bloqueado=true NO hay botón de confirmación destructiva activo', async () => {
    const qc = buildQueryClient();
    render(
      <QueryClientProvider client={qc}>
        <FichaDeleteDialog
          open={true}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
          tipoFicha="TRATO"
          bloqueado={true}
          cantidadTareas={3}
        />
      </QueryClientProvider>,
    );

    await screen.findByRole('alertdialog');
    // El botón "Eliminar" (destructivo) no debe estar habilitado
    const eliminarBtns = screen.queryAllByRole('button', { name: /^eliminar/i });
    const hayAlgunActivo = eliminarBtns.some((btn) => !(btn as HTMLButtonElement).disabled);
    expect(hayAlgunActivo).toBe(false);
  });

  it('(f) con bloqueado=false y tipoFicha=TRATO el botón "Eliminar" está disponible', async () => {
    const qc = buildQueryClient();
    render(
      <QueryClientProvider client={qc}>
        <FichaDeleteDialog
          open={true}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
          tipoFicha="TRATO"
          bloqueado={false}
          cantidadTareas={0}
        />
      </QueryClientProvider>,
    );

    await screen.findByRole('alertdialog');
    const eliminarBtn = screen.getByRole('button', { name: /^eliminar/i });
    expect(eliminarBtn).not.toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// KanbanCard — integración con useEliminarTarjeta
// ---------------------------------------------------------------------------

describe('KanbanCard — borrado TAREA vía orquestación', () => {
  it('(g) confirmar borrado de TAREA invoca DELETE /tareas/delete', async () => {
    let tareaDeleted = false;
    server.use(
      http.delete('/api/tareas/delete', () => {
        tareaDeleted = true;
        return new HttpResponse(null, { status: 204 });
      }),
      http.delete('/api/fichas/delete', () => new HttpResponse(null, { status: 204 })),
    );

    await openDeleteDialog(FICHA_TAREA);

    // Confirmar borrado
    const confirmBtn = await screen.findByRole('button', { name: /^eliminar/i });
    await userEvent.click(confirmBtn);

    await waitFor(() => {
      expect(tareaDeleted).toBe(true);
    });
  });

  it('(h) confirmar borrado de TAREA también invoca DELETE /fichas/delete', async () => {
    let fichaDeleted = false;
    server.use(
      http.delete('/api/tareas/delete', () => new HttpResponse(null, { status: 204 })),
      http.delete('/api/fichas/delete', () => {
        fichaDeleted = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await openDeleteDialog(FICHA_TAREA);

    const confirmBtn = await screen.findByRole('button', { name: /^eliminar/i });
    await userEvent.click(confirmBtn);

    await waitFor(() => {
      expect(fichaDeleted).toBe(true);
    });
  });
});

describe('KanbanCard — borrado TRATO sin tareas vía orquestación', () => {
  it('(i) confirmar borrado de TRATO sin tareas invoca DELETE /tratos/delete', async () => {
    let tratoDeleted = false;
    server.use(
      http.delete('/api/tratos/delete', () => {
        tratoDeleted = true;
        return new HttpResponse(null, { status: 204 });
      }),
      http.delete('/api/fichas/delete', () => new HttpResponse(null, { status: 204 })),
    );

    await openDeleteDialog(FICHA_TRATO_SIN_TAREAS);

    const confirmBtn = await screen.findByRole('button', { name: /^eliminar/i });
    await userEvent.click(confirmBtn);

    await waitFor(() => {
      expect(tratoDeleted).toBe(true);
    });
  });
});

describe('KanbanCard — TRATO con tareas (bloqueado)', () => {
  it('(j) dialog de TRATO con tareas muestra mensaje de bloqueo (cantidadTareas)', async () => {
    await openDeleteDialog(FICHA_TRATO_CON_TAREAS);

    // Esperar a que se carguen las tareas y se muestre el mensaje de bloqueo
    await waitFor(() => {
      const dialog = screen.getByRole('alertdialog');
      expect(dialog).toHaveTextContent(/2/);
    });
  });

  it('(k) dialog bloqueado NO invoca DELETE aunque el usuario intente confirmar', async () => {
    const deleteCalled = vi.fn();
    server.use(
      http.delete('/api/tratos/delete', () => { deleteCalled(); return new HttpResponse(null, { status: 204 }); }),
      http.delete('/api/fichas/delete', () => { deleteCalled(); return new HttpResponse(null, { status: 204 }); }),
    );

    await openDeleteDialog(FICHA_TRATO_CON_TAREAS);

    // Esperar a que el dialog cargue las tareas y quede bloqueado
    await waitFor(() => {
      const dialog = screen.getByRole('alertdialog');
      expect(dialog).toHaveTextContent(/2/);
    });

    // No debe haber botón "Eliminar" habilitado
    const eliminarBtns = screen.queryAllByRole('button', { name: /^eliminar/i });
    const hayAlgunActivo = eliminarBtns.some((btn) => !(btn as HTMLButtonElement).disabled);
    expect(hayAlgunActivo).toBe(false);

    // No se llamó a ningún DELETE
    await new Promise((r) => setTimeout(r, 50));
    expect(deleteCalled).not.toHaveBeenCalled();
  });
});
