import { http, HttpResponse } from 'msw';
import { withDelay } from '@/mocks/utils/withDelay';
import { errors } from '@/mocks/utils/error';
import { nowIso } from '@/mocks/utils/crud';
import { etiquetasFixture } from '@/mocks/fixtures/etiquetas';
import { fichasFixture } from '@/mocks/fixtures/tableros';
import type { Etiqueta, TipoEtiqueta } from '@/api/types';

const API = '/api';
const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

// Handlers RPC del back para etiquetas — espejo del EtiquetaController.
// Catálogo GLOBAL tipado. id siempre como query param. Store mutable (etiquetasFixture).
export const etiquetasHandlers = [
  // GET /api/etiquetas/get-all?tipoEtiqueta= — filtro opcional por tipo
  http.get(`${API}/etiquetas/get-all`, async ({ request }) => {
    await withDelay();
    const tipo = new URL(request.url).searchParams.get('tipoEtiqueta');
    const lista = tipo
      ? etiquetasFixture.filter((e) => e.tipoEtiqueta === tipo)
      : etiquetasFixture;
    return HttpResponse.json(lista);
  }),

  // GET /api/etiquetas/get-by-id?id=
  http.get(`${API}/etiquetas/get-by-id`, async ({ request }) => {
    await withDelay();
    const id = new URL(request.url).searchParams.get('id');
    const e = etiquetasFixture.find((x) => x.id === id);
    return e ? HttpResponse.json(e) : errors.notFound();
  }),

  // POST /api/etiquetas/create — body: nombre, tipoEtiqueta, color (hex #RRGGBB).
  // Valida nombre 1-50, color hex, y unicidad (nombre, tipoEtiqueta).
  http.post(`${API}/etiquetas/create`, async ({ request }) => {
    await withDelay();
    const body = (await request.json()) as Record<string, unknown>;
    const nombre = String(body['nombre'] ?? '').trim();
    const tipoEtiqueta = body['tipoEtiqueta'] as TipoEtiqueta;
    const color = String(body['color'] ?? '');

    if (!nombre || nombre.length > 50) {
      return errors.validation([{ field: 'nombre', message: 'El nombre es requerido (1-50)' }]);
    }
    if (tipoEtiqueta !== 'TAREA' && tipoEtiqueta !== 'TRATO') {
      return errors.validation([{ field: 'tipoEtiqueta', message: 'tipoEtiqueta es requerido' }]);
    }
    if (!HEX_COLOR.test(color)) {
      return errors.validation([{ field: 'color', message: 'color debe ser hex #RRGGBB' }]);
    }
    const duplicada = etiquetasFixture.some(
      (e) => e.tipoEtiqueta === tipoEtiqueta && e.nombre.toLowerCase() === nombre.toLowerCase(),
    );
    if (duplicada) {
      return errors.conflict('Ya existe una etiqueta con ese nombre para este tipo');
    }

    const nueva: Etiqueta = {
      id: crypto.randomUUID(),
      nombre,
      tipoEtiqueta,
      color: color.toUpperCase(),
      creadoEn: nowIso(),
    };
    etiquetasFixture.push(nueva);
    return HttpResponse.json(nueva, { status: 201 });
  }),

  // PUT /api/etiquetas/edit?id= — solo nombre y color (tipo INMUTABLE).
  http.put(`${API}/etiquetas/edit`, async ({ request }) => {
    await withDelay();
    const id = new URL(request.url).searchParams.get('id');
    const idx = etiquetasFixture.findIndex((e) => e.id === id);
    if (idx === -1) return errors.notFound();

    const body = (await request.json()) as Record<string, unknown>;
    const current = etiquetasFixture[idx]!;
    const nombre = body['nombre'] !== undefined ? String(body['nombre']).trim() : current.nombre;
    const color = body['color'] !== undefined ? String(body['color']) : current.color;

    if (!nombre || nombre.length > 50) {
      return errors.validation([{ field: 'nombre', message: 'El nombre es requerido (1-50)' }]);
    }
    if (!HEX_COLOR.test(color)) {
      return errors.validation([{ field: 'color', message: 'color debe ser hex #RRGGBB' }]);
    }
    const duplicada = etiquetasFixture.some(
      (e) =>
        e.id !== id &&
        e.tipoEtiqueta === current.tipoEtiqueta &&
        e.nombre.toLowerCase() === nombre.toLowerCase(),
    );
    if (duplicada) {
      return errors.conflict('Ya existe una etiqueta con ese nombre para este tipo');
    }

    etiquetasFixture[idx] = { ...current, nombre, color: color.toUpperCase() };
    return HttpResponse.json(etiquetasFixture[idx]);
  }),

  // DELETE /api/etiquetas/delete?id=&confirm= — si está EN USO y confirm!=true → 409.
  http.delete(`${API}/etiquetas/delete`, async ({ request }) => {
    await withDelay();
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const confirm = url.searchParams.get('confirm') === 'true';
    const idx = etiquetasFixture.findIndex((e) => e.id === id);
    if (idx === -1) return errors.notFound();

    const enUso = fichasFixture.some((f) => (f.etiquetas ?? []).some((ref) => ref.id === id));
    if (enUso && !confirm) {
      return errors.conflict('La etiqueta está en uso. Confirmá para eliminarla de todas las fichas.');
    }

    // Al confirmar, también se desasocia de las fichas (espejo del back).
    if (enUso) {
      for (const f of fichasFixture) {
        f.etiquetas = (f.etiquetas ?? []).filter((ref) => ref.id !== id);
      }
    }
    etiquetasFixture.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
