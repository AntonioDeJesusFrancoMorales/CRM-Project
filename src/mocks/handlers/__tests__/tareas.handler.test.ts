// Tests del handler MSW GET /tareas con filtros server-side.
// Lote A — T_A.1 — RED: los tests deben fallar inicialmente (handler aún sin override GET).
//
// Trazabilidad de escenarios (spec tareas-management):
// - (a) sin filtros → todas las tareas del fixture [Req: Listado de tareas con filtros]
// - (b) estado=pendiente → solo pendientes
// - (c) prioridad=1 → solo prioridad alta
// - (d) responsable_id=22222222 → solo responsable María
// - (e) vencimiento=vencidas (hoy=2026-05-24) → fecha_limite < '2026-05-24' && estado != 'completada'
// - (f) vencimiento=proximas → fecha_limite in ['2026-05-24','2026-05-31'] && estado != 'completada'
// - (g) trato_id=d1111111&estado=pendiente → combinación de dos filtros
//
// Determinismo: nowIso() de @/mocks/utils/crud se mockea con vi.spyOn para fijar hoy=2026-05-24.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as crudModule from '@/mocks/utils/crud';
import { tareasFixture } from '@/mocks/fixtures/tareas';

// IDs de fixture — deben coincidir con los definidos en tareasFixture ampliado
const HOY = '2026-05-24';
const HOY_ISO = `${HOY}T00:00:00.000Z`;

// Responsables
const RESPONSABLE_MARIA = '22222222-2222-2222-2222-222222222222';
const RESPONSABLE_ADMIN = '11111111-1111-1111-1111-111111111111';

// Tratos
const TRATO_D1 = 'd1111111-dddd-1111-dddd-111111111111';

describe('tareasFixture — invariantes (verificación de fixture ampliado)', () => {
  it('tiene exactamente 7 tareas', () => {
    expect(tareasFixture).toHaveLength(7);
  });

  it('cubre los 3 estados: pendiente, en_progreso, completada', () => {
    const estados = new Set(tareasFixture.map((t) => t.estado));
    expect(estados.has('pendiente')).toBe(true);
    expect(estados.has('en_progreso')).toBe(true);
    expect(estados.has('completada')).toBe(true);
  });

  it('cubre las 3 prioridades: 1, 2, 3', () => {
    const prioridades = new Set(tareasFixture.map((t) => t.prioridad));
    expect(prioridades.has(1)).toBe(true);
    expect(prioridades.has(2)).toBe(true);
    expect(prioridades.has(3)).toBe(true);
  });

  it('cubre ambos responsables: admin (11111111) y María (22222222)', () => {
    const ids = new Set(tareasFixture.map((t) => t.responsable_id));
    expect(ids.has(RESPONSABLE_ADMIN)).toBe(true);
    expect(ids.has(RESPONSABLE_MARIA)).toBe(true);
  });

  it('cubre los tratos d1111111 y d2222222 (d3333333 sin tareas — invariante D4 para DELETE tratos)', () => {
    const tratos = new Set(tareasFixture.map((t) => t.trato_id));
    expect(tratos.has('d1111111-dddd-1111-dddd-111111111111')).toBe(true);
    expect(tratos.has('d2222222-dddd-2222-dddd-222222222222')).toBe(true);
    // d3333333 sin tareas para no romper el DELETE 204 del tratos.handler.test.ts
    expect(tareasFixture.filter((t) => t.trato_id === 'd3333333-dddd-3333-dddd-333333333333')).toHaveLength(0);
  });

  it('incluye al menos 1 tarea con fecha vencida respecto a hoy=2026-05-24 (no completada)', () => {
    const vencidas = tareasFixture.filter(
      (t) => t.fecha_limite !== null && t.fecha_limite < HOY && t.estado !== 'completada',
    );
    expect(vencidas.length).toBeGreaterThan(0);
  });

  it('incluye al menos 1 tarea proxima (fecha_limite en [2026-05-24, 2026-05-31] no completada)', () => {
    const proximas = tareasFixture.filter(
      (t) =>
        t.fecha_limite !== null &&
        t.fecha_limite >= HOY &&
        t.fecha_limite <= '2026-05-31' &&
        t.estado !== 'completada',
    );
    expect(proximas.length).toBeGreaterThan(0);
  });

  it('incluye al menos 1 tarea con fecha_limite null', () => {
    const sinFecha = tareasFixture.filter((t) => t.fecha_limite === null);
    expect(sinFecha.length).toBeGreaterThan(0);
  });

  it('la tarea completada tiene fecha_completada no-null', () => {
    const completadas = tareasFixture.filter((t) => t.estado === 'completada');
    expect(completadas.length).toBeGreaterThan(0);
    completadas.forEach((t) => expect(t.fecha_completada).not.toBeNull());
  });
});

