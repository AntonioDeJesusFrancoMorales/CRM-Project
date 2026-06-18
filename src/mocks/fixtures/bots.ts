import type { Bot } from '@/api/types';

export const botsFixture: Bot[] = [
  {
    id: 'b1111111-bbbb-1111-bbbb-111111111111',
    nombre: 'Agente principal',
    canalId: null,
    webhookUrl: 'https://n8n.example.com/webhook/agente-principal',
    apiAccessToken: 'mocktoken1234567890abcdef1234567890abcdef',
    activo: true,
    creadoEn: '2026-01-20T11:00:00.000Z',
    actualizadoEn: '2026-01-20T11:00:00.000Z',
  },
];
