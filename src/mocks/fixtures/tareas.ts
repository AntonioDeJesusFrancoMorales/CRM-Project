import type { Tarea } from '@/api/types';

// Fixture de tareas con campos camelCase del back (nuevo contrato).
// Sin campo estado (el estado es client-only via localStorage).
// fechaLimite es datetime ISO obligatorio (LocalDateTime del back).
// tipo: GENERAL | SEGUIMIENTO | NEGOCIACION | CIERRE
// prioridad: BAJA | MEDIA | ALTA | URGENTE
//
// INVARIANTE para tratos.handler.test.ts (D4):
//   - d1111111 tiene EXACTAMENTE 2 tareas (e1111111, e2222222)
//   - d3333333 NO tiene tareas (se usa para DELETE 204 sin conflicto)

export const tareasFixture: Tarea[] = [
  // --- trato d1111111 — exactamente 2 tareas (invariante D4) ---
  {
    id: 'e1111111-eeee-1111-eeee-111111111111',
    tratoId: 'd1111111-dddd-1111-dddd-111111111111',
    responsableId: '22222222-2222-2222-2222-222222222222',
    titulo: 'Demo presencial con CTO',
    descripcion: 'Preparar demo con casos reales del sector.',
    tipo: 'CIERRE',
    prioridad: 'URGENTE',
    fechaLimite: '2026-05-15T00:00:00.000Z',
    fechaCompletada: null,
    creadoEn: '2026-05-01T10:00:00.000Z',
    actualizadoEn: '2026-05-01T10:00:00.000Z',
  },
  {
    id: 'e2222222-eeee-2222-eeee-222222222222',
    tratoId: 'd1111111-dddd-1111-dddd-111111111111',
    responsableId: '22222222-2222-2222-2222-222222222222',
    titulo: 'Llamada de seguimiento post-demo',
    descripcion: null,
    tipo: 'SEGUIMIENTO',
    prioridad: 'MEDIA',
    fechaLimite: '2026-05-28T00:00:00.000Z',
    fechaCompletada: null,
    creadoEn: '2026-05-01T10:05:00.000Z',
    actualizadoEn: '2026-05-01T10:05:00.000Z',
  },

  // --- trato d2222222 — 5 tareas ---
  {
    id: 'e3333333-eeee-3333-eeee-333333333333',
    tratoId: 'd2222222-dddd-2222-dddd-222222222222',
    responsableId: '11111111-1111-1111-1111-111111111111',
    titulo: 'Análisis de requerimientos inicial',
    descripcion: 'Levantamiento de procesos con equipo de TI.',
    tipo: 'GENERAL',
    prioridad: 'BAJA',
    fechaLimite: '2026-05-10T00:00:00.000Z',
    fechaCompletada: '2026-05-09T14:00:00.000Z',
    creadoEn: '2026-04-25T09:00:00.000Z',
    actualizadoEn: '2026-05-09T14:00:00.000Z',
  },
  {
    id: 'e4444444-eeee-4444-eeee-444444444444',
    tratoId: 'd2222222-dddd-2222-dddd-222222222222',
    responsableId: '22222222-2222-2222-2222-222222222222',
    titulo: 'Preparar propuesta de renovación',
    descripcion: null,
    tipo: 'NEGOCIACION',
    prioridad: 'BAJA',
    fechaLimite: '2026-05-24T00:00:00.000Z',
    fechaCompletada: null,
    creadoEn: '2026-05-10T11:00:00.000Z',
    actualizadoEn: '2026-05-20T11:00:00.000Z',
  },
  {
    id: 'e5555555-eeee-5555-eeee-555555555555',
    tratoId: 'd2222222-dddd-2222-dddd-222222222222',
    responsableId: '11111111-1111-1111-1111-111111111111',
    titulo: 'Revisar contrato de retainer',
    descripcion: 'Verificar cláusulas de confidencialidad.',
    tipo: 'SEGUIMIENTO',
    prioridad: 'MEDIA',
    fechaLimite: '2026-06-30T00:00:00.000Z',
    fechaCompletada: null,
    creadoEn: '2026-05-12T08:00:00.000Z',
    actualizadoEn: '2026-05-12T08:00:00.000Z',
  },
  {
    id: 'e6666666-eeee-6666-eeee-666666666666',
    tratoId: 'd2222222-dddd-2222-dddd-222222222222',
    responsableId: '11111111-1111-1111-1111-111111111111',
    titulo: 'Taller de capacitación de procesos',
    descripcion: 'Capacitar al equipo de Innovatech en la nueva metodología.',
    tipo: 'GENERAL',
    prioridad: 'URGENTE',
    fechaLimite: '2026-06-15T00:00:00.000Z',
    fechaCompletada: null,
    creadoEn: '2026-05-05T09:00:00.000Z',
    actualizadoEn: '2026-05-05T09:00:00.000Z',
  },
  {
    id: 'e7777777-eeee-7777-eeee-777777777777',
    tratoId: 'd2222222-dddd-2222-dddd-222222222222',
    responsableId: '11111111-1111-1111-1111-111111111111',
    titulo: 'Kick-off del proyecto de renovación',
    descripcion: null,
    tipo: 'GENERAL',
    prioridad: 'ALTA',
    fechaLimite: '2026-05-20T00:00:00.000Z',
    fechaCompletada: '2026-05-19T16:00:00.000Z',
    creadoEn: '2026-04-28T10:00:00.000Z',
    actualizadoEn: '2026-05-19T16:00:00.000Z',
  },
  // --- trato d3333333 — SIN TAREAS (invariante D4 para DELETE 204 de tratos) ---
];
