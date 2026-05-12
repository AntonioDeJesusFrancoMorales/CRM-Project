import type { Tarea } from '@/api/types';

export const tareasFixture: Tarea[] = [
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
  {
    id: 'e2222222-eeee-2222-eeee-222222222222',
    trato_id: 'd1111111-dddd-1111-dddd-111111111111',
    responsable_id: '22222222-2222-2222-2222-222222222222',
    titulo: 'Llamada de seguimiento post-demo',
    descripcion: null,
    tipo: 'llamada',
    estado: 'pendiente',
    prioridad: 2,
    fecha_limite: '2026-05-22',
    fecha_completada: null,
    creado_en: '2026-05-01T10:05:00.000Z',
    actualizado_en: '2026-05-01T10:05:00.000Z',
  },
];
