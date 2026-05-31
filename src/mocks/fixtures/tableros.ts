// Fixtures MSW para el feature Kanban — shape real del back AR-CRM (camelCase, RPC).
// Reescrito en B1.8: los tipos inventados (snake_case) fueron eliminados de api/types.ts.
// Importa desde kanban/schemas (fuente de verdad del contrato).

import type { Etiqueta, Comentario } from '@/api/types';
import type { Tablero, ColumnaTablero } from '@/features/kanban/schemas/tablero.schema';
import type { Ficha } from '@/features/kanban/schemas/ficha.schema';
import type { Columna } from '@/features/kanban/schemas/columna.schema';

// ---------------------------------------------------------------------------
// Fixture de tablero TRATOS — 4 columnas: 2×ABIERTO, 1×GANADO, 1×PERDIDO
// Columna "En negociación" tiene limiteWip para testear indicador WIP
// ---------------------------------------------------------------------------

export const columnasTablTratosIds = {
  porContactar: 'a1111111-aaaa-1111-aaaa-111111111111',
  enNegociacion: 'a2222222-aaaa-2222-aaaa-222222222222',
  ganados: 'a3333333-aaaa-3333-aaaa-333333333333',
  perdidos: 'a4444444-aaaa-4444-aaaa-444444444444',
} as const;

const COLUMNAS_TABLERO: ColumnaTablero[] = [
  {
    id: columnasTablTratosIds.porContactar,
    nombre: 'Por contactar',
    color: '#94a3b8',
    limiteWip: null,
    nota: null,
    estadoTarea: null,
    estadoTrato: 'ABIERTO',
    totalValorEstimado: 0,
  },
  {
    id: columnasTablTratosIds.enNegociacion,
    nombre: 'En negociación',
    color: '#fbbf24',
    limiteWip: 5,
    nota: 'Máximo 5 tratos activos',
    estadoTarea: null,
    estadoTrato: 'ABIERTO',
    totalValorEstimado: 430000,
  },
  {
    id: columnasTablTratosIds.ganados,
    nombre: 'Ganados',
    color: '#34d399',
    limiteWip: null,
    nota: null,
    estadoTarea: null,
    estadoTrato: 'GANADO',
    totalValorEstimado: 180000,
  },
  {
    id: columnasTablTratosIds.perdidos,
    nombre: 'Perdidos',
    color: '#f87171',
    limiteWip: null,
    nota: null,
    estadoTarea: null,
    estadoTrato: 'PERDIDO',
    totalValorEstimado: 0,
  },
];

export const tableroTratosFixture: Tablero = {
  id: 'f1111111-ffff-1111-ffff-111111111111',
  nombre: 'Pipeline de Tratos',
  descripcion: 'Estado actual de todos los tratos abiertos.',
  tipoTablero: 'TRATOS',
  columnas: COLUMNAS_TABLERO,
  creadoEn: '2026-04-01T08:00:00',
};

// ---------------------------------------------------------------------------
// Fixture de tablero TAREAS — 3 columnas: PENDIENTE, EN_CURSO, FINALIZADA
// ---------------------------------------------------------------------------

export const columnasTablTareasIds = {
  pendiente: 'b1111111-bbbb-1111-bbbb-111111111111',
  enCurso: 'b2222222-bbbb-2222-bbbb-222222222222',
  finalizada: 'b3333333-bbbb-3333-bbbb-333333333333',
} as const;

const COLUMNAS_TABLERO_TAREAS: ColumnaTablero[] = [
  {
    id: columnasTablTareasIds.pendiente,
    nombre: 'Pendiente',
    color: '#94a3b8',
    limiteWip: null,
    nota: null,
    estadoTarea: 'PENDIENTE',
    estadoTrato: null,
    totalValorEstimado: 0,
  },
  {
    id: columnasTablTareasIds.enCurso,
    nombre: 'En Curso',
    color: '#fbbf24',
    limiteWip: 3,
    nota: null,
    estadoTarea: 'EN_CURSO',
    estadoTrato: null,
    totalValorEstimado: 0,
  },
  {
    id: columnasTablTareasIds.finalizada,
    nombre: 'Finalizada',
    color: '#34d399',
    limiteWip: null,
    nota: null,
    estadoTarea: 'FINALIZADA',
    estadoTrato: null,
    totalValorEstimado: 0,
  },
];

export const tableroTareasFixture: Tablero = {
  id: 'e1111111-eeee-1111-eeee-111111111111',
  nombre: 'Pipeline de Tareas',
  descripcion: 'Tablero de gestión de tareas.',
  tipoTablero: 'TAREAS',
  columnas: COLUMNAS_TABLERO_TAREAS,
  creadoEn: '2026-04-01T08:00:00',
};

// Alias unificado — incluye tableros de todos los tipos
export const tablerosFixture: Tablero[] = [tableroTratosFixture, tableroTareasFixture];

