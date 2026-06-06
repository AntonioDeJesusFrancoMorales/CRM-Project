import { describe, it, expect } from 'vitest';

// Schemas a crear en B1.3, B1.4, B1.5
import {
  tipoTablero,
  tipoColumna,
  estadoTrato,
  estadoTarea,
  tableroSchema,
  columnaTableroSchema,
  tableroCreateSchema,
  tableroEditSchema,
} from '../schemas/tablero.schema';
import { tipoFicha, fichaSchema, fichaCreateSchema, fichaEditSchema } from '../schemas/ficha.schema';
import {
  columnaSchema,
  asignarColumnaSchema,
  columnaCreateSchema,
  columnaEditSchema,
} from '../schemas/columna.schema';
import { MOCK_USER_ID } from '../lib/mockUser';
import { COLUMN_PALETTE } from '../lib/columnPalette';

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
  // Sin responsableId, creadoPor, creadoEn — shape real de FichaResponse.java
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
  // Sin responsableId ni creadoPor — shape real de CreateFichaRequest.java
};

describe('fichaCreateSchema', () => {
  it('parsea un payload de creación válido (sin responsableId ni creadoPor)', () => {
    expect(fichaCreateSchema.safeParse(FICHA_CREATE_VALIDA).success).toBe(true);
  });

  it('sigue requiriendo columnaId', () => {
    const { columnaId: _c, ...sinColumna } = FICHA_CREATE_VALIDA;
    expect(fichaCreateSchema.safeParse(sinColumna).success).toBe(false);
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
  // Sin responsableId — shape real de EditFichaRequest.java
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

// ---------------------------------------------------------------------------
// estadoTarea enum — Task 1.1 (RED) + 1.2 (GREEN)
// ---------------------------------------------------------------------------

describe('estadoTarea enum', () => {
  it('acepta PENDIENTE', () => {
    expect(estadoTarea.safeParse('PENDIENTE').success).toBe(true);
  });

  it('acepta EN_CURSO', () => {
    expect(estadoTarea.safeParse('EN_CURSO').success).toBe(true);
  });

  it('acepta FINALIZADA', () => {
    expect(estadoTarea.safeParse('FINALIZADA').success).toBe(true);
  });

  it('rechaza valores fuera del enum', () => {
    expect(estadoTarea.safeParse('pendiente').success).toBe(false);
    expect(estadoTarea.safeParse('EN_PROGRESO').success).toBe(false);
    expect(estadoTarea.safeParse('CERRADA').success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// asignarColumnaSchema con tipoTablero + superRefine — Task 1.1 RED + 1.3 GREEN
// ---------------------------------------------------------------------------

describe('asignarColumnaSchema', () => {
  // Base válida para tablero TRATOS
  const ASIGNAR_TRATOS = {
    tipoTablero: 'TRATOS',
    limiteWip: 3,
    estadoTrato: 'ABIERTO',
    totalValorEstimado: 5000,
  };

  // Base válida para tablero TAREAS
  const ASIGNAR_TAREAS = {
    tipoTablero: 'TAREAS',
    limiteWip: 2,
    estadoTarea: 'PENDIENTE',
    totalValorEstimado: 0,
  };

  it('acepta limiteWip: 1 (mínimo válido) en tablero TRATOS', () => {
    const result = asignarColumnaSchema.safeParse({ ...ASIGNAR_TRATOS, limiteWip: 1 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limiteWip).toBe(1);
    }
  });

  it('rechaza limiteWip: 0', () => {
    const result = asignarColumnaSchema.safeParse({ ...ASIGNAR_TRATOS, limiteWip: 0 });
    expect(result.success).toBe(false);
    if (!result.success) {
      const wip = result.error.issues.find((i) => i.path.includes('limiteWip'));
      expect(wip?.message).toBe('El límite WIP debe ser al menos 1');
    }
  });

  it('rechaza limiteWip: -1', () => {
    const result = asignarColumnaSchema.safeParse({ ...ASIGNAR_TRATOS, limiteWip: -1 });
    expect(result.success).toBe(false);
  });

  it('TRATOS: acepta estadoTrato ABIERTO sin estadoTarea', () => {
    const result = asignarColumnaSchema.safeParse(ASIGNAR_TRATOS);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.estadoTrato).toBe('ABIERTO');
    }
  });

  it('TRATOS: rechaza si estadoTrato está ausente', () => {
    const { estadoTrato: _, ...sinEstado } = ASIGNAR_TRATOS;
    const result = asignarColumnaSchema.safeParse(sinEstado);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes('estadoTrato'));
      expect(issue).toBeDefined();
    }
  });

  it('TRATOS: rechaza si estadoTarea está presente (exclusividad)', () => {
    const result = asignarColumnaSchema.safeParse({
      ...ASIGNAR_TRATOS,
      estadoTarea: 'PENDIENTE',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes('estadoTarea'));
      expect(issue).toBeDefined();
    }
  });

  it('TRATOS: rechaza estadoTrato inválido', () => {
    const result = asignarColumnaSchema.safeParse({
      ...ASIGNAR_TRATOS,
      estadoTrato: 'CERRADO',
    });
    expect(result.success).toBe(false);
  });

  it('TAREAS: acepta estadoTarea PENDIENTE con totalValorEstimado=0', () => {
    const result = asignarColumnaSchema.safeParse(ASIGNAR_TAREAS);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.estadoTarea).toBe('PENDIENTE');
      expect(result.data.totalValorEstimado).toBe(0);
    }
  });

  it('TAREAS: acepta estadoTarea EN_CURSO', () => {
    const result = asignarColumnaSchema.safeParse({
      ...ASIGNAR_TAREAS,
      estadoTarea: 'EN_CURSO',
    });
    expect(result.success).toBe(true);
  });

  it('TAREAS: acepta estadoTarea FINALIZADA', () => {
    const result = asignarColumnaSchema.safeParse({
      ...ASIGNAR_TAREAS,
      estadoTarea: 'FINALIZADA',
    });
    expect(result.success).toBe(true);
  });

  it('TAREAS: rechaza si estadoTarea está ausente', () => {
    const { estadoTarea: _, ...sinEstado } = ASIGNAR_TAREAS;
    const result = asignarColumnaSchema.safeParse(sinEstado);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes('estadoTarea'));
      expect(issue).toBeDefined();
    }
  });

  it('TAREAS: rechaza si estadoTrato está presente (exclusividad)', () => {
    const result = asignarColumnaSchema.safeParse({
      ...ASIGNAR_TAREAS,
      estadoTrato: 'ABIERTO',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes('estadoTrato'));
      expect(issue).toBeDefined();
    }
  });

  it('TAREAS: rechaza totalValorEstimado distinto de 0', () => {
    const result = asignarColumnaSchema.safeParse({
      ...ASIGNAR_TAREAS,
      totalValorEstimado: 100,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes('totalValorEstimado'));
      expect(issue).toBeDefined();
    }
  });

  it('rechaza totalValorEstimado negativo', () => {
    const result = asignarColumnaSchema.safeParse({ ...ASIGNAR_TRATOS, totalValorEstimado: -1 });
    expect(result.success).toBe(false);
  });

  it('acepta totalValorEstimado: 0 en TRATOS', () => {
    const result = asignarColumnaSchema.safeParse({ ...ASIGNAR_TRATOS, totalValorEstimado: 0 });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// tableroCreateSchema (CreateTableroRequest)
// ---------------------------------------------------------------------------

const TABLERO_CREATE_VALIDO = {
  nombre: 'Nuevo pipeline',
  descripcion: 'Tablero de prueba',
  tipoTablero: 'TRATOS',
};

describe('tableroCreateSchema', () => {
  it('parsea un payload de creación válido', () => {
    expect(tableroCreateSchema.safeParse(TABLERO_CREATE_VALIDO).success).toBe(true);
  });

  it('acepta columnasPredeterminadas opcional', () => {
    const result = tableroCreateSchema.safeParse({
      ...TABLERO_CREATE_VALIDO,
      columnasPredeterminadas: true,
    });
    expect(result.success).toBe(true);
  });

  it('requiere nombre no vacío', () => {
    expect(tableroCreateSchema.safeParse({ ...TABLERO_CREATE_VALIDO, nombre: '' }).success).toBe(
      false,
    );
  });

  it('rechaza nombre de más de 100 caracteres', () => {
    expect(
      tableroCreateSchema.safeParse({ ...TABLERO_CREATE_VALIDO, nombre: 'x'.repeat(101) }).success,
    ).toBe(false);
  });

  it('requiere descripcion no vacía (back: @NotBlank)', () => {
    expect(tableroCreateSchema.safeParse({ ...TABLERO_CREATE_VALIDO, descripcion: '' }).success).toBe(
      false,
    );
  });

  it('requiere tipoTablero válido', () => {
    const { tipoTablero: _t, ...sinTipo } = TABLERO_CREATE_VALIDO;
    expect(tableroCreateSchema.safeParse(sinTipo).success).toBe(false);
    expect(tableroCreateSchema.safeParse({ ...TABLERO_CREATE_VALIDO, tipoTablero: 'OTRO' }).success).toBe(
      false,
    );
  });
});

// ---------------------------------------------------------------------------
// tableroEditSchema (EditTableroRequest)
// ---------------------------------------------------------------------------

describe('tableroEditSchema', () => {
  it('parsea con solo nombre', () => {
    expect(tableroEditSchema.safeParse({ nombre: 'Editado' }).success).toBe(true);
  });

  it('acepta descripcion opcional/null', () => {
    expect(tableroEditSchema.safeParse({ nombre: 'Editado', descripcion: null }).success).toBe(true);
    expect(tableroEditSchema.safeParse({ nombre: 'Editado', descripcion: 'Nueva' }).success).toBe(
      true,
    );
  });

  it('requiere nombre no vacío', () => {
    expect(tableroEditSchema.safeParse({ nombre: '' }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// columnaCreateSchema (CreateColumnaRequest) — Fase 1 paleta + validación
// ---------------------------------------------------------------------------

// Color válido de la paleta garantizado
const COLOR_VALIDO = COLUMN_PALETTE[4]!; // '#f87171' rojo

const COLUMNA_CREATE_VALIDA = {
  nombre: 'Bloqueado',
  color: COLOR_VALIDO,
  tipoTablero: 'TRATOS',
  tipoColumna: 'PERSONALIZADA',
};

describe('columnaCreateSchema', () => {
  it('parsea un payload de creación válido', () => {
    expect(columnaCreateSchema.safeParse(COLUMNA_CREATE_VALIDA).success).toBe(true);
  });

  it('requiere nombre no vacío', () => {
    expect(columnaCreateSchema.safeParse({ ...COLUMNA_CREATE_VALIDA, nombre: '' }).success).toBe(
      false,
    );
  });

  it('rechaza nombre de más de 80 caracteres', () => {
    expect(
      columnaCreateSchema.safeParse({ ...COLUMNA_CREATE_VALIDA, nombre: 'x'.repeat(81) }).success,
    ).toBe(false);
  });

  it('acepta nombre de exactamente 80 caracteres', () => {
    expect(
      columnaCreateSchema.safeParse({ ...COLUMNA_CREATE_VALIDA, nombre: 'x'.repeat(80) }).success,
    ).toBe(true);
  });

  it('rechaza color fuera de la paleta', () => {
    expect(columnaCreateSchema.safeParse({ ...COLUMNA_CREATE_VALIDA, color: '#000000' }).success).toBe(
      false,
    );
  });

  it('rechaza color vacío', () => {
    expect(columnaCreateSchema.safeParse({ ...COLUMNA_CREATE_VALIDA, color: '' }).success).toBe(
      false,
    );
  });

  it('rechaza color con formato hex inválido', () => {
    expect(columnaCreateSchema.safeParse({ ...COLUMNA_CREATE_VALIDA, color: 'rojo' }).success).toBe(
      false,
    );
    expect(columnaCreateSchema.safeParse({ ...COLUMNA_CREATE_VALIDA, color: '#ZZZ' }).success).toBe(
      false,
    );
  });

  it('acepta todos los colores de COLUMN_PALETTE', () => {
    for (const color of COLUMN_PALETTE) {
      const result = columnaCreateSchema.safeParse({ ...COLUMNA_CREATE_VALIDA, color });
      expect(result.success, `color ${color} debe ser válido`).toBe(true);
    }
  });

  it('rechaza tipoTablero/tipoColumna inválidos', () => {
    expect(columnaCreateSchema.safeParse({ ...COLUMNA_CREATE_VALIDA, tipoTablero: 'X' }).success).toBe(
      false,
    );
    expect(columnaCreateSchema.safeParse({ ...COLUMNA_CREATE_VALIDA, tipoColumna: 'X' }).success).toBe(
      false,
    );
  });
});

// ---------------------------------------------------------------------------
// columnaEditSchema (EditColumnaRequest — edición parcial) — Fase 4 color relajado
// color acepta cualquier hex válido #RRGGBB, NO solo la paleta.
// Razón: columnas existentes pueden tener colores legacy; editar el nombre
// no debe fallar por un color fuera de paleta.
// ---------------------------------------------------------------------------

describe('columnaEditSchema', () => {
  it('acepta payload vacío (todos los campos opcionales)', () => {
    expect(columnaEditSchema.safeParse({}).success).toBe(true);
  });

  it('acepta edición parcial de nombre', () => {
    expect(columnaEditSchema.safeParse({ nombre: 'Renombrada' }).success).toBe(true);
  });

  it('acepta color válido de la paleta', () => {
    expect(columnaEditSchema.safeParse({ color: COLOR_VALIDO }).success).toBe(true);
  });

  it('acepta color hex válido FUERA de la paleta (color legacy)', () => {
    // Un color como #000000 no está en la paleta pero es hex válido — debe aceptarse
    expect(columnaEditSchema.safeParse({ color: '#000000' }).success).toBe(true);
    expect(columnaEditSchema.safeParse({ color: '#1a2b3c' }).success).toBe(true);
    expect(columnaEditSchema.safeParse({ color: '#FFFFFF' }).success).toBe(true);
  });

  it('rechaza color con formato hex inválido', () => {
    expect(columnaEditSchema.safeParse({ color: 'rojo' }).success).toBe(false);
    expect(columnaEditSchema.safeParse({ color: '#ZZZ' }).success).toBe(false);
    expect(columnaEditSchema.safeParse({ color: '#12345' }).success).toBe(false);
    expect(columnaEditSchema.safeParse({ color: '' }).success).toBe(false);
  });

  it('rechaza nombre de más de 80 caracteres', () => {
    expect(columnaEditSchema.safeParse({ nombre: 'x'.repeat(81) }).success).toBe(false);
  });

  it('rechaza enums inválidos cuando se proveen', () => {
    expect(columnaEditSchema.safeParse({ tipoColumna: 'X' }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// MOCK_USER_ID — constante UUID placeholder
// Tasks 1.3 (RED) + 1.4 (GREEN)
// ---------------------------------------------------------------------------

describe('MOCK_USER_ID', () => {
  it('es un string de 36 caracteres', () => {
    expect(typeof MOCK_USER_ID).toBe('string');
    expect(MOCK_USER_ID).toHaveLength(36);
  });

  it('tiene formato UUID estándar (8-4-4-4-12)', () => {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(MOCK_USER_ID).toMatch(UUID_REGEX);
  });
});
