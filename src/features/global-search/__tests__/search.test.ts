import { describe, expect, it } from 'vitest';
import type { Contacto, Empresa, Tarea, Trato } from '@/api/types';
import { buildGlobalSearchResults, countGlobalSearchResults, normalizeSearchText } from '../lib/search';

const empresa = {
  id: 'emp-1',
  nombre: 'Comercial Ámbar',
  sector: 'Retail',
  telefono: '555-111',
  paginaWeb: 'https://ambar.test',
  facebook: null,
  instagram: null,
  twitter: null,
  estadoRelacion: 'ACTIVO',
  responsableId: null,
  creadoPor: null,
  notas: 'Cuenta estratégica',
  creadoEn: '2026-01-01T00:00:00Z',
  actualizadoEn: '2026-01-01T00:00:00Z',
} satisfies Empresa;

const contacto = {
  id: 'con-1',
  nombre: 'María Pérez',
  correo: 'maria@test.com',
  telefono: '555-222',
  empresaId: 'emp-1',
  estadoRelacion: 'PROSPECTO',
  cargo: 'Gerente',
  comoNosConocio: 'LinkedIn',
  responsableId: null,
  creadoPor: null,
  creadoEn: '2026-01-01T00:00:00Z',
  actualizadoEn: '2026-01-01T00:00:00Z',
} satisfies Contacto;

const trato = {
  id: 'tra-1',
  contactoId: 'con-1',
  responsableId: 'usr-1',
  nombre: 'Renovación anual',
  valorEstimado: 1000,
  probabilidad: 70,
  fechaCierreEsperada: null,
  tipoContrato: 'SUSCRIPCION',
  estado: 'ABIERTO',
  motivoPerdida: null,
  creadoEn: '2026-01-01T00:00:00Z',
  actualizadoEn: null,
} satisfies Trato;

const tarea = {
  id: 'tar-1',
  tratoId: 'tra-1',
  responsableId: 'usr-1',
  titulo: 'Llamar por seguimiento',
  descripcion: 'Confirmar demo',
  tipo: 'SEGUIMIENTO',
  prioridad: 'ALTA',
  fechaLimite: '2026-01-02T10:00:00Z',
  fechaCompletada: null,
  creadoEn: '2026-01-01T00:00:00Z',
  actualizadoEn: '2026-01-01T00:00:00Z',
} satisfies Tarea;

describe('global-search/search', () => {
  it('normaliza mayúsculas y acentos', () => {
    expect(normalizeSearchText('  ÁmBAR Pérez  ')).toBe('ambar perez');
  });

  it('no devuelve resultados con query menor a 2 caracteres', () => {
    const groups = buildGlobalSearchResults({ empresas: [empresa], query: 'a' });
    expect(countGlobalSearchResults(groups)).toBe(0);
  });

  it('genera rutas correctas por entidad', () => {
    const baseInput = {
      empresas: [empresa],
      contactos: [contacto],
      tratos: [trato],
      tareas: [tarea],
    };

    expect(buildGlobalSearchResults({ ...baseInput, query: 'ambar' }).empresas[0]?.to).toBe('/empresas/emp-1');
    expect(buildGlobalSearchResults({ ...baseInput, query: 'maria' }).contactos[0]?.to).toBe('/contactos/con-1');
    expect(buildGlobalSearchResults({ ...baseInput, query: 'renovacion' }).tratos[0]?.to).toBe('/tratos/tra-1');
    expect(buildGlobalSearchResults({ ...baseInput, query: 'llamar' }).tareas[0]?.to).toBe('/tareas/tar-1');
  });

  it('encuentra coincidencias sin acento', () => {
    const groups = buildGlobalSearchResults({ empresas: [empresa], contactos: [contacto], query: 'ambar' });
    expect(groups.empresas).toHaveLength(1);
    expect(groups.contactos).toHaveLength(0);
  });

  it('limita resultados por grupo', () => {
    const empresas = Array.from({ length: 3 }, (_, index) => ({
      ...empresa,
      id: `emp-${index}`,
      nombre: `Empresa Demo ${index}`,
    }));

    const groups = buildGlobalSearchResults({ empresas, query: 'demo', limitPerGroup: 2 });
    expect(groups.empresas).toHaveLength(2);
  });
});
