import { describe, expect, it } from 'vitest';
import type { Tarea } from '@/api/types';
import type { Ficha } from '@/features/kanban/schemas/ficha.schema';
import type { ColumnaTablero } from '@/features/kanban/schemas/tablero.schema';
import { resolveTareaWorkflowStates } from '../lib/tareaWorkflow';

const tarea: Tarea = {
  id: 'tarea-1',
  tratoId: 'trato-1',
  responsableId: 'user-1',
  titulo: 'Demo',
  descripcion: null,
  tipo: 'SEGUIMIENTO',
  prioridad: 'MEDIA',
  fechaLimite: '2026-06-20T00:00:00.000Z',
  fechaCompletada: null,
  creadoEn: '2026-06-01T00:00:00.000Z',
  actualizadoEn: '2026-06-01T00:00:00.000Z',
};

const columnas: ColumnaTablero[] = [
  { id: 'col-1', nombre: 'Pendiente', color: '#64748B', limiteWip: 5, nota: null, totalValorEstimado: 0 },
];

describe('resolveTareaWorkflowStates', () => {
  it('resuelve estado operativo desde ficha TAREA y columna', () => {
    const fichas: Ficha[] = [
      {
        id: 'ficha-1',
        columnaId: 'col-1',
        tipoFicha: 'TAREA',
        tratoId: null,
        tareaId: 'tarea-1',
        actualizadoEn: '2026-06-01T00:00:00.000Z',
        etiquetas: [],
      },
    ];

    const result = resolveTareaWorkflowStates([tarea], fichas, columnas);

    expect(result['tarea-1']).toMatchObject({
      tareaId: 'tarea-1',
      fichaId: 'ficha-1',
      columnaId: 'col-1',
      nombre: 'Pendiente',
      color: '#64748B',
    });
  });

  it('devuelve fallback Sin columna si falta ficha', () => {
    const result = resolveTareaWorkflowStates([tarea], [], columnas);

    expect(result['tarea-1']).toMatchObject({
      fichaId: null,
      columnaId: null,
      nombre: 'Sin columna',
    });
  });

  it('devuelve fallback Sin columna si la ficha apunta a columna inexistente', () => {
    const fichas: Ficha[] = [
      {
        id: 'ficha-1',
        columnaId: 'col-inexistente',
        tipoFicha: 'TAREA',
        tratoId: null,
        tareaId: 'tarea-1',
        actualizadoEn: '2026-06-01T00:00:00.000Z',
        etiquetas: [],
      },
    ];

    const result = resolveTareaWorkflowStates([tarea], fichas, columnas);

    expect(result['tarea-1']).toMatchObject({
      fichaId: 'ficha-1',
      columnaId: 'col-inexistente',
      nombre: 'Sin columna',
    });
  });
});