describe('GET /api/v1/tareas — handler con filtros server-side', () => {
  let nowIsoSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Fijar hoy = 2026-05-24 para todos los tests de vencidas/proximas
    nowIsoSpy = vi.spyOn(crudModule, 'nowIso').mockReturnValue(HOY_ISO);
  });

  afterEach(() => {
    nowIsoSpy.mockRestore();
  });

  // Escenario (a): sin filtros devuelve todas las tareas
  it('(a) sin filtros devuelve las 7 tareas del fixture', async () => {
    const res = await fetch('/api/v1/tareas');
    expect(res.status).toBe(200);
    const data = (await res.json()) as unknown[];
    expect(data).toHaveLength(7);
  });

  // Escenario (b): filtro estado=pendiente
  it('(b) estado=pendiente devuelve solo tareas pendientes', async () => {
    const res = await fetch('/api/v1/tareas?estado=pendiente');
    expect(res.status).toBe(200);
    const data = (await res.json()) as { estado: string }[];
    expect(data.length).toBeGreaterThan(0);
    data.forEach((t) => expect(t.estado).toBe('pendiente'));
    // Triangulación: las tareas en_progreso y completadas NO deben aparecer
    const enProgreso = data.filter((t) => t.estado === 'en_progreso');
    expect(enProgreso).toHaveLength(0);
    const completadas = data.filter((t) => t.estado === 'completada');
    expect(completadas).toHaveLength(0);
  });

  // Escenario (c): filtro prioridad=1
  it('(c) prioridad=1 devuelve solo tareas de prioridad alta', async () => {
    const res = await fetch('/api/v1/tareas?prioridad=1');
    expect(res.status).toBe(200);
    const data = (await res.json()) as { prioridad: number }[];
    expect(data.length).toBeGreaterThan(0);
    data.forEach((t) => expect(t.prioridad).toBe(1));
    // Triangulación: prioridad 2 y 3 no aparecen
    expect(data.filter((t) => t.prioridad === 2)).toHaveLength(0);
    expect(data.filter((t) => t.prioridad === 3)).toHaveLength(0);
  });

  // Escenario (d): filtro responsable_id=22222222 (María)
  it('(d) responsable_id=22222222 devuelve solo tareas de María', async () => {
    const res = await fetch(`/api/v1/tareas?responsable_id=${RESPONSABLE_MARIA}`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as { responsable_id: string }[];
    expect(data.length).toBeGreaterThan(0);
    data.forEach((t) => expect(t.responsable_id).toBe(RESPONSABLE_MARIA));
    // Triangulación: admin no aparece
    const adminTareas = data.filter((t) => t.responsable_id === RESPONSABLE_ADMIN);
    expect(adminTareas).toHaveLength(0);
  });

  // Escenario (e): vencidas — determinista con hoy=2026-05-24
  it('(e) vencimiento=vencidas devuelve tareas con fecha_limite < hoy y estado != completada', async () => {
    const res = await fetch('/api/v1/tareas?vencimiento=vencidas');
    expect(res.status).toBe(200);
    const data = (await res.json()) as { fecha_limite: string | null; estado: string }[];
    expect(data.length).toBeGreaterThan(0);
    data.forEach((t) => {
      expect(t.fecha_limite).not.toBeNull();
      // fecha_limite < '2026-05-24'
      expect(t.fecha_limite! < HOY).toBe(true);
      // no completadas
      expect(t.estado).not.toBe('completada');
    });
  });

  // Escenario (e) triangulación: tarea completada con fecha pasada NO aparece en vencidas
  it('(e-tri) una tarea completada con fecha pasada NO aparece en vencidas', async () => {
    const res = await fetch('/api/v1/tareas?vencimiento=vencidas');
    expect(res.status).toBe(200);
    const data = (await res.json()) as { estado: string }[];
    const completadas = data.filter((t) => t.estado === 'completada');
    expect(completadas).toHaveLength(0);
  });

  // Escenario (f): proximas — ventana [hoy, hoy+7d] = [2026-05-24, 2026-05-31]
  it('(f) vencimiento=proximas devuelve tareas con fecha_limite en [2026-05-24, 2026-05-31] y no completadas', async () => {
    const res = await fetch('/api/v1/tareas?vencimiento=proximas');
    expect(res.status).toBe(200);
    const data = (await res.json()) as { fecha_limite: string | null; estado: string }[];
    expect(data.length).toBeGreaterThan(0);
    data.forEach((t) => {
      expect(t.fecha_limite).not.toBeNull();
      expect(t.fecha_limite! >= HOY).toBe(true);
      expect(t.fecha_limite! <= '2026-05-31').toBe(true);
      expect(t.estado).not.toBe('completada');
    });
  });

  // Escenario (f) triangulación: tareas con fecha lejana (> 2026-05-31) NO aparecen en proximas
  it('(f-tri) tareas con fecha lejana (> 2026-05-31) no aparecen en proximas', async () => {
    const res = await fetch('/api/v1/tareas?vencimiento=proximas');
    expect(res.status).toBe(200);
    const data = (await res.json()) as { fecha_limite: string | null }[];
    const lejanas = data.filter((t) => t.fecha_limite !== null && t.fecha_limite > '2026-05-31');
    expect(lejanas).toHaveLength(0);
  });

  // Escenario (f) triangulación: vencidas no aparecen en proximas
  it('(f-tri2) tareas vencidas (< 2026-05-24) no aparecen en proximas', async () => {
    const res = await fetch('/api/v1/tareas?vencimiento=proximas');
    expect(res.status).toBe(200);
    const data = (await res.json()) as { fecha_limite: string | null }[];
    const pasadas = data.filter((t) => t.fecha_limite !== null && t.fecha_limite < HOY);
    expect(pasadas).toHaveLength(0);
  });

  // Escenario (g): combinación trato_id + estado
  it('(g) trato_id=d1111111&estado=pendiente devuelve solo tareas pendientes del trato d1111111', async () => {
    const res = await fetch(`/api/v1/tareas?trato_id=${TRATO_D1}&estado=pendiente`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as { trato_id: string; estado: string }[];
    expect(data.length).toBeGreaterThan(0);
    data.forEach((t) => {
      expect(t.trato_id).toBe(TRATO_D1);
      expect(t.estado).toBe('pendiente');
    });
    // Triangulación: tareas de d1111111 con otros estados no deben aparecer
    const otrosEstados = data.filter((t) => t.estado !== 'pendiente');
    expect(otrosEstados).toHaveLength(0);
  });

  // Triangulación adicional: vencimiento=todas (sin filtro de fecha) devuelve todas las tareas
  it('(tri-todas) vencimiento=todas no aplica filtro de fecha (devuelve todas)', async () => {
    const resTodas = await fetch('/api/v1/tareas?vencimiento=todas');
    const resTodasData = (await resTodas.json()) as unknown[];

    const resSinFiltro = await fetch('/api/v1/tareas');
    const resSinFiltroData = (await resSinFiltro.json()) as unknown[];

    expect(resTodasData).toHaveLength(resSinFiltroData.length);
  });
});
