import type { Trato } from '@/api/types';

// Fixture de tratos con campos camelCase del back (modelo unificado).
// Sin estado/prospecto_id/cliente_id; con contactoId/responsableId/tipoContrato.
// Un fixture conserva motivoPerdida no-null para cubrir el display condicional.

export const tratosFixture: Trato[] = [
  {
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
  },
  {
    id: 'd2222222-dddd-2222-dddd-222222222222',
    contactoId: 'c1111111-cccc-1111-cccc-111111111111',
    responsableId: '22222222-2222-2222-2222-222222222222',
    nombre: 'Renovación licencia anual Innovatech',
    valorEstimado: 180000,
    probabilidad: 90,
    fechaCierreEsperada: '2026-09-15',
    tipoContrato: 'LICENCIA',
    motivoPerdida: null,
    creadoEn: '2026-04-25T11:00:00.000Z',
    actualizadoEn: '2026-05-05T09:30:00.000Z',
  },
  {
    id: 'd3333333-dddd-3333-dddd-333333333333',
    contactoId: 'c2222222-cccc-2222-cccc-222222222222',
    responsableId: '11111111-1111-1111-1111-111111111111',
    nombre: 'Consultoría procesos Maya',
    valorEstimado: 95000,
    probabilidad: 50,
    fechaCierreEsperada: '2026-07-20',
    tipoContrato: 'SUSCRIPCION',
    motivoPerdida: null,
    creadoEn: '2026-04-12T14:30:00.000Z',
    actualizadoEn: '2026-05-02T16:00:00.000Z',
  },
  {
    id: 'd4444444-dddd-4444-dddd-444444444444',
    contactoId: 'c1111111-cccc-1111-cccc-111111111111',
    responsableId: '22222222-2222-2222-2222-222222222222',
    nombre: 'Portal B2B Innovatech',
    valorEstimado: 320000,
    probabilidad: 100,
    fechaCierreEsperada: '2026-03-15',
    tipoContrato: 'PERMANENTE',
    motivoPerdida: null,
    creadoEn: '2026-02-10T09:00:00.000Z',
    actualizadoEn: '2026-03-15T17:00:00.000Z',
  },
  {
    id: 'd5555555-dddd-5555-dddd-555555555555',
    contactoId: 'b1111111-bbbb-1111-bbbb-111111111111',
    responsableId: '11111111-1111-1111-1111-111111111111',
    nombre: 'Automatización logística Maya',
    valorEstimado: 75000,
    probabilidad: 0,
    fechaCierreEsperada: '2026-01-31',
    tipoContrato: 'OTRO',
    // Este fixture conserva motivoPerdida para cubrir el display condicional (TratoInfoTab)
    motivoPerdida: 'Presupuesto insuficiente del cliente',
    creadoEn: '2025-12-01T08:00:00.000Z',
    actualizadoEn: '2026-01-31T18:00:00.000Z',
  },
];
