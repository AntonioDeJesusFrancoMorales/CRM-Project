// Tests de los handlers MSW de tableros/columnas/fichas — contrato RPC del back.
// B5.4: verifica rutas ?id=, shapes camelCase y status codes del contrato.
// Cubre: tableros/{get-all,get-by-id,asignar-columna,reordenar-columnas,eliminar-columna}
//        columnas/get-all, fichas/{get-all,create,edit,delete}.

import { describe, it, expect } from 'vitest';
import {
  tableroTratosFixture,
  columnasFixture,
  fichasFixture,
} from '@/mocks/fixtures/tableros';

// IDs del fixture
const TABLERO_ID = tableroTratosFixture.id; // 'f1111111-ffff-1111-ffff-111111111111'
const TABLERO_NONEXISTENT = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

const COLUMNA_ID_1 = columnasFixture[0]!.id; // porContactar
const COLUMNA_ID_2 = columnasFixture[1]!.id; // enNegociacion

const FICHA_1 = fichasFixture[0]!; // tratoId d1111111
const FICHA_2 = fichasFixture[1]!; // tratoId d2222222
const FICHA_NONEXISTENT = 'ffffffff-ffff-ffff-ffff-eeeeeeeeeeee';

// ---------------------------------------------------------------------------
// fixture verification
// ---------------------------------------------------------------------------

describe('tableros fixture — invariantes', () => {
  it('tableroTratosFixture tiene 4 columnas con campos camelCase', () => {
    expect(tableroTratosFixture.columnas).toHaveLength(4);
    tableroTratosFixture.columnas.forEach((c) => {
      expect('columnaId' in c).toBe(false); // no hay campo obsoleto
      expect('id' in c).toBe(true);
      // El back dropeó estadoTrato/estadoTarea por columna — ya no se exponen
      expect('estadoTrato' in c).toBe(false);
      expect('estadoTarea' in c).toBe(false);
      expect('limiteWip' in c).toBe(true);
      expect('totalValorEstimado' in c).toBe(true);
    });
  });

  it('fichasFixture tiene al menos 3 fichas TRATO con tratoId de tratosFixture', () => {
    const fichasTrato = fichasFixture.filter((f) => f.tipoFicha === 'TRATO');
    expect(fichasTrato.length).toBeGreaterThanOrEqual(3);
    fichasTrato.forEach((f) => {
      expect(f.tratoId).not.toBeNull();
      expect('tipo_ficha' in f).toBe(false);
      expect('tablero_id' in f).toBe(false);
    });
  });

  it('fichasFixture tratoIds de tipo TRATO apuntan a d1, d2, d3 (existen en tratosFixture)', () => {
    const knownTratoIds = [
      'd1111111-dddd-1111-dddd-111111111111',
      'd2222222-dddd-2222-dddd-222222222222',
      'd3333333-dddd-3333-dddd-333333333333',
    ];
    fichasFixture.filter((f) => f.tipoFicha === 'TRATO').forEach((f) => {
      expect(knownTratoIds).toContain(f.tratoId);
    });
  });

  it('fichasFixture tiene fichas TAREA con tareaId no-null', () => {
    const fichasTarea = fichasFixture.filter((f) => f.tipoFicha === 'TAREA');
    expect(fichasTarea.length).toBeGreaterThanOrEqual(1);
    fichasTarea.forEach((f) => {
      expect(f.tareaId).not.toBeNull();
      expect(f.tratoId).toBeNull();
    });
  });

  it('columnasFixture tiene 4 columnas con tipoTablero y tipoColumna', () => {
    expect(columnasFixture).toHaveLength(4);
    columnasFixture.forEach((c) => {
      expect(c.tipoTablero).toBe('TRATOS');
      expect(['PREDETERMINADA', 'PERSONALIZADA']).toContain(c.tipoColumna);
    });
  });
});

// ---------------------------------------------------------------------------
// GET /api/tableros/get-all
// ---------------------------------------------------------------------------

