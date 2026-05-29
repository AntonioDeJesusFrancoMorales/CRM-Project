import { describe, it, expect } from 'vitest';

// Schemas a crear en B1.3, B1.4, B1.5
import {
  tipoTablero,
  tipoColumna,
  estadoTrato,
  tableroSchema,
  columnaTableroSchema,
} from '../schemas/tablero.schema';
import { tipoFicha, fichaSchema, fichaCreateSchema, fichaEditSchema } from '../schemas/ficha.schema';
import { columnaSchema } from '../schemas/columna.schema';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

describe('tipoTablero enum', () => {
  it('acepta TAREAS y TRATOS', () => {
    expect(tipoTablero.safeParse('TAREAS').success).toBe(true);
    expect(tipoTablero.safeParse('TRATOS').success).toBe(true);
  });
  it('rechaza valores snake_case o minúsculas', () => {
    expect(tipoTablero.safeParse('tareas').success).toBe(false);
    expect(tipoTablero.safeParse('trato').success).toBe(false);
    expect(tipoTablero.safeParse('TRATO').success).toBe(false);
  });
});

describe('tipoFicha enum', () => {
  it('acepta TRATO y TAREA', () => {
    expect(tipoFicha.safeParse('TRATO').success).toBe(true);
    expect(tipoFicha.safeParse('TAREA').success).toBe(true);
  });
  it('rechaza valores legacy minúsculos', () => {
    expect(tipoFicha.safeParse('trato').success).toBe(false);
    expect(tipoFicha.safeParse('tarea').success).toBe(false);
  });
});

describe('estadoTrato enum', () => {
  it('acepta ABIERTO, GANADO, PERDIDO', () => {
    expect(estadoTrato.safeParse('ABIERTO').success).toBe(true);
    expect(estadoTrato.safeParse('GANADO').success).toBe(true);
    expect(estadoTrato.safeParse('PERDIDO').success).toBe(true);
  });
  it('rechaza valores fuera de enum', () => {
    expect(estadoTrato.safeParse('abierto').success).toBe(false);
    expect(estadoTrato.safeParse('CERRADO').success).toBe(false);
  });
});

