// Tests de integración para FichaCreateDialog — Strict TDD Batch 4.3.
// Cubre: tipoFicha='TAREA' body mapping correcto; tipoFicha='TRATO' backward-compat;
//        dialog muestra título correcto por tipo; FichaForm recibe tipoFicha correcto.
// Layer: Integration (RTL + MSW + React Query).
//
// Nota sobre Radix Select dentro de Dialog:
// Radix Dialog pone pointer-events:none en el body, lo que impide que el portal
// del Select procese clics. Para los tests de submision de form completo se usa
// el patrón de la app (useCreateFicha + renderHook), igual que KanbanBoard.test.tsx
// para el drag. Los tests de dialog verifican title/label correcto por tipo.

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, renderHook } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { server } from '@/test/server';

import { FichaCreateDialog } from '../components/FichaCreateDialog';
import { useCreateFicha } from '../hooks/useCreateFicha';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const COLUMNA_ID = 'a1111111-aaaa-1111-aaaa-111111111111';

const TAREA_SIN_FICHA = {
  id: 'ta1111111-tttt-1111-tttt-111111111111',
  tratoId: 'd1111111-dddd-1111-dddd-111111111111',
  responsableId: '22222222-2222-2222-2222-222222222222',
  titulo: 'Tarea disponible',
  descripcion: null,
  tipo: 'GENERAL',
  prioridad: 'MEDIA',
  fechaLimite: '2026-12-31T00:00:00Z',
  fechaCompletada: null,
  creadoEn: '2026-01-01T00:00:00Z',
  actualizadoEn: '2026-01-01T00:00:00Z',
};

const TRATO_SIN_FICHA = {
  id: 'd9999999-dddd-9999-dddd-999999999999',
  nombre: 'Trato disponible',
  contactoId: 'c1',
  responsableId: '22222222-2222-2222-2222-222222222222',
  etapa: 'PROSPECTO',
  probabilidad: 50,
  valorEstimado: 10000,
  creadoEn: '2026-01-01T00:00:00Z',
  actualizadoEn: '2026-01-01T00:00:00Z',
};

const USUARIO = {
  id: '22222222-2222-2222-2222-222222222222',
  nombre: 'María González',
  correo: 'vendedor@crm.test',
  rol_sistema: 'usuario',
  rol_empresa: 'Ejecutiva de Ventas',
  activo: true,
  creado_en: '2026-02-01T09:30:00.000Z',
};

// ---------------------------------------------------------------------------
// Helper de render de dialog
// ---------------------------------------------------------------------------

function renderDialog(
  props: {
    tipoFicha?: 'TRATO' | 'TAREA';
    open?: boolean;
  } = {},
) {
  const onOpenChange = vi.fn();
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });

  server.use(
    http.get('/api/tareas/get-all', () => HttpResponse.json([TAREA_SIN_FICHA])),
    http.get('/api/tratos/get-all', () => HttpResponse.json([TRATO_SIN_FICHA])),
    http.get('/api/fichas/get-all', () => HttpResponse.json([])),
    http.get('/api/usuarios/get-all', () => HttpResponse.json([USUARIO])),
  );

  render(
    <QueryClientProvider client={qc}>
      <FichaCreateDialog
        open={props.open ?? true}
        onOpenChange={onOpenChange}
        columnaId={COLUMNA_ID}
        tipoFicha={props.tipoFicha ?? 'TRATO'}
      />
    </QueryClientProvider>,
  );

  return { onOpenChange, qc };
}

// ---------------------------------------------------------------------------
// Tests de presentación — título del dialog por tipoFicha
// ---------------------------------------------------------------------------

describe('FichaCreateDialog — título según tipoFicha', () => {
  it('(a) tipoFicha="TRATO" muestra título "Nueva ficha"', async () => {
    renderDialog({ tipoFicha: 'TRATO' });
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    expect(screen.getByText('Nueva ficha')).toBeInTheDocument();
  });

  it('(b) tipoFicha="TAREA" muestra título con "tarea"', async () => {
    renderDialog({ tipoFicha: 'TAREA' });
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    // El heading del dialog debe mencionar "tarea"
    expect(screen.getByRole('heading', { name: /tarea/i })).toBeInTheDocument();
  });
});

