import type { Tarea } from '@/api/types';

// Fixture determinista respecto a hoy = 2026-05-24.
// Cubre: estados pendiente/en_progreso/completada, prioridades 1/2/3,
// responsables 11111111 (admin) y 22222222 (María),
// tratos d1111111 (2 tareas), d2222222 (5 tareas), d3333333 (0 tareas).
//
// INVARIANTE para tratos.handler.test.ts (D4):
//   - d1111111 tiene EXACTAMENTE 2 tareas (e1111111, e2222222)
//   - d3333333 NO tiene tareas (se usa para DELETE 204 sin conflicto)
//
// Fechas respecto a hoy=2026-05-24:
//   - Vencida: fecha_limite < '2026-05-24' y estado != 'completada'  → e1111111 (2026-05-15)
//   - Próxima: fecha_limite in ['2026-05-24','2026-05-31'] y no completada → e2222222 (2026-05-28), e4444444 (2026-05-24)
//   - Lejana:  fecha_limite > '2026-05-31' → e6666666 (2026-06-15)
//   - Null:    sin fecha → e5555555

export const tareasFixture: Tarea[] = [
  // --- trato d1111111 — exactamente 2 tareas (invariante D4) ---

  // 1. Vencida: fecha_limite < 2026-05-24, estado pendiente → aparece en filtro vencidas
  {
    id: 'e1111111-eeee-1111-eeee-111111111111',
    trato_id: 'd1111111-dddd-1111-dddd-111111111111',
    responsable_id: '22222222-2222-2222-2222-222222222222',
    titulo: 'Demo presencial con CTO',
    descripcion: 'Preparar demo con casos reales del sector.',
    tipo: 'demo',
    estado: 'pendiente',
    prioridad: 3,
    fecha_limite: '2026-05-15',
    fecha_completada: null,
    creado_en: '2026-05-01T10:00:00.000Z',
    actualizado_en: '2026-05-01T10:00:00.000Z',
  },
  // 2. Próxima: fecha_limite = 2026-05-28 (en ventana [2026-05-24, 2026-05-31]), pendiente
  {
    id: 'e2222222-eeee-2222-eeee-222222222222',
    trato_id: 'd1111111-dddd-1111-dddd-111111111111',
    responsable_id: '22222222-2222-2222-2222-222222222222',
    titulo: 'Llamada de seguimiento post-demo',
    descripcion: null,
    tipo: 'llamada',
    estado: 'pendiente',
    prioridad: 2,
    fecha_limite: '2026-05-28',
    fecha_completada: null,
    creado_en: '2026-05-01T10:05:00.000Z',
    actualizado_en: '2026-05-01T10:05:00.000Z',
  },

  // --- trato d2222222 — 5 tareas para cubrir el resto de los casos ---

  // 3. Completada con fecha pasada: NO aparece en vencidas (excluida por estado=completada)
  {
    id: 'e3333333-eeee-3333-eeee-333333333333',
    trato_id: 'd2222222-dddd-2222-dddd-222222222222',
    responsable_id: '11111111-1111-1111-1111-111111111111',
    titulo: 'Análisis de requerimientos inicial',
    descripcion: 'Levantamiento de procesos con equipo de TI.',
    tipo: 'reunion',
    estado: 'completada',
    prioridad: 1,
    fecha_limite: '2026-05-10',
    fecha_completada: '2026-05-09T14:00:00.000Z',
    creado_en: '2026-04-25T09:00:00.000Z',
    actualizado_en: '2026-05-09T14:00:00.000Z',
  },
  // 4. En progreso con fecha próxima: hoy exacto = 2026-05-24 (límite inferior de ventana)
  {
    id: 'e4444444-eeee-4444-eeee-444444444444',
    trato_id: 'd2222222-dddd-2222-dddd-222222222222',
    responsable_id: '22222222-2222-2222-2222-222222222222',
    titulo: 'Preparar propuesta de renovación',
    descripcion: null,
    tipo: 'email',
    estado: 'en_progreso',
    prioridad: 1,
    fecha_limite: '2026-05-24',
    fecha_completada: null,
    creado_en: '2026-05-10T11:00:00.000Z',
    actualizado_en: '2026-05-20T11:00:00.000Z',
  },
  // 5. Sin fecha_limite (null) — en progreso
  {
    id: 'e5555555-eeee-5555-eeee-555555555555',
    trato_id: 'd2222222-dddd-2222-dddd-222222222222',
    responsable_id: '11111111-1111-1111-1111-111111111111',
    titulo: 'Revisar contrato de retainer',
    descripcion: 'Verificar cláusulas de confidencialidad.',
    tipo: 'seguimiento',
    estado: 'en_progreso',
    prioridad: 2,
    fecha_limite: null,
    fecha_completada: null,
    creado_en: '2026-05-12T08:00:00.000Z',
    actualizado_en: '2026-05-12T08:00:00.000Z',
  },
  // 6. Fecha lejana (> 2026-05-31) — pendiente
  {
    id: 'e6666666-eeee-6666-eeee-666666666666',
    trato_id: 'd2222222-dddd-2222-dddd-222222222222',
    responsable_id: '11111111-1111-1111-1111-111111111111',
    titulo: 'Taller de capacitación de procesos',
    descripcion: 'Capacitar al equipo de Innovatech en la nueva metodología.',
    tipo: 'reunion',
    estado: 'pendiente',
    prioridad: 3,
    fecha_limite: '2026-06-15',
    fecha_completada: null,
    creado_en: '2026-05-05T09:00:00.000Z',
    actualizado_en: '2026-05-05T09:00:00.000Z',
  },
  // 7. Completada con fecha: cubre combinación prioridad=1 + responsable admin + completada
  {
    id: 'e7777777-eeee-7777-eeee-777777777777',
    trato_id: 'd2222222-dddd-2222-dddd-222222222222',
    responsable_id: '11111111-1111-1111-1111-111111111111',
    titulo: 'Kick-off del proyecto de renovación',
    descripcion: null,
    tipo: 'reunion',
    estado: 'completada',
    prioridad: 1,
    fecha_limite: '2026-05-20',
    fecha_completada: '2026-05-19T16:00:00.000Z',
    creado_en: '2026-04-28T10:00:00.000Z',
    actualizado_en: '2026-05-19T16:00:00.000Z',
  },
  // --- trato d3333333 — SIN TAREAS (invariante D4 para DELETE 204 de tratos) ---
];
