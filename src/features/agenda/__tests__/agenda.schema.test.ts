// Tests del schema Zod para Agenda — contrato del back (Create/EditAgendaRequest + Agenda.create).
// tipo: LLAMADA | REUNION. asunto/fecha/horaInicio requeridos.
// horaFin debe ser posterior a horaInicio. minutosAntes requerido (≥1) si recordatorioHabilitado.

import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import {
  agendaCreateSchema,
  agendaEditSchema,
  type AgendaCreateInput,
} from '../schemas/agenda.schema';

// Base válida: REUNION requiere ubicación (regla condicional del front).
const VALID: AgendaCreateInput = {
  tipo: 'REUNION',
  asunto: 'Reunión de prueba',
  descripcion: null,
  fecha: '2026-10-15',
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

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-01T15:00:00.000Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('agendaCreateSchema', () => {
  it('(a) acepta un input válido completo', () => {
    expect(agendaCreateSchema.safeParse(VALID).success).toBe(true);
  });

  it('(b) rechaza asunto vacío — error en path asunto', () => {
    const result = agendaCreateSchema.safeParse({ ...VALID, asunto: '' });
    expect(result.success).toBe(false);
    expect(paths(result)).toContain('asunto');
  });

  it('rejects whitespace-only subjects and trims create/edit output', () => {
    for (const schema of [agendaCreateSchema, agendaEditSchema]) {
      const empty = schema.safeParse({ ...VALID, asunto: ' \t\n ' });
      expect(empty.success).toBe(false);

      const trimmed = schema.safeParse({ ...VALID, asunto: '  Reunión con cliente  ' });
      expect(trimmed.success).toBe(true);
      if (trimmed.success) expect(trimmed.data.asunto).toBe('Reunión con cliente');
    }
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

  it('accepts absolute HTTP(S) call links and trims them for create/edit', () => {
    for (const schema of [agendaCreateSchema, agendaEditSchema]) {
      for (const link of ['https://meet.google.com/demo', 'https://zoom.us/j/123', 'http://example.com/events/1']) {
        expect(
          schema.safeParse({
            ...VALID,
            tipo: 'LLAMADA',
            ubicacion: null,
            linkVideollamada: link,
          }).success,
        ).toBe(true);
      }

      const trimmed = schema.safeParse({
        ...VALID,
        tipo: 'LLAMADA',
        ubicacion: null,
        linkVideollamada: '  https://meet.google.com/demo  ',
      });
      expect(trimmed.success).toBe(true);
      if (trimmed.success) expect(trimmed.data.linkVideollamada).toBe('https://meet.google.com/demo');
    }
  });

  it('rejects non-clickable or non-HTTP(S) call links', () => {
    for (const link of ['plain text', 'www.example.com/meeting', 'javascript:alert(1)', 'ftp://example.com/file']) {
      const result = agendaCreateSchema.safeParse({
        ...VALID,
        tipo: 'LLAMADA',
        ubicacion: null,
        linkVideollamada: link,
      });

      expect(result.success).toBe(false);
      expect(paths(result)).toContain('linkVideollamada');
    }
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

  it('rejects dates before the Mexico City day without a misleading past-time error', () => {
    vi.setSystemTime(new Date('2026-10-16T06:00:00.000Z'));
    const result = agendaCreateSchema.safeParse({
      ...VALID,
      fecha: '2026-10-15',
      horaInicio: '09:00',
    });

    expect(result.success).toBe(false);
    expect(paths(result)).toContain('fecha');
    expect(paths(result)).not.toContain('horaInicio');
  });

  it('uses the Mexico City minute and accepts an event at the exact boundary in create and edit', () => {
    vi.setSystemTime(new Date('2026-10-15T15:30:00.000Z'));
    const beforeMinute = { ...VALID, fecha: '2026-10-15', horaInicio: '09:29' };
    const exactMinute = { ...VALID, fecha: '2026-10-15', horaInicio: '09:30' };

    for (const schema of [agendaCreateSchema, agendaEditSchema]) {
      const rejected = schema.safeParse(beforeMinute);
      expect(rejected.success).toBe(false);
      if (!rejected.success) {
        expect(rejected.error.issues).toContainEqual(
          expect.objectContaining({ path: ['horaInicio'], message: 'La hora de inicio no puede estar en el pasado' }),
        );
      }

      expect(schema.safeParse(exactMinute).success).toBe(true);
    }
  });

  it('uses the Mexico City calendar day at midnight rollover', () => {
    const event = { ...VALID, fecha: '2026-10-15', horaInicio: '23:59', horaFin: null };

    vi.setSystemTime(new Date('2026-10-16T05:59:00.000Z'));
    expect(agendaCreateSchema.safeParse(event).success).toBe(true);

    vi.setSystemTime(new Date('2026-10-16T06:00:00.000Z'));
    const result = agendaEditSchema.safeParse(event);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({ path: ['fecha'], message: 'La fecha no puede ser anterior a hoy' }),
      );
      expect(result.error.issues.some((issue) => issue.message === 'La hora de inicio no puede estar en el pasado')).toBe(false);
    }
  });

  it('does not report a past-time error when date or start time is missing or malformed', () => {
    vi.setSystemTime(new Date('2026-10-15T15:30:00.000Z'));

    const cases = [
      { fecha: '', horaInicio: '09:00' },
      { fecha: 'not-a-date', horaInicio: '09:00' },
      { fecha: '2026-10-15', horaInicio: 'not-a-time' },
    ];

    for (const values of cases) {
      const result = agendaCreateSchema.safeParse({ ...VALID, ...values });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.message === 'La hora de inicio no puede estar en el pasado')).toBe(false);
      }
    }
  });
});