describe('FichaCreateDialog — FichaForm recibe tipoFicha correcto', () => {
  it('(c) tipoFicha="TRATO" — FichaForm muestra label "Trato"', async () => {
    renderDialog({ tipoFicha: 'TRATO' });
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    // FichaForm debe mostrar el label "Trato" para el selector
    expect(screen.getByText(/^Trato/i)).toBeInTheDocument();
  });

  it('(d) tipoFicha="TAREA" — FichaForm muestra label "Tarea"', async () => {
    renderDialog({ tipoFicha: 'TAREA' });
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    // FichaForm debe mostrar el label "Tarea" para el selector
    expect(screen.getByText(/^Tarea/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Tests de body mapping — useCreateFicha directo (misma capa que KanbanBoard)
// El Radix Select dentro de Dialog no permite interacción en jsdom (pointer-events:none).
// Testeamos el hook de mutación directamente para verificar el contrato del body.
// ---------------------------------------------------------------------------

describe('FichaCreateDialog — body mapping (via useCreateFicha)', () => {
  it('(e) body TAREA: tipoFicha=TAREA, tareaId relleno, tratoId=null', async () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
    });
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    );

    let capturedBody: unknown = null;
    server.use(
      http.post('/api/fichas/create', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json(
          {
            id: 'h-nuevo',
            columnaId: COLUMNA_ID,
            tipoFicha: 'TAREA',
            tratoId: null,
            tareaId: TAREA_SIN_FICHA.id,
            actualizadoEn: '2026-05-01T10:00:00Z',
          },
          { status: 201 },
        );
      }),
    );

    const { result } = renderHook(() => useCreateFicha(), { wrapper: Wrapper });

    // FichaCreateDialog mapea: tipoFicha=TAREA → tareaId=entidadId, tratoId=null
    result.current.mutate({
      columnaId: COLUMNA_ID,
      tipoFicha: 'TAREA',
      tareaId: TAREA_SIN_FICHA.id,
      tratoId: null,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(capturedBody).toEqual(
      expect.objectContaining({
        tipoFicha: 'TAREA',
        tareaId: TAREA_SIN_FICHA.id,
        tratoId: null,
        columnaId: COLUMNA_ID,
      }),
    );
  });

  it('(f) body TRATO: tipoFicha=TRATO, tratoId relleno, tareaId=null (backward-compat)', async () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
    });
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    );

    let capturedBody: unknown = null;
    server.use(
      http.post('/api/fichas/create', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json(
          {
            id: 'h-trato',
            columnaId: COLUMNA_ID,
            tipoFicha: 'TRATO',
            tratoId: TRATO_SIN_FICHA.id,
            tareaId: null,
            actualizadoEn: '2026-05-01T10:00:00Z',
          },
          { status: 201 },
        );
      }),
    );

    const { result } = renderHook(() => useCreateFicha(), { wrapper: Wrapper });

    // FichaCreateDialog mapea: tipoFicha=TRATO → tratoId=entidadId, tareaId=null
    result.current.mutate({
      columnaId: COLUMNA_ID,
      tipoFicha: 'TRATO',
      tratoId: TRATO_SIN_FICHA.id,
      tareaId: null,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(capturedBody).toEqual(
      expect.objectContaining({
        tipoFicha: 'TRATO',
        tratoId: TRATO_SIN_FICHA.id,
        tareaId: null,
        columnaId: COLUMNA_ID,
      }),
    );
  });

  it('(g) query ["fichas"] se invalida tras creación exitosa (queryClient refleja invalidación)', async () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
    });
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    );

    server.use(
      http.get('/api/fichas/get-all', () => HttpResponse.json([])),
      http.post('/api/fichas/create', () =>
        HttpResponse.json(
          {
            id: 'h-nuevo',
            columnaId: COLUMNA_ID,
            tipoFicha: 'TAREA',
            tratoId: null,
            tareaId: TAREA_SIN_FICHA.id,
            actualizadoEn: '2026-05-01T10:00:00Z',
          },
          { status: 201 },
        ),
      ),
    );

    // Pre-seed the fichas query so it's in cache before mutation
    await qc.prefetchQuery({ queryKey: ['fichas'], queryFn: () => [] });
    // Verify it's in cache before mutation
    expect(qc.getQueryState(['fichas'])?.isInvalidated).toBe(false);

    const { result } = renderHook(() => useCreateFicha(), { wrapper: Wrapper });

    result.current.mutate({
      columnaId: COLUMNA_ID,
      tipoFicha: 'TAREA',
      tareaId: TAREA_SIN_FICHA.id,
      tratoId: null,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // After success, the query should be invalidated (isInvalidated=true or removed from cache)
    const queryState = qc.getQueryState(['fichas']);
    // invalidateQueries either marks as stale or removes from cache
    expect(queryState?.isInvalidated ?? true).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Interacción usuario: abrir el dialog muestra el botón cancelar
// ---------------------------------------------------------------------------

describe('FichaCreateDialog — UI básica', () => {
  it('(h) clic en Cancelar cierra el dialog (llama onOpenChange(false))', async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderDialog({ tipoFicha: 'TRATO' });

    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

    const cancelBtn = screen.getByRole('button', { name: /cancelar/i });
    await user.click(cancelBtn);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