export const columnasFixtureTareas: Columna[] = [
  {
    id: columnasTablTareasIds.pendiente,
    nombre: 'Pendiente',
    color: '#94a3b8',
    tipoTablero: 'TAREAS',
    tipoColumna: 'PREDETERMINADA',
  },
];

// ---------------------------------------------------------------------------
// Catálogo de columnas (ColumnaResponse)
// ---------------------------------------------------------------------------

export const columnasFixture: Columna[] = [
  {
    id: columnasTablTratosIds.porContactar,
    nombre: 'Por contactar',
    color: '#94a3b8',
    tipoTablero: 'TRATOS',
    tipoColumna: 'PREDETERMINADA',
  },
  {
    id: columnasTablTratosIds.enNegociacion,
    nombre: 'En negociación',
    color: '#fbbf24',
    tipoTablero: 'TRATOS',
    tipoColumna: 'PERSONALIZADA',
  },
  {
    id: columnasTablTratosIds.ganados,
    nombre: 'Ganados',
    color: '#34d399',
    tipoTablero: 'TRATOS',
    tipoColumna: 'PREDETERMINADA',
  },
  {
    id: columnasTablTratosIds.perdidos,
    nombre: 'Perdidos',
    color: '#f87171',
    tipoTablero: 'TRATOS',
    tipoColumna: 'PREDETERMINADA',
  },
];

// ---------------------------------------------------------------------------
// Fichas — 3 fichas TRATO + 2 fichas TAREA
// tratoId/tareaId referencian ids de tratosFixture y tareasFixture respectivamente
// ---------------------------------------------------------------------------

export const fichasFixture: Ficha[] = [
  // TRATO fichas — apuntan a columnas del tablero TRATOS
  {
    id: 'h1111111-hhhh-1111-hhhh-111111111111',
    columnaId: columnasTablTratosIds.porContactar,
    tipoFicha: 'TRATO',
    tratoId: 'd1111111-dddd-1111-dddd-111111111111',
    tareaId: null,
    responsableId: '22222222-2222-2222-2222-222222222222',
    creadoPor: '22222222-2222-2222-2222-222222222222',
    creadoEn: '2026-04-10T08:00:00Z',
    actualizadoEn: '2026-04-10T08:00:00Z',
  },
  {
    id: 'h2222222-hhhh-2222-hhhh-222222222222',
    columnaId: columnasTablTratosIds.enNegociacion,
    tipoFicha: 'TRATO',
    tratoId: 'd2222222-dddd-2222-dddd-222222222222',
    tareaId: null,
    responsableId: '22222222-2222-2222-2222-222222222222',
    creadoPor: '22222222-2222-2222-2222-222222222222',
    creadoEn: '2026-04-11T09:00:00Z',
    actualizadoEn: '2026-04-11T09:00:00Z',
  },
  {
    id: 'h3333333-hhhh-3333-hhhh-333333333333',
    columnaId: columnasTablTratosIds.enNegociacion,
    tipoFicha: 'TRATO',
    tratoId: 'd3333333-dddd-3333-dddd-333333333333',
    tareaId: null,
    responsableId: '22222222-2222-2222-2222-222222222222',
    creadoPor: '22222222-2222-2222-2222-222222222222',
    creadoEn: '2026-04-12T10:00:00Z',
    actualizadoEn: '2026-04-12T10:00:00Z',
  },
  // TAREA fichas — apuntan a columnas del tablero TAREAS
  {
    id: 'i1111111-iiii-1111-iiii-111111111111',
    columnaId: columnasTablTareasIds.pendiente,
    tipoFicha: 'TAREA',
    tratoId: null,
    tareaId: 'k1111111-kkkk-1111-kkkk-111111111111',
    responsableId: '22222222-2222-2222-2222-222222222222',
    creadoPor: '22222222-2222-2222-2222-222222222222',
    creadoEn: '2026-04-13T08:00:00Z',
    actualizadoEn: '2026-04-13T08:00:00Z',
  },
  {
    id: 'i2222222-iiii-2222-iiii-222222222222',
    columnaId: columnasTablTareasIds.enCurso,
    tipoFicha: 'TAREA',
    tratoId: null,
    tareaId: 'k2222222-kkkk-2222-kkkk-222222222222',
    responsableId: '22222222-2222-2222-2222-222222222222',
    creadoPor: '22222222-2222-2222-2222-222222222222',
    creadoEn: '2026-04-14T09:00:00Z',
    actualizadoEn: '2026-04-14T09:00:00Z',
  },
];

// ---------------------------------------------------------------------------
// Etiquetas y comentarios — vacios por ahora (fuera del scope de kanban-tablero-back)
// Etiqueta y Comentario siguen en api/types.ts (no son del contrato kanban)
// ---------------------------------------------------------------------------

export const etiquetasFixture: Etiqueta[] = [];
export const comentariosFixture: Comentario[] = [];