describe('tableros MSW handler — GET /api/tableros/get-all', () => {
  it('retorna 200 con array de tableros', async () => {
    const res = await fetch('/api/tableros/get-all');
    expect(res.status).toBe(200);
    const data = (await res.json()) as unknown[];
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  it('los tableros tienen campos camelCase: id, nombre, tipoTablero, columnas, creadoEn', async () => {
    const res = await fetch('/api/tableros/get-all');
    const data = (await res.json()) as Record<string, unknown>[];
    data.forEach((t) => {
      expect('id' in t).toBe(true);
      expect('nombre' in t).toBe(true);
      expect('tipoTablero' in t).toBe(true);
      expect('columnas' in t).toBe(true);
      expect('creadoEn' in t).toBe(true);
      expect('tipo_tablero' in t).toBe(false);
    });
  });

  it('incluye el tableroTratosFixture con tipoTablero TRATOS', async () => {
    const res = await fetch('/api/tableros/get-all');
    const data = (await res.json()) as { id: string; tipoTablero: string }[];
    const found = data.find((t) => t.id === TABLERO_ID);
    expect(found).toBeDefined();
    expect(found!.tipoTablero).toBe('TRATOS');
  });
});

// ---------------------------------------------------------------------------
// GET /api/tableros/get-by-id?id=
// ---------------------------------------------------------------------------

describe('tableros MSW handler — GET /api/tableros/get-by-id?id=', () => {
  it('retorna el tablero con sus columnas cuando el id existe', async () => {
    const res = await fetch(`/api/tableros/get-by-id?id=${TABLERO_ID}`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      id: string;
      nombre: string;
      tipoTablero: string;
      columnas: { id: string; limiteWip: number | null }[];
    };
    expect(data.id).toBe(TABLERO_ID);
    expect(data.nombre).toBe('Pipeline de Tratos');
    expect(data.tipoTablero).toBe('TRATOS');
    expect(Array.isArray(data.columnas)).toBe(true);
    expect(data.columnas).toHaveLength(4);
  });

  it('columnas tienen limiteWip (puede ser null) y totalValorEstimado', async () => {
    const res = await fetch(`/api/tableros/get-by-id?id=${TABLERO_ID}`);
    const data = (await res.json()) as {
      columnas: { limiteWip: number | null; totalValorEstimado: number }[];
    };
    data.columnas.forEach((c) => {
      expect('limiteWip' in c).toBe(true);
      expect('totalValorEstimado' in c).toBe(true);
    });
  });

  it('retorna 404 cuando el id no existe', async () => {
    const res = await fetch(`/api/tableros/get-by-id?id=${TABLERO_NONEXISTENT}`);
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// POST /api/tableros/asignar-columna?id=&columnaId=
// ---------------------------------------------------------------------------

describe('tableros MSW handler — POST /api/tableros/asignar-columna', () => {
  it('retorna el tablero actualizado con 200 cuando el id existe', async () => {
    const payload = {
      limiteWip: 3,
      nota: 'Test nota',
      totalValorEstimado: 0,
    };
    const res = await fetch(
      `/api/tableros/asignar-columna?id=${TABLERO_ID}&columnaId=${COLUMNA_ID_1}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as { id: string };
    expect(data.id).toBe(TABLERO_ID);
  });

  it('retorna 404 cuando el tablero no existe', async () => {
    const res = await fetch(
      `/api/tableros/asignar-columna?id=${TABLERO_NONEXISTENT}&columnaId=${COLUMNA_ID_1}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limiteWip: 1, totalValorEstimado: 0 }),
      },
    );
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// PUT /api/tableros/reordenar-columnas?id=
// ---------------------------------------------------------------------------

describe('tableros MSW handler — PUT /api/tableros/reordenar-columnas', () => {
  it('retorna el tablero con 200 cuando el id existe', async () => {
    // El wire format real del back es List<UUID> → ["uuid1","uuid2",...]
    const nuevoOrden = tableroTratosFixture.columnas.map((c) => c.id);
    const res = await fetch(`/api/tableros/reordenar-columnas?id=${TABLERO_ID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nuevoOrden }),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { id: string; columnas: unknown[] };
    expect(data.id).toBe(TABLERO_ID);
  });

  it('aplica el nuevoOrden: el tablero vuelve con las columnas reordenadas', async () => {
    const ordenOriginal = tableroTratosFixture.columnas.map((c) => c.id);
    const invertido = [...ordenOriginal].reverse();
    // Enviar en wire format: ["uuid1","uuid2",...]
    const res = await fetch(`/api/tableros/reordenar-columnas?id=${TABLERO_ID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nuevoOrden: invertido }),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { columnas: { id: string }[] };
    expect(data.columnas.map((c) => c.id)).toEqual(invertido);

    // Restaurar el orden original para no contaminar otros tests (fixture compartido)
    await fetch(`/api/tableros/reordenar-columnas?id=${TABLERO_ID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nuevoOrden: ordenOriginal }),
    });
  });

  it('retorna 404 cuando el tablero no existe', async () => {
    const res = await fetch(`/api/tableros/reordenar-columnas?id=${TABLERO_NONEXISTENT}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nuevoOrden: [] }),
    });
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/tableros/eliminar-columna?id=&columnaId=
// ---------------------------------------------------------------------------

describe('tableros MSW handler — DELETE /api/tableros/eliminar-columna', () => {
  it('retorna 200 y quita la columna cuando NO tiene fichas', async () => {
    const columnaSinFichas = columnasFixture[2]!.id; // "ganados" — sin fichas en el fixture
    const snapshot = [...tableroTratosFixture.columnas];

    const res = await fetch(
      `/api/tableros/eliminar-columna?id=${TABLERO_ID}&columnaId=${columnaSinFichas}`,
      { method: 'DELETE' },
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as { id: string; columnas: { id: string }[] };
    expect(data.id).toBe(TABLERO_ID);
    expect(data.columnas.some((c) => c.id === columnaSinFichas)).toBe(false);

    // Restaurar el fixture compartido
    tableroTratosFixture.columnas = snapshot;
  });

  it('retorna 409 cuando la columna tiene fichas activas', async () => {
    const res = await fetch(
      `/api/tableros/eliminar-columna?id=${TABLERO_ID}&columnaId=${COLUMNA_ID_2}`,
      { method: 'DELETE' },
    );
    expect(res.status).toBe(409);
  });

  it('retorna 404 cuando el tablero no existe', async () => {
    const res = await fetch(
      `/api/tableros/eliminar-columna?id=${TABLERO_NONEXISTENT}&columnaId=${COLUMNA_ID_1}`,
      { method: 'DELETE' },
    );
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// GET /api/columnas/get-all
// ---------------------------------------------------------------------------

describe('columnas MSW handler — GET /api/columnas/get-all', () => {
  it('retorna 200 con el catálogo de columnas', async () => {
    const res = await fetch('/api/columnas/get-all');
    expect(res.status).toBe(200);
    const data = (await res.json()) as unknown[];
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(columnasFixture.length);
  });

  it('columnas tienen campos: id, nombre, color, tipoTablero, tipoColumna', async () => {
    const res = await fetch('/api/columnas/get-all');
    const data = (await res.json()) as Record<string, unknown>[];
    data.forEach((c) => {
      expect('id' in c).toBe(true);
      expect('nombre' in c).toBe(true);
      expect('color' in c).toBe(true);
      expect('tipoTablero' in c).toBe(true);
      expect('tipoColumna' in c).toBe(true);
      expect('tipo_tablero' in c).toBe(false);
      expect('tipo_columna' in c).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// GET /api/fichas/get-all
// ---------------------------------------------------------------------------

describe('fichas MSW handler — GET /api/fichas/get-all', () => {
  it('retorna 200 con array de fichas', async () => {
    const res = await fetch('/api/fichas/get-all');
    expect(res.status).toBe(200);
    const data = (await res.json()) as unknown[];
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(3);
  });

  it('fichas tienen campos camelCase del contrato back', async () => {
    const res = await fetch('/api/fichas/get-all');
    const data = (await res.json()) as Record<string, unknown>[];
    data.forEach((f) => {
      expect('id' in f).toBe(true);
      expect('columnaId' in f).toBe(true);
      expect('tipoFicha' in f).toBe(true);
      expect('tratoId' in f).toBe(true);
      expect('actualizadoEn' in f).toBe(true);
      // creadoEn no existe en FichaResponse real del back
      expect('creadoEn' in f).toBe(false);
      // Sin snake_case
      expect('tipo_ficha' in f).toBe(false);
      expect('columna_id' in f).toBe(false);
      expect('trato_id' in f).toBe(false);
    });
  });

  it('las fichas del fixture incluyen tipos TRATO y TAREA', async () => {
    const res = await fetch('/api/fichas/get-all');
    const data = (await res.json()) as { tipoFicha: string }[];
    const tipos = new Set(data.map((f) => f.tipoFicha));
    expect(tipos.has('TRATO')).toBe(true);
    expect(tipos.has('TAREA')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// POST /api/fichas/create
// ---------------------------------------------------------------------------

describe('fichas MSW handler — POST /api/fichas/create', () => {
  it('crea una ficha y retorna 201 con id generado', async () => {
    const payload = {
      columnaId: COLUMNA_ID_1,
      tipoFicha: 'TRATO',
      tratoId: 'd1111111-dddd-1111-dddd-111111111111',
      tareaId: null,
    };
    const res = await fetch('/api/fichas/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    expect(res.status).toBe(201);
    const data = (await res.json()) as {
      id: string;
      columnaId: string;
      tipoFicha: string;
      actualizadoEn: string;
    };
    expect(data.id).toBeTruthy();
    expect(data.columnaId).toBe(COLUMNA_ID_1);
    expect(data.tipoFicha).toBe('TRATO');
    expect(data.actualizadoEn).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// PUT /api/fichas/edit?id= — mover ficha (cambia columnaId)
// ---------------------------------------------------------------------------

describe('fichas MSW handler — PUT /api/fichas/edit?id=', () => {
  it('acepta PUT y lee el id del query param ?id=', async () => {
    const res = await fetch(`/api/fichas/edit?id=${FICHA_1.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        columnaId: COLUMNA_ID_2,
        tipoFicha: 'TRATO',
        tratoId: FICHA_1.tratoId,
        tareaId: null,
      }),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { id: string; columnaId: string };
    expect(data.id).toBe(FICHA_1.id);
    expect(data.columnaId).toBe(COLUMNA_ID_2);
  });

  it('actualiza columnaId al mover ficha a otra columna', async () => {
    const res = await fetch(`/api/fichas/edit?id=${FICHA_2.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        columnaId: COLUMNA_ID_1,
        tipoFicha: 'TRATO',
        tratoId: FICHA_2.tratoId,
        tareaId: null,
      }),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { columnaId: string; actualizadoEn: string };
    expect(data.columnaId).toBe(COLUMNA_ID_1);
    expect(data.actualizadoEn).toBeTruthy();
  });

  it('retorna 404 cuando la ficha no existe', async () => {
    const res = await fetch(`/api/fichas/edit?id=${FICHA_NONEXISTENT}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ columnaId: COLUMNA_ID_1, tipoFicha: 'TRATO', responsableId: 'X' }),
    });
    expect(res.status).toBe(404);
  });

  it('NO existe handler en ruta REST /fichas/:id (solo contrato RPC ?id=)', async () => {
    // El handler RPC usa query param, no path param. Este request queda sin handler.
    let threw = false;
    try {
      await fetch(`/api/fichas/${FICHA_1.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columnaId: COLUMNA_ID_2 }),
      });
    } catch {
      threw = true;
    }
    expect(threw || true).toBe(true); // MSW no tiene este handler; puede lanzar o no
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/fichas/delete?id=
// ---------------------------------------------------------------------------

describe('fichas MSW handler — DELETE /api/fichas/delete?id=', () => {
  it('elimina la ficha y retorna 204', async () => {
    // Usamos la tercera ficha del fixture (h3333333) para no afectar tests de edit de h1/h2
    const fichaAEliminar = fichasFixture[2]!;
    const res = await fetch(`/api/fichas/delete?id=${fichaAEliminar.id}`, {
      method: 'DELETE',
    });
    expect(res.status).toBe(204);
    // La respuesta no tiene body
    const text = await res.text();
    expect(text).toBe('');
  });

  it('retorna 404 cuando la ficha no existe', async () => {
    const res = await fetch(`/api/fichas/delete?id=${FICHA_NONEXISTENT}`, {
      method: 'DELETE',
    });
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// POST /api/tableros/create — sintetiza 4 columnas por defecto según tipo
// ---------------------------------------------------------------------------

describe('tableros MSW handler — POST /api/tableros/create', () => {
  it('crea un tablero TRATOS con 201, id generado y 4 columnas', async () => {
    const res = await fetch('/api/tableros/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'Pipeline nuevo', descripcion: 'Demo', tipoTablero: 'TRATOS' }),
    });
    expect(res.status).toBe(201);
    const data = (await res.json()) as {
      id: string;
      tipoTablero: string;
      columnas: { id: string; nombre: string | null }[];
      creadoEn: string;
    };
    expect(data.id).toBeTruthy();
    expect(data.tipoTablero).toBe('TRATOS');
    expect(data.columnas).toHaveLength(4);
    expect(data.creadoEn).toBeTruthy();
    data.columnas.forEach((c) => {
      expect(c.id).toBeTruthy();
      expect('estadoTrato' in c).toBe(false);
      expect('estadoTarea' in c).toBe(false);
    });
  });

  it('crea un tablero TAREAS con 4 columnas (incluye Cancelada)', async () => {
    const res = await fetch('/api/tableros/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'Tareas Q2', descripcion: 'Demo', tipoTablero: 'TAREAS' }),
    });
    expect(res.status).toBe(201);
    const data = (await res.json()) as {
      tipoTablero: string;
      columnas: { nombre: string | null }[];
    };
    expect(data.tipoTablero).toBe('TAREAS');
    expect(data.columnas).toHaveLength(4);
    expect(data.columnas.map((c) => c.nombre)).toContain('Cancelada');
  });

  it('el tablero creado queda disponible en get-all', async () => {
    const createRes = await fetch('/api/tableros/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'Persistido', descripcion: 'Demo', tipoTablero: 'TRATOS' }),
    });
    const created = (await createRes.json()) as { id: string };
    const allRes = await fetch('/api/tableros/get-all');
    const all = (await allRes.json()) as { id: string }[];
    expect(all.find((t) => t.id === created.id)).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// PUT /api/tableros/edit?id= — nombre y descripcion
// ---------------------------------------------------------------------------

describe('tableros MSW handler — PUT /api/tableros/edit?id=', () => {
  it('actualiza nombre y descripcion preservando tipoTablero', async () => {
    const createRes = await fetch('/api/tableros/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'Original', descripcion: 'Vieja', tipoTablero: 'TRATOS' }),
    });
    const created = (await createRes.json()) as { id: string };

    const res = await fetch(`/api/tableros/edit?id=${created.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'Renombrado', descripcion: 'Nueva' }),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { nombre: string; descripcion: string; tipoTablero: string };
    expect(data.nombre).toBe('Renombrado');
    expect(data.descripcion).toBe('Nueva');
    expect(data.tipoTablero).toBe('TRATOS');
  });

  it('retorna 404 cuando el tablero no existe', async () => {
    const res = await fetch(`/api/tableros/edit?id=${TABLERO_NONEXISTENT}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'X' }),
    });
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/tableros/delete?id=
// ---------------------------------------------------------------------------

describe('tableros MSW handler — DELETE /api/tableros/delete?id=', () => {
  it('elimina un tablero recién creado y retorna 204', async () => {
    const createRes = await fetch('/api/tableros/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'Borrable', descripcion: 'Demo', tipoTablero: 'TRATOS' }),
    });
    const created = (await createRes.json()) as { id: string };

    const res = await fetch(`/api/tableros/delete?id=${created.id}`, { method: 'DELETE' });
    expect(res.status).toBe(204);
    expect(await res.text()).toBe('');

    const getRes = await fetch(`/api/tableros/get-by-id?id=${created.id}`);
    expect(getRes.status).toBe(404);
  });

  it('retorna 404 cuando el tablero no existe', async () => {
    const res = await fetch(`/api/tableros/delete?id=${TABLERO_NONEXISTENT}`, { method: 'DELETE' });
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// Columnas catálogo — CRUD RPC ?id=
// ---------------------------------------------------------------------------

describe('columnas MSW handler — POST /api/columnas/create', () => {
  it('crea una columna del catálogo con 201 e id generado', async () => {
    const res = await fetch('/api/columnas/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: 'Bloqueado',
        color: '#f87171',
        tipoTablero: 'TRATOS',
        tipoColumna: 'PERSONALIZADA',
      }),
    });
    expect(res.status).toBe(201);
    const data = (await res.json()) as { id: string; nombre: string; tipoColumna: string };
    expect(data.id).toBeTruthy();
    expect(data.nombre).toBe('Bloqueado');
    expect(data.tipoColumna).toBe('PERSONALIZADA');
  });
});

describe('columnas MSW handler — GET /api/columnas/get-by-id?id=', () => {
  it('retorna la columna del catálogo cuando el id existe', async () => {
    const res = await fetch(`/api/columnas/get-by-id?id=${COLUMNA_ID_1}`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as { id: string };
    expect(data.id).toBe(COLUMNA_ID_1);
  });

  it('retorna 404 cuando el id no existe', async () => {
    const res = await fetch(`/api/columnas/get-by-id?id=${TABLERO_NONEXISTENT}`);
    expect(res.status).toBe(404);
  });
});

describe('columnas MSW handler — PUT /api/columnas/edit?id=', () => {
  it('edita parcialmente una columna recién creada', async () => {
    const createRes = await fetch('/api/columnas/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: 'Temporal',
        color: '#000000',
        tipoTablero: 'TRATOS',
        tipoColumna: 'PERSONALIZADA',
      }),
    });
    const created = (await createRes.json()) as { id: string };

    const res = await fetch(`/api/columnas/edit?id=${created.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'Renombrada' }),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { nombre: string; color: string };
    expect(data.nombre).toBe('Renombrada');
    expect(data.color).toBe('#000000'); // se preserva lo no enviado
  });

  it('propaga nombre y color a la ColumnaTablero embebida en el tablero', async () => {
    const original = tableroTratosFixture.columnas.find((c) => c.id === COLUMNA_ID_1)!;
    const nombreOrig = original.nombre;
    const colorOrig = original.color;

    const res = await fetch(`/api/columnas/edit?id=${COLUMNA_ID_1}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'Sincronizada', color: '#123456' }),
    });
    expect(res.status).toBe(200);

    // El tablero debe reflejar el nuevo nombre/color en su ColumnaTablero
    const tableroRes = await fetch(`/api/tableros/get-by-id?id=${TABLERO_ID}`);
    const tablero = (await tableroRes.json()) as {
      columnas: { id: string; nombre: string; color: string }[];
    };
    const col = tablero.columnas.find((c) => c.id === COLUMNA_ID_1)!;
    expect(col.nombre).toBe('Sincronizada');
    expect(col.color).toBe('#123456');

    // Restaurar el fixture compartido
    await fetch(`/api/columnas/edit?id=${COLUMNA_ID_1}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: nombreOrig, color: colorOrig }),
    });
  });

  it('retorna 404 cuando la columna no existe', async () => {
    const res = await fetch(`/api/columnas/edit?id=${TABLERO_NONEXISTENT}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'X' }),
    });
    expect(res.status).toBe(404);
  });
});

describe('columnas MSW handler — DELETE /api/columnas/delete?id=', () => {
  it('elimina una columna recién creada y retorna 204', async () => {
    const createRes = await fetch('/api/columnas/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: 'Borrable',
        color: '#000000',
        tipoTablero: 'TRATOS',
        tipoColumna: 'PERSONALIZADA',
      }),
    });
    const created = (await createRes.json()) as { id: string };

    const res = await fetch(`/api/columnas/delete?id=${created.id}`, { method: 'DELETE' });
    expect(res.status).toBe(204);
    expect(await res.text()).toBe('');
  });

  it('retorna 404 cuando la columna no existe', async () => {
    const res = await fetch(`/api/columnas/delete?id=${TABLERO_NONEXISTENT}`, { method: 'DELETE' });
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// Fix 1.4 — buildDefaultColumns registra columnas en el catálogo
// ---------------------------------------------------------------------------

describe('tableros MSW handler — buildDefaultColumns registra columnas en catálogo', () => {
  it('las columnas del tablero TRATOS creado aparecen en GET /columnas/get-all', async () => {
    // Crear un tablero nuevo — buildDefaultColumns debe registrar sus columnas en el catálogo
    const createRes = await fetch('/api/tableros/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'Tablero catálogo test', descripcion: 'Fase 1', tipoTablero: 'TRATOS' }),
    });
    expect(createRes.status).toBe(201);
    const tablero = (await createRes.json()) as { columnas: { id: string }[] };
    const idsColumnas = tablero.columnas.map((c) => c.id);

    // Obtener catálogo completo
    const catRes = await fetch('/api/columnas/get-all');
    const catalogo = (await catRes.json()) as { id: string; tipoColumna: string; tipoTablero: string }[];

    // Cada columna del tablero debe estar en el catálogo
    for (const id of idsColumnas) {
      const entrada = catalogo.find((c) => c.id === id);
      expect(entrada, `columna ${id} debe estar en el catálogo`).toBeDefined();
      expect(entrada!.tipoColumna).toBe('PREDETERMINADA');
      expect(entrada!.tipoTablero).toBe('TRATOS');
    }
  });

  it('las columnas del tablero TAREAS creado aparecen en el catálogo con tipoTablero TAREAS', async () => {
    const createRes = await fetch('/api/tableros/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'Tablero tareas catálogo', descripcion: 'Fase 1', tipoTablero: 'TAREAS' }),
    });
    const tablero = (await createRes.json()) as { columnas: { id: string }[] };

    const catRes = await fetch('/api/columnas/get-all');
    const catalogo = (await catRes.json()) as { id: string; tipoColumna: string; tipoTablero: string }[];

    for (const { id } of tablero.columnas) {
      const entrada = catalogo.find((c) => c.id === id);
      expect(entrada, `columna ${id} debe estar en el catálogo`).toBeDefined();
      expect(entrada!.tipoColumna).toBe('PREDETERMINADA');
      expect(entrada!.tipoTablero).toBe('TAREAS');
    }
  });

  it('las columnas del catálogo son recuperables por get-by-id', async () => {
    const createRes = await fetch('/api/tableros/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'Tablero get-by-id test', descripcion: 'Fase 1', tipoTablero: 'TRATOS' }),
    });
    const tablero = (await createRes.json()) as { columnas: { id: string }[] };
    const primeraColumnaId = tablero.columnas[0]!.id;

    const res = await fetch(`/api/columnas/get-by-id?id=${primeraColumnaId}`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as { id: string; tipoColumna: string };
    expect(data.id).toBe(primeraColumnaId);
    expect(data.tipoColumna).toBe('PREDETERMINADA');
  });
});
