// Tests del schema Zod para Agenda — contrato del back (Create/EditAgendaRequest + Agenda.create).
// tipo: LLAMADA | REUNION. asunto/fecha/horaInicio requeridos.
// horaFin debe ser posterior a horaInicio. minutosAntes requerido (≥1) si recordatorioHabilitado.

import { describe, it, expect } from 'vitest';
import { agendaCreateSchema, type AgendaCreateInput } from '../schemas/agenda.schema';

// Base válida: REUNION requiere ubicación (regla condicional del front).
const VALID: AgendaCreateInput = {
  tipo: 'REUNION',
  asunto: 'Reunión de prueba',
  descripcion: null,
  fecha: '2026-06-10',
  horaInicio: '09:00',
  horaFin: '10:00',
  tareaId: null,
  tratoId: null,
  ubicacion: 'Oficina central, sala 3',
  linkVideollamada: null,
  recordatorioHabilitado: false,
  minutosAntes: null,
};

function paths(result: ReturnType<typeof agendaCreateSchema.safeParse>): string[] {
  return result.success ? [] : result.error.issues.map((i) => i.path.join('.'));
}

describe('agendaCreateSchema', () => {
  it('(a) acepta un input válido completo', () => {
    expect(agendaCreateSchema.safeParse(VALID).success).toBe(true);
  });

  it('(b) rechaza asunto vacío — error en path asunto', () => {
    const result = agendaCreateSchema.safeParse({ ...VALID, asunto: '' });
    expect(result.success).toBe(false);
    expect(paths(result)).toContain('asunto');
  });

  it('(c) rechaza asunto con 201 caracteres', () => {
    const result = agendaCreateSchema.safeParse({ ...VALID, asunto: 'a'.repeat(201) });
    expect(result.success).toBe(false);
    expect(paths(result)).toContain('asunto');
  });

  it('(d) rechaza fecha vacía — campo requerido', () => {
    const result = agendaCreateSchema.safeParse({ ...VALID, fecha: '' });
    expect(result.success).toBe(false);
    expect(paths(result)).toContain('fecha');
  });

  it('(e) rechaza horaInicio vacía — campo requerido', () => {
    const result = agendaCreateSchema.safeParse({ ...VALID, horaInicio: '' });
    expect(result.success).toBe(false);
    expect(paths(result)).toContain('horaInicio');
  });

  it('(f) rechaza horaFin anterior o igual a horaInicio', () => {
    const result = agendaCreateSchema.safeParse({ ...VALID, horaInicio: '10:00', horaFin: '09:00' });
    expect(result.success).toBe(false);
    expect(paths(result)).toContain('horaFin');
  });

  it('(g) acepta horaFin nula (es opcional)', () => {
    expect(agendaCreateSchema.safeParse({ ...VALID, horaFin: null }).success).toBe(true);
  });

  it('(h) rechaza tipo con valor inválido', () => {
    const result = agendaCreateSchema.safeParse({ ...VALID, tipo: 'EMAIL' as never });
    expect(result.success).toBe(false);
    expect(paths(result)).toContain('tipo');
  });

  it('(i) acepta los dos tipos con su campo requerido (REUNION→ubicación, LLAMADA→link)', () => {
    expect(
      agendaCreateSchema.safeParse({
        ...VALID,
        tipo: 'REUNION',
        ubicacion: 'Sala 1',
        linkVideollamada: null,
      }).success,
      'REUNION con ubicación',
    ).toBe(true);
    expect(
      agendaCreateSchema.safeParse({
        ...VALID,
        tipo: 'LLAMADA',
        ubicacion: null,
        linkVideollamada: 'https://meet.example.com/x',
      }).success,
      'LLAMADA con link',
    ).toBe(true);
  });

  it('(n) rechaza REUNION sin ubicación — error en path ubicacion', () => {
    const result = agendaCreateSchema.safeParse({
      ...VALID,
      tipo: 'REUNION',
      ubicacion: null,
      linkVideollamada: null,
    });
    expect(result.success).toBe(false);
    expect(paths(result)).toContain('ubicacion');
  });

  it('(o) rechaza LLAMADA sin link de videollamada — error en path linkVideollamada', () => {
    const result = agendaCreateSchema.safeParse({
      ...VALID,
      tipo: 'LLAMADA',
      ubicacion: null,
      linkVideollamada: null,
    });
    expect(result.success).toBe(false);
    expect(paths(result)).toContain('linkVideollamada');
  });

  it('(p) acepta LLAMADA con link y sin ubicación', () => {
    const result = agendaCreateSchema.safeParse({
      ...VALID,
      tipo: 'LLAMADA',
      ubicacion: null,
      linkVideollamada: 'https://meet.example.com/demo',
    });
    expect(result.success).toBe(true);
  });

  it('(j) rechaza recordatorio habilitado sin minutosAntes — error en path minutosAntes', () => {
    const result = agendaCreateSchema.safeParse({
      ...VALID,
      recordatorioHabilitado: true,
      minutosAntes: null,
    });
    expect(result.success).toBe(false);
    expect(paths(result)).toContain('minutosAntes');
  });

  it('(k) acepta recordatorio habilitado con minutosAntes válido', () => {
    const result = agendaCreateSchema.safeParse({
      ...VALID,
      recordatorioHabilitado: true,
      minutosAntes: 15,
    });
    expect(result.success).toBe(true);
  });

  it('(l) rechaza minutosAntes menor a 1 cuando hay recordatorio', () => {
    const result = agendaCreateSchema.safeParse({
      ...VALID,
      recordatorioHabilitado: true,
      minutosAntes: 0,
    });
    expect(result.success).toBe(false);
    expect(paths(result)).toContain('minutosAntes');
  });

  it('(m) acepta recordatorio deshabilitado sin minutosAntes', () => {
    expect(
      agendaCreateSchema.safeParse({ ...VALID, recordatorioHabilitado: false, minutosAntes: null })
        .success,
    ).toBe(true);
  });
});
