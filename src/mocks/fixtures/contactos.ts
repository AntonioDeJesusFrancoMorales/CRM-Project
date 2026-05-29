import type { Contacto } from '@/api/types';

// Fixture de contactos con campos camelCase del back.
// Cubre los tres estadoRelacion: PROSPECTO, ACTIVO, INACTIVO.
// El ID 'b1111111-bbbb-1111-bbbb-111111111111' (contacto6) está referenciado en tratosFixture
// como prospecto_id con un trato 'abierto' → dispara guard 409 en DELETE.
// empresaId siempre presente (@NotNull en CreateContactoRequest del back).

export const contactosFixture: Contacto[] = [
  // PROSPECTO sin correo
  {
    id: 'c0111111-cccc-0001-cccc-000000000001',
    nombre: 'Lucía',
    correo: null,
    telefono: '+52 961 111 0001',
    empresaId: 'a1111111-aaaa-1111-aaaa-111111111111', // Innovatech Solutions
    estadoRelacion: 'PROSPECTO',
    comoNosConocio: null,
    responsableId: null,
    creadoPor: null,
    creadoEn: '2026-01-15T09:00:00.000Z',
    actualizadoEn: '2026-01-15T09:00:00.000Z',
  },
  // PROSPECTO completo con todos los campos
  {
    id: 'c0222222-cccc-0002-cccc-000000000002',
    nombre: 'Martín',
    correo: 'martin.gutierrez@example.com',
    telefono: '+52 961 222 0002',
    empresaId: 'a2222222-aaaa-2222-aaaa-222222222222', // Corporativo Maya
    estadoRelacion: 'PROSPECTO',
    comoNosConocio: 'Referido',
    responsableId: '11111111-1111-1111-1111-111111111111',
    creadoPor: '11111111-1111-1111-1111-111111111111',
    creadoEn: '2026-02-01T10:30:00.000Z',
    actualizadoEn: '2026-02-10T14:00:00.000Z',
  },
  // ACTIVO con comoNosConocio de texto libre
  {
    id: 'c0333333-cccc-0003-cccc-000000000003',
    nombre: 'Sofía',
    correo: 'sofia.mendoza@example.com',
    telefono: '+52 961 333 0003',
    empresaId: 'a1111111-aaaa-1111-aaaa-111111111111', // Innovatech Solutions
    estadoRelacion: 'ACTIVO',
    comoNosConocio: 'Conferencia de tecnología 2025',
    responsableId: '22222222-2222-2222-2222-222222222222',
    creadoPor: '22222222-2222-2222-2222-222222222222',
    creadoEn: '2026-02-15T08:00:00.000Z',
    actualizadoEn: '2026-03-01T11:00:00.000Z',
  },
  // ACTIVO con comoNosConocio del array de sugerencias
  {
    id: 'c0444444-cccc-0004-cccc-000000000004',
    nombre: 'Diego',
    correo: 'diego.torres@example.com',
    telefono: null,
    empresaId: 'a3333333-aaaa-3333-aaaa-333333333333', // Distribuidora del Sur
    estadoRelacion: 'ACTIVO',
    comoNosConocio: 'Redes sociales',
    responsableId: null,
    creadoPor: null,
    creadoEn: '2026-03-05T12:00:00.000Z',
    actualizadoEn: '2026-03-05T12:00:00.000Z',
  },
  // INACTIVO (sin tratos abiertos — DELETE debe retornar 204)
  {
    id: 'c0555555-cccc-0005-cccc-000000000005',
    nombre: 'Valeria',
    correo: 'valeria.cruz@example.com',
    telefono: '+52 961 555 0005',
    empresaId: 'a3333333-aaaa-3333-aaaa-333333333333', // Distribuidora del Sur
    estadoRelacion: 'INACTIVO',
    comoNosConocio: 'Búsqueda web',
    responsableId: null,
    creadoPor: null,
    creadoEn: '2025-10-01T07:00:00.000Z',
    actualizadoEn: '2026-01-10T09:00:00.000Z',
  },
  // ACTIVO — ID coincide con cliente_id de tratosFixture[1] (Renovación licencia Innovatech).
  {
    id: 'c1111111-cccc-1111-cccc-111111111111',
    nombre: 'Ana',
    correo: 'ana.rodriguez@innovatech.example.com',
    telefono: '+52 961 555 1001',
    empresaId: 'a1111111-aaaa-1111-aaaa-111111111111', // Innovatech Solutions
    estadoRelacion: 'ACTIVO',
    comoNosConocio: 'Evento',
    responsableId: '22222222-2222-2222-2222-222222222222',
    creadoPor: '11111111-1111-1111-1111-111111111111',
    creadoEn: '2026-03-10T10:00:00.000Z',
    actualizadoEn: '2026-04-25T11:00:00.000Z',
  },
  // ACTIVO — ID coincide con cliente_id de tratosFixture[2] (Consultoría procesos Maya).
  {
    id: 'c2222222-cccc-2222-cccc-222222222222',
    nombre: 'Diego',
    correo: 'dvargas@corpmaya.example.com',
    telefono: '+52 961 555 1002',
    empresaId: 'a2222222-aaaa-2222-aaaa-222222222222', // Corporativo Maya
    estadoRelacion: 'ACTIVO',
    comoNosConocio: 'Referido',
    responsableId: '22222222-2222-2222-2222-222222222222',
    creadoPor: '11111111-1111-1111-1111-111111111111',
    creadoEn: '2026-02-18T09:00:00.000Z',
    actualizadoEn: '2026-05-01T13:20:00.000Z',
  },
  // INACTIVO con trato abierto en tratosFixture (prospecto_id referenciado) → DELETE 409
  // ID deliberadamente coincide con el prospecto_id de tratosFixture[0] y tratosFixture[4].
  // tratosFixture[0].estado = 'abierto' → guard activado.
  {
    id: 'b1111111-bbbb-1111-bbbb-111111111111',
    nombre: 'Carlos',
    correo: 'carlos.vega@example.com',
    telefono: '+52 961 666 0006',
    empresaId: 'a2222222-aaaa-2222-aaaa-222222222222', // Corporativo Maya
    estadoRelacion: 'INACTIVO',
    comoNosConocio: 'Evento',
    responsableId: '11111111-1111-1111-1111-111111111111',
    creadoPor: '11111111-1111-1111-1111-111111111111',
    creadoEn: '2025-09-15T08:00:00.000Z',
    actualizadoEn: '2026-04-01T10:00:00.000Z',
  },
];
