import { describe, expect, it } from 'vitest';
import type { Tarea } from '@/api/types';
import {
  applyTareaFilters,
  createEmptyTareaFilters,
  hasActiveTareaFilters,
} from '../lib/tareaFilters';

const tareas: Tarea[] = [
  {
    id: 'tarea-1',
    tratoId: 'trato-1',
    responsableId: 'user-1',
    titulo: 'Demo presencial con CTO',
    descripcion: null,
    tipo: 'CIERRE',
    prioridad: 'URGENTE',
    fechaLimite: '2026-06-20T00:00:00.000Z',
    fechaCompletada: null,
    creadoEn: '2026-06-01T00:00:00.000Z',
    actualizadoEn: '2026-06-01T00:00:00.000Z',
  },
  {
    id: 'tarea-2',
    tratoId: 'trato-2',
    responsableId: 'user-2',
    titulo: 'Llamada de seguimiento',
    descripcion: null,
    tipo: 'SEGUIMIENTO',
    prioridad: 'MEDIA',
    fechaLimite: '2026-07-02T00:00:00.000Z',
    fechaCompletada: null,
    creadoEn: '2026-06-01T00:00:00.000Z',
    actualizadoEn: '2026-06-01T00:00:00.000Z',
  },
];

describe('tareaFilters', () => {
  it('detecta filtros activos', () => {
    expect(hasActiveTareaFilters(createEmptyTareaFilters())).toBe(false);
    expect(hasActiveTareaFilters({ ...createEmptyTareaFilters(), search: 'demo' })).toBe(true);
  });

  it('filtra por búsqueda, prioridad, responsable, trato y tipo', () => {
    const result = applyTareaFilters(tareas, {
      search: 'llamada',
      prioridad: 'MEDIA',
      responsableId: 'user-2',
      tratoId: 'trato-2',
      tipo: 'SEGUIMIENTO',
    });

    expect(result.map((tarea) => tarea.id)).toEqual(['tarea-2']);
  });

  it('filtra vencidas sin incluir completadas', () => {
    const result = applyTareaFilters(
      tareas,
      { search: '', vencimiento: 'vencidas' },
      new Date('2026-06-29T00:00:00.000Z'),
    );

    expect(result.map((tarea) => tarea.id)).toEqual(['tarea-1']);
  });

  it('filtra estado operativo por columna Kanban derivada', () => {
    const result = applyTareaFilters(
      tareas,
      { search: '', estado: 'col-en-curso' },
      new Date('2026-06-29T00:00:00.000Z'),
      {
        'tarea-1': {
          tareaId: 'tarea-1',
          fichaId: 'ficha-1',
          columnaId: 'col-pendiente',
          nombre: 'Pendiente',
          color: null,
        },
        'tarea-2': {
          tareaId: 'tarea-2',
          fichaId: 'ficha-2',
          columnaId: 'col-en-curso',
          nombre: 'En Curso',
          color: null,
        },
      },
    );

    expect(result.map((tarea) => tarea.id)).toEqual(['tarea-2']);
  });
});
