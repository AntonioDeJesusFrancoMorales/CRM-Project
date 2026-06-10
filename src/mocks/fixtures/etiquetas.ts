// Fixture MSW de etiquetas — shape real del back (EtiquetaResponse, camelCase).
// Catálogo GLOBAL tipado: cada etiqueta es TAREA o TRATO. color hex #RRGGBB MAYÚS.
// Store mutable: los handlers de etiquetas operan sobre este array.

import type { Etiqueta } from '@/api/types';

export const etiquetasFixture: Etiqueta[] = [
  // ── Etiquetas de TRATO ──────────────────────────────────────────
  {
    id: 'c1111111-cccc-1111-cccc-111111111111',
    nombre: 'Prioritario',
    tipoEtiqueta: 'TRATO',
    color: '#EF4444',
    creadoEn: '2026-04-01T08:00:00',
  },
  {
    id: 'c2222222-cccc-2222-cccc-222222222222',
    nombre: 'Renovación',
    tipoEtiqueta: 'TRATO',
    color: '#3B82F6',
    creadoEn: '2026-04-01T08:00:00',
  },
  {
    id: 'c3333333-cccc-3333-cccc-333333333333',
    nombre: 'Upsell',
    tipoEtiqueta: 'TRATO',
    color: '#10B981',
    creadoEn: '2026-04-01T08:00:00',
  },
  // ── Etiquetas de TAREA ──────────────────────────────────────────
  {
    id: 'c4444444-cccc-4444-cccc-444444444444',
    nombre: 'Urgente',
    tipoEtiqueta: 'TAREA',
    color: '#F59E0B',
    creadoEn: '2026-04-01T08:00:00',
  },
  {
    id: 'c5555555-cccc-5555-cccc-555555555555',
    nombre: 'Bloqueada',
    tipoEtiqueta: 'TAREA',
    color: '#6B7280',
    creadoEn: '2026-04-01T08:00:00',
  },
];
