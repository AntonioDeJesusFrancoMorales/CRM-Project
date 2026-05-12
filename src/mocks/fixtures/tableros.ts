import type { Tablero, Columna, Ficha, Etiqueta, Comentario } from '@/api/types';

export const tablerosFixture: Tablero[] = [
  {
    id: 'f1111111-ffff-1111-ffff-111111111111',
    nombre: 'Pipeline de Tratos',
    descripcion: 'Estado actual de todos los tratos abiertos.',
    tipo_ficha: 'trato',
    creado_en: '2026-04-01T08:00:00.000Z',
  },
  {
    id: 'f2222222-ffff-2222-ffff-222222222222',
    nombre: 'Tareas de la Semana',
    descripcion: 'Tareas activas del equipo.',
    tipo_ficha: 'tarea',
    creado_en: '2026-04-10T09:00:00.000Z',
  },
];

export const columnasFixture: Columna[] = [
  { id: 'g1111111-gggg-1111-gggg-111111111111', tablero_id: 'f1111111-ffff-1111-ffff-111111111111', nombre: 'Por contactar', color: '#94a3b8', posicion: 0, limite_wip: null, estado_vinculado: null },
  { id: 'g2222222-gggg-2222-gggg-222222222222', tablero_id: 'f1111111-ffff-1111-ffff-111111111111', nombre: 'En negociación', color: '#fbbf24', posicion: 1, limite_wip: 10, estado_vinculado: null },
  { id: 'g3333333-gggg-3333-gggg-333333333333', tablero_id: 'f1111111-ffff-1111-ffff-111111111111', nombre: 'Ganados', color: '#34d399', posicion: 2, limite_wip: null, estado_vinculado: 'ganado' },
];

export const fichasFixture: Ficha[] = [];
export const etiquetasFixture: Etiqueta[] = [];
export const comentariosFixture: Comentario[] = [];
