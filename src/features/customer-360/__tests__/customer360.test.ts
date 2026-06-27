import { describe, expect, it } from 'vitest';
import { contactosFixture } from '@/mocks/fixtures/contactos';
import { tratosFixture } from '@/mocks/fixtures/tratos';
import { tareasFixture } from '@/mocks/fixtures/tareas';
import { empresasFixture } from '@/mocks/fixtures/empresas';
import {
  getContactosByEmpresa,
  getCustomer360Kpis,
  getEmpresaByContacto,
  getTareasByTratos,
  getTratosByContacto,
  getTratosByEmpresa,
} from '../lib/customer360';

describe('customer360 derivations', () => {
  it('deriva tratos y tareas de un contacto', () => {
    const contactoId = 'c1111111-cccc-1111-cccc-111111111111';
    const tratos = getTratosByContacto(contactoId, tratosFixture);
    const tareas = getTareasByTratos(tratos, tareasFixture);

    expect(tratos.map((trato) => trato.id)).toEqual([
      'd2222222-dddd-2222-dddd-222222222222',
      'd4444444-dddd-4444-dddd-444444444444',
    ]);
    expect(tareas).toHaveLength(5);
  });

  it('deriva contactos, tratos y tareas de una empresa', () => {
    const empresaId = 'a1111111-aaaa-1111-aaaa-111111111111';
    const contactos = getContactosByEmpresa(empresaId, contactosFixture);
    const tratos = getTratosByEmpresa(contactos, tratosFixture);
    const tareas = getTareasByTratos(tratos, tareasFixture);

    expect(contactos.map((contacto) => contacto.nombre)).toContain('Sofía');
    expect(tratos.map((trato) => trato.nombre)).toContain('Renovación licencia anual Innovatech');
    expect(tareas).toHaveLength(5);
  });

  it('resuelve empresa vinculada de un contacto', () => {
    const contacto = contactosFixture.find((item) => item.id === 'c0333333-cccc-0003-cccc-000000000003')!;
    const empresa = getEmpresaByContacto(contacto, empresasFixture);

    expect(empresa?.nombre).toBe('Innovatech Solutions');
  });

  it('calcula KPIs con pipeline abierto y tareas pendientes', () => {
    const tratos = [
      { ...tratosFixture[1]!, estado: 'ABIERTO' as const, valorEstimado: 100 },
      { ...tratosFixture[4]!, estado: 'PERDIDO' as const, valorEstimado: 999 },
      { ...tratosFixture[3]!, estado: 'ABIERTO' as const, valorEstimado: null },
    ];
    const tareas = [
      { ...tareasFixture[0]!, fechaCompletada: null },
      { ...tareasFixture[1]!, fechaCompletada: '2026-01-01T00:00:00.000Z' },
    ];

    const kpis = getCustomer360Kpis(tratos, tareas, contactosFixture.slice(0, 2));

    expect(kpis.contactos).toBe(2);
    expect(kpis.tratos).toBe(3);
    expect(kpis.tratosAbiertos).toBe(2);
    expect(kpis.pipelineAbierto).toBe(100);
    expect(kpis.tareasPendientes).toBe(1);
  });
});
