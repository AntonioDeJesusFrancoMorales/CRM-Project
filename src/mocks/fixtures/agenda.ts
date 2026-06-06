import type { Agenda } from '@/features/agenda/schemas/agenda.schema';

// Fixture de agenda (eventos del usuario) — camelCase del back (AgendaResponse).
// tipo: LLAMADA | REUNION. fecha: YYYY-MM-DD. horaInicio/horaFin: HH:mm.
// Vínculos opcionales a trato (tratoId) / tarea (tareaId).
// Campos de recordatorio: el front solo setea recordatorioHabilitado + minutosAntes;
// recordatorioEstado/EnviadoEn/ultimoIntentoEn los maneja el scheduler del back (read-only).
//
// INVARIANTE para agenda.handler.test.ts:
//   - a1111111 tiene recordatorio habilitado (PENDIENTE)
//   - a4444444 NO tiene vínculos ni recordatorio (se usa para DELETE 204)

export const agendasFixture: Agenda[] = [
  {
    id: 'a1111111-aaaa-1111-aaaa-111111111111',
    tipo: 'LLAMADA',
    asunto: 'Llamada de seguimiento con Innovatech',
    descripcion: 'Repasar avances del piloto y próximos pasos.',
    fecha: '2026-06-08',
    horaInicio: '09:00',
    horaFin: '09:30',
    tareaId: null,
    tratoId: 'd1111111-dddd-1111-dddd-111111111111',
    ubicacion: null,
    linkVideollamada: null,
    creadoPor: '550e8400-e29b-41d4-a716-446655440001',
    creadoEn: '2026-06-01T10:00:00.000Z',
    actualizadoEn: '2026-06-01T10:00:00.000Z',
    recordatorioHabilitado: true,
    minutosAntes: 15,
    recordatorioEstado: 'PENDIENTE',
    recordatorioEnviadoEn: null,
    ultimoIntentoEn: null,
  },
  {
    id: 'a2222222-aaaa-2222-aaaa-222222222222',
    tipo: 'REUNION',
    asunto: 'Demo de producto — equipo de TI',
    descripcion: 'Presentación del CRM con casos reales del sector.',
    fecha: '2026-06-08',
    horaInicio: '14:30',
    horaFin: '15:30',
    tareaId: null,
    tratoId: 'd2222222-dddd-2222-dddd-222222222222',
    ubicacion: 'Oficina central, sala 3',
    linkVideollamada: null,
    creadoPor: '550e8400-e29b-41d4-a716-446655440001',
    creadoEn: '2026-06-01T11:00:00.000Z',
    actualizadoEn: '2026-06-01T11:00:00.000Z',
    recordatorioHabilitado: true,
    minutosAntes: 30,
    recordatorioEstado: 'PENDIENTE',
    recordatorioEnviadoEn: null,
    ultimoIntentoEn: null,
  },
  {
    id: 'a3333333-aaaa-3333-aaaa-333333333333',
    tipo: 'REUNION',
    asunto: 'Kickoff de renovación de contrato',
    descripcion: null,
    fecha: '2026-06-09',
    horaInicio: '16:00',
    horaFin: null,
    tareaId: null,
    tratoId: null,
    ubicacion: 'Sala de juntas, piso 2',
    linkVideollamada: null,
    creadoPor: '550e8400-e29b-41d4-a716-446655440001',
    creadoEn: '2026-06-02T08:30:00.000Z',
    actualizadoEn: '2026-06-02T08:30:00.000Z',
    recordatorioHabilitado: false,
    minutosAntes: null,
    recordatorioEstado: null,
    recordatorioEnviadoEn: null,
    ultimoIntentoEn: null,
  },
  // --- Evento sin vínculos ni recordatorio (para DELETE 204) ---
  {
    id: 'a4444444-aaaa-4444-aaaa-444444444444',
    tipo: 'LLAMADA',
    asunto: 'Llamada rápida de coordinación',
    descripcion: null,
    fecha: '2026-06-10',
    horaInicio: '11:00',
    horaFin: null,
    tareaId: null,
    tratoId: null,
    ubicacion: null,
    linkVideollamada: null,
    creadoPor: '550e8400-e29b-41d4-a716-446655440001',
    creadoEn: '2026-06-03T09:00:00.000Z',
    actualizadoEn: '2026-06-03T09:00:00.000Z',
    recordatorioHabilitado: false,
    minutosAntes: null,
    recordatorioEstado: null,
    recordatorioEnviadoEn: null,
    ultimoIntentoEn: null,
  },
];
