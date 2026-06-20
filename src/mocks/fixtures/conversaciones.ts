import type { Conversacion, Mensaje } from '@/api/types';

// canalId 'c1111111...' pertenece a la empresa 'a1111111...' (ver canales.ts).
const CANAL_ID = 'c1111111-cccc-1111-cccc-111111111111';

export const conversacionesFixture: Conversacion[] = [
  {
    id: 'd0000001-0000-0000-0000-000000000001',
    canalId: CANAL_ID,
    contactoId: 'c0111111-cccc-0001-cccc-000000000001',
    numeroTelefono: '5215512345678@s.whatsapp.net',
    nombreContacto: 'María López',
    estado: 'ABIERTA',
    asignadoA: null,
    noLeidos: 2,
    ultimoMensajeAt: '2026-06-18T15:30:00.000Z',
    ultimoMensajeTexto: '¿Tienen cita disponible mañana?',
    labels: [],
    botActivo: true,
    creadoEn: '2026-06-18T14:00:00.000Z',
    actualizadoEn: '2026-06-18T15:30:00.000Z',
  },
  {
    id: 'd0000002-0000-0000-0000-000000000002',
    canalId: CANAL_ID,
    contactoId: null,
    numeroTelefono: '5215587654321@s.whatsapp.net',
    nombreContacto: 'Juan Pérez',
    estado: 'EN_ESPERA',
    asignadoA: null,
    noLeidos: 0,
    ultimoMensajeAt: '2026-06-18T12:10:00.000Z',
    ultimoMensajeTexto: 'Gracias, ahí estaré',
    labels: ['escalado_humano'],
    botActivo: false,
    creadoEn: '2026-06-17T09:00:00.000Z',
    actualizadoEn: '2026-06-18T12:10:00.000Z',
  },
];

// Mensajes indexados por conversacionId.
export const mensajesFixture: Record<string, Mensaje[]> = {
  'd0000001-0000-0000-0000-000000000001': [
    {
      id: 'e0000001-0000-0000-0000-000000000001',
      conversacionId: 'd0000001-0000-0000-0000-000000000001',
      waMessageId: 'wamid.mock1',
      tipo: 'TEXTO',
      direccion: 'ENTRANTE',
      contenido: 'Hola, buenas tardes',
      mediaUrl: null,
      status: 'ENTREGADO',
      enviadoPor: null,
      creadoEn: '2026-06-18T15:28:00.000Z',
    },
    {
      id: 'e0000002-0000-0000-0000-000000000002',
      conversacionId: 'd0000001-0000-0000-0000-000000000001',
      waMessageId: 'wamid.mock2',
      tipo: 'TEXTO',
      direccion: 'ENTRANTE',
      contenido: '¿Tienen cita disponible mañana?',
      mediaUrl: null,
      status: 'ENTREGADO',
      enviadoPor: null,
      creadoEn: '2026-06-18T15:30:00.000Z',
    },
  ],
  'd0000002-0000-0000-0000-000000000002': [
    {
      id: 'e0000003-0000-0000-0000-000000000003',
      conversacionId: 'd0000002-0000-0000-0000-000000000002',
      waMessageId: 'wamid.mock3',
      tipo: 'TEXTO',
      direccion: 'SALIENTE',
      contenido: 'Su cita quedó agendada para el jueves a las 10:00',
      mediaUrl: null,
      status: 'LEIDO',
      enviadoPor: 'b0000001-0000-0000-0000-000000000001',
      creadoEn: '2026-06-18T12:05:00.000Z',
    },
    {
      id: 'e0000004-0000-0000-0000-000000000004',
      conversacionId: 'd0000002-0000-0000-0000-000000000002',
      waMessageId: 'wamid.mock4',
      tipo: 'TEXTO',
      direccion: 'ENTRANTE',
      contenido: 'Gracias, ahí estaré',
      mediaUrl: null,
      status: 'ENTREGADO',
      enviadoPor: null,
      creadoEn: '2026-06-18T12:10:00.000Z',
    },
  ],
};
