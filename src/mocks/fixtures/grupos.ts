import type { Grupo, MensajeGrupo } from '@/api/types';

const CANAL_ID = 'c1111111-cccc-1111-cccc-111111111111';

export const gruposFixture: Grupo[] = [
  {
    id: 'f0000001-0000-0000-0000-000000000001',
    canalId: CANAL_ID,
    jid: '5215511112222-123456@g.us',
    nombre: 'Equipo Recepción',
    noLeidos: 1,
    ultimoMensajeAt: '2026-06-18T13:00:00.000Z',
    ultimoMensajeTexto: 'Recuerden confirmar las citas de mañana',
  },
];

export const mensajesGrupoFixture: Record<string, MensajeGrupo[]> = {
  'f0000001-0000-0000-0000-000000000001': [
    {
      id: 'a9000001-0000-0000-0000-000000000001',
      grupoId: 'f0000001-0000-0000-0000-000000000001',
      direccion: 'ENTRANTE',
      tipo: 'TEXTO',
      contenido: 'Recuerden confirmar las citas de mañana',
      mediaUrl: null,
      remitente: 'Ana (Recepción)',
      remitenteTel: '5215511112222',
      status: 'ENTREGADO',
      timestamp: '2026-06-18T13:00:00.000Z',
    },
  ],
};
