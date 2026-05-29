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

// Alias para compatibilidad con código existente que use tablerosFixture[]
export const tablerosFixture: Tablero[] = [tableroTratosFixture];

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
// Fichas — 3 fichas TRATO apuntando a tratos del fixture de tratos
// tratoId referencia los ids de tratosFixture (d1111111..., d2222222..., d3333333...)
// ---------------------------------------------------------------------------

export const fichasFixture: Ficha[] = [
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
];

// ---------------------------------------------------------------------------
// Etiquetas y comentarios — vacios por ahora (fuera del scope de kanban-tablero-back)
// Etiqueta y Comentario siguen en api/types.ts (no son del contrato kanban)
// ---------------------------------------------------------------------------

export const etiquetasFixture: Etiqueta[] = [];
export const comentariosFixture: Comentario[] = [];
