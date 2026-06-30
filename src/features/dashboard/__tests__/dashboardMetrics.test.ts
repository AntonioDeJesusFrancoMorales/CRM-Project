import { describe, expect, it } from 'vitest';
import { tratosFixture } from '@/mocks/fixtures/tratos';
import { tareasFixture } from '@/mocks/fixtures/tareas';
import { contactosFixture } from '@/mocks/fixtures/contactos';
import { empresasFixture } from '@/mocks/fixtures/empresas';
import { usuariosFixture } from '@/mocks/fixtures/usuarios';
import { computeDashboardInsights } from '../lib/dashboardMetrics';

const now = new Date('2026-06-29T12:00:00.000Z');
const usuarios = usuariosFixture.map(({ password: _password, rol_sistema: _rs, rol_empresa: _re, ...usuario }) => usuario);

describe('dashboardMetrics', () => {
  it('calcula KPIs ejecutivos desde datos existentes', () => {
    const insights = computeDashboardInsights({
      tratos: tratosFixture,
      tareas: tareasFixture,
      contactos: contactosFixture,
      empresas: empresasFixture,
      usuarios,
      now,
    });

    expect(insights.kpis.pipelineAbierto).toBe(845000);
    expect(insights.kpis.pipelinePonderado).toBe(704500);
    expect(insights.kpis.oportunidadesAbiertas).toBe(4);
    expect(insights.kpis.tareasVencidas).toBe(4);
    expect(insights.kpis.cierresProximos30).toBe(2);
  });

  it('detecta alertas accionables y salud CRM', () => {
    const insights = computeDashboardInsights({
      tratos: tratosFixture,
      tareas: tareasFixture,
      contactos: contactosFixture,
      empresas: empresasFixture,
      usuarios,
      now,
    });

    expect(insights.alerts.map((alert) => alert.id)).toContain('overdue-tasks');
    expect(insights.alerts.map((alert) => alert.id)).toContain('deals-without-next-task');
    expect(insights.health.map((item) => item.id)).toContain('companies-without-owner');
    expect(insights.health.map((item) => item.id)).toContain('contacts-without-email');
  });

  it('prioriza acciones vencidas y urgentes antes que próximas', () => {
    const insights = computeDashboardInsights({
      tratos: tratosFixture,
      tareas: tareasFixture,
      contactos: contactosFixture,
      empresas: empresasFixture,
      usuarios,
      now,
    });

    expect(insights.upcomingActions[0]?.tarea.titulo).toBe('Demo presencial con CTO');
    expect(insights.upcomingActions[0]?.status).toBe('vencida');
  });

  it('ordena cierres próximos por fecha ascendente', () => {
    const insights = computeDashboardInsights({
      tratos: tratosFixture,
      tareas: tareasFixture,
      contactos: contactosFixture,
      empresas: empresasFixture,
      usuarios,
      now,
    });

    expect(insights.upcomingCloses.map((item) => item.trato.nombre)).toEqual([
      'Implementación CRM Innovatech',
      'Consultoría procesos Maya',
    ]);
  });
});
