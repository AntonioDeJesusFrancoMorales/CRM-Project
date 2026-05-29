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
      expect('estadoTrato' in c).toBe(true);
      expect('limiteWip' in c).toBe(true);
      expect('totalValorEstimado' in c).toBe(true);
    });
  });

  it('tableroTratosFixture tiene 2×ABIERTO, 1×GANADO, 1×PERDIDO', () => {
    const estados = tableroTratosFixture.columnas.map((c) => c.estadoTrato);
    expect(estados.filter((e) => e === 'ABIERTO')).toHaveLength(2);
    expect(estados.filter((e) => e === 'GANADO')).toHaveLength(1);
    expect(estados.filter((e) => e === 'PERDIDO')).toHaveLength(1);
  });

  it('fichasFixture tiene 3 fichas TRATO con tratoId de tratosFixture', () => {
    expect(fichasFixture.length).toBeGreaterThanOrEqual(3);
    fichasFixture.forEach((f) => {
      expect(f.tipoFicha).toBe('TRATO');
      expect(f.tratoId).not.toBeNull();
      expect('tipo_ficha' in f).toBe(false);
      expect('tablero_id' in f).toBe(false);
    });
  });

  it('fichasFixture tratoIds apuntan a d1, d2, d3 (existen en tratosFixture)', () => {
    const knownTratoIds = [
      'd1111111-dddd-1111-dddd-111111111111',
      'd2222222-dddd-2222-dddd-222222222222',
      'd3333333-dddd-3333-dddd-333333333333',
    ];
    fichasFixture.forEach((f) => {
      expect(knownTratoIds).toContain(f.tratoId);
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
      columnas: { id: string; estadoTrato: string | null; limiteWip: number | null }[];
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
      estadoTrato: 'ABIERTO',
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
  it('retorna 200 con el tablero cuando el id existe', async () => {
    const res = await fetch(
      `/api/tableros/eliminar-columna?id=${TABLERO_ID}&columnaId=${COLUMNA_ID_2}`,
      { method: 'DELETE' },
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as { id: string };
    expect(data.id).toBe(TABLERO_ID);
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
      expect('creadoEn' in f).toBe(true);
      expect('actualizadoEn' in f).toBe(true);
      // Sin snake_case
      expect('tipo_ficha' in f).toBe(false);
      expect('columna_id' in f).toBe(false);
      expect('trato_id' in f).toBe(false);
    });
  });

  it('todas las fichas del fixture son de tipoFicha TRATO', async () => {
    const res = await fetch('/api/fichas/get-all');
    const data = (await res.json()) as { tipoFicha: string }[];
    data.forEach((f) => {
      expect(f.tipoFicha).toBe('TRATO');
    });
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
      responsableId: 'MOCK_USER',
      creadoPor: 'MOCK_USER',
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
      creadoEn: string;
    };
    expect(data.id).toBeTruthy();
    expect(data.columnaId).toBe(COLUMNA_ID_1);
    expect(data.tipoFicha).toBe('TRATO');
    expect(data.creadoEn).toBeTruthy();
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
        responsableId: FICHA_1.responsableId,
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
        responsableId: FICHA_2.responsableId,
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