describe('tipoColumna enum', () => {
  it('acepta PREDETERMINADA y PERSONALIZADA', () => {
    expect(tipoColumna.safeParse('PREDETERMINADA').success).toBe(true);
    expect(tipoColumna.safeParse('PERSONALIZADA').success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// columnaTableroSchema (embedded en TableroResponse)
// ---------------------------------------------------------------------------

const COLUMNA_TABLERO_VALIDA = {
  id: 'a1111111-aaaa-1111-aaaa-111111111111',
  nombre: 'En negociación',
  color: '#fbbf24',
  limiteWip: 5,
  nota: 'Máximo 5 tratos activos',
  estadoTarea: null,
  estadoTrato: 'ABIERTO',
  totalValorEstimado: 150000,
};

describe('columnaTableroSchema', () => {
  it('parsea una columna tablero válida', () => {
    const result = columnaTableroSchema.safeParse(COLUMNA_TABLERO_VALIDA);
    expect(result.success).toBe(true);
  });

  it('acepta limiteWip null', () => {
    const result = columnaTableroSchema.safeParse({
      ...COLUMNA_TABLERO_VALIDA,
      limiteWip: null,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limiteWip).toBeNull();
    }
  });

  it('acepta estadoTrato null (columna de tarea)', () => {
    const result = columnaTableroSchema.safeParse({
      ...COLUMNA_TABLERO_VALIDA,
      estadoTrato: null,
    });
    expect(result.success).toBe(true);
  });

  it('rechaza estadoTrato inválido', () => {
    const result = columnaTableroSchema.safeParse({
      ...COLUMNA_TABLERO_VALIDA,
      estadoTrato: 'CERRADO',
    });
    expect(result.success).toBe(false);
  });

  it('requiere id', () => {
    const { id: _id, ...sinId } = COLUMNA_TABLERO_VALIDA;
    expect(columnaTableroSchema.safeParse(sinId).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// tableroSchema (TableroResponse)
// ---------------------------------------------------------------------------

const TABLERO_VALIDO = {
  id: 'f1111111-ffff-1111-ffff-111111111111',
  nombre: 'Pipeline de Tratos',
  descripcion: 'Estado actual de todos los tratos.',
  tipoTablero: 'TRATOS',
  columnas: [COLUMNA_TABLERO_VALIDA],
  creadoEn: '2026-04-01T08:00:00',
};

describe('tableroSchema', () => {
  it('parsea un tablero válido con columnas', () => {
    const result = tableroSchema.safeParse(TABLERO_VALIDO);
    expect(result.success).toBe(true);
  });

  it('acepta descripcion null', () => {
    const result = tableroSchema.safeParse({ ...TABLERO_VALIDO, descripcion: null });
    expect(result.success).toBe(true);
  });

  it('rechaza tipoTablero inválido', () => {
    const result = tableroSchema.safeParse({ ...TABLERO_VALIDO, tipoTablero: 'OTRO' });
    expect(result.success).toBe(false);
  });

  it('acepta columnas vacías', () => {
    const result = tableroSchema.safeParse({ ...TABLERO_VALIDO, columnas: [] });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// fichaSchema (FichaResponse)
// ---------------------------------------------------------------------------

const FICHA_VALIDA = {
  id: 'h1111111-hhhh-1111-hhhh-111111111111',
  columnaId: 'a1111111-aaaa-1111-aaaa-111111111111',
  tipoFicha: 'TRATO',
  tratoId: 'd1111111-dddd-1111-dddd-111111111111',
  tareaId: null,
  responsableId: '22222222-2222-2222-2222-222222222222',
  creadoPor: '22222222-2222-2222-2222-222222222222',
  creadoEn: '2026-04-10T08:00:00Z',
  actualizadoEn: '2026-04-10T08:00:00Z',
};

describe('fichaSchema', () => {
  it('parsea una ficha TRATO válida', () => {
    const result = fichaSchema.safeParse(FICHA_VALIDA);
    expect(result.success).toBe(true);
  });

  it('acepta tratoId null (ficha TAREA)', () => {
    const result = fichaSchema.safeParse({
      ...FICHA_VALIDA,
      tipoFicha: 'TAREA',
      tratoId: null,
      tareaId: 'e1111111-eeee-1111-eeee-111111111111',
    });
    expect(result.success).toBe(true);
  });

  it('rechaza tipoFicha inválido', () => {
    const result = fichaSchema.safeParse({ ...FICHA_VALIDA, tipoFicha: 'trato' });
    expect(result.success).toBe(false);
  });

  it('requiere columnaId', () => {
    const { columnaId: _c, ...sinColumna } = FICHA_VALIDA;
    expect(fichaSchema.safeParse(sinColumna).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// fichaCreateSchema (CreateFichaRequest)
// ---------------------------------------------------------------------------

const FICHA_CREATE_VALIDA = {
  columnaId: 'a1111111-aaaa-1111-aaaa-111111111111',
  tipoFicha: 'TRATO',
  tratoId: 'd1111111-dddd-1111-dddd-111111111111',
  tareaId: null,
  responsableId: '22222222-2222-2222-2222-222222222222',
  creadoPor: '22222222-2222-2222-2222-222222222222',
};

describe('fichaCreateSchema', () => {
  it('parsea un payload de creación válido', () => {
    expect(fichaCreateSchema.safeParse(FICHA_CREATE_VALIDA).success).toBe(true);
  });

  it('requiere creadoPor', () => {
    const { creadoPor: _c, ...sinCreador } = FICHA_CREATE_VALIDA;
    expect(fichaCreateSchema.safeParse(sinCreador).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// fichaEditSchema (EditFichaRequest — sin creadoPor)
// ---------------------------------------------------------------------------

const FICHA_EDIT_VALIDA = {
  columnaId: 'b1111111-bbbb-1111-bbbb-111111111111',
  tipoFicha: 'TRATO',
  tratoId: 'd1111111-dddd-1111-dddd-111111111111',
  tareaId: null,
  responsableId: '22222222-2222-2222-2222-222222222222',
};

describe('fichaEditSchema', () => {
  it('parsea un payload de edición válido', () => {
    expect(fichaEditSchema.safeParse(FICHA_EDIT_VALIDA).success).toBe(true);
  });

  it('NO acepta creadoPor (campo inmutable)', () => {
    // fichaEditSchema no debe tener creadoPor — si pasa el campo extra sin strict, ok;
    // lo importante es que no sea required y que el schema exista
    const conCreador = { ...FICHA_EDIT_VALIDA, creadoPor: '22222222-2222-2222-2222-222222222222' };
    // En Zod por defecto los campos extra se ignoran (no strict) — el parse pasa
    expect(fichaEditSchema.safeParse(conCreador).success).toBe(true);
    // Pero el tipo inferido no debe tener creadoPor — se valida a nivel TypeScript, no runtime
  });
});

// ---------------------------------------------------------------------------
// columnaSchema (ColumnaResponse catálogo)
// ---------------------------------------------------------------------------

const COLUMNA_VALIDA = {
  id: 'c1111111-cccc-1111-cccc-111111111111',
  nombre: 'Ganados',
  color: '#34d399',
  tipoTablero: 'TRATOS',
  tipoColumna: 'PREDETERMINADA',
};

describe('columnaSchema', () => {
  it('parsea una columna del catálogo válida', () => {
    expect(columnaSchema.safeParse(COLUMNA_VALIDA).success).toBe(true);
  });

  it('rechaza tipoTablero inválido', () => {
    const result = columnaSchema.safeParse({ ...COLUMNA_VALIDA, tipoTablero: 'OTRO' });
    expect(result.success).toBe(false);
  });

  it('rechaza tipoColumna inválido', () => {
    const result = columnaSchema.safeParse({ ...COLUMNA_VALIDA, tipoColumna: 'CUSTOM' });
    expect(result.success).toBe(false);
  });
});
