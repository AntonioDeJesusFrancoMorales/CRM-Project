import { http, HttpResponse } from 'msw';
import { makeCrudHandlers, nowIso } from '@/mocks/utils/crud';
import { withDelay } from '@/mocks/utils/withDelay';
import { errors } from '@/mocks/utils/error';
import { prospectosFixture } from '@/mocks/fixtures/prospectos';
import { clientesFixture } from '@/mocks/fixtures/clientes';
import { tratosFixture } from '@/mocks/fixtures/tratos';
import type { Prospecto, Cliente } from '@/api/types';

const API = '/api';

export const prospectosHandlers = [
  http.get(`${API}/prospectos`, async ({ request }) => {
    await withDelay();
    const url = new URL(request.url);
    const estado = url.searchParams.get('estado_posible_cliente');
    const empresaId = url.searchParams.get('empresa_id');
    const responsableId = url.searchParams.get('responsable_id');
    let result = prospectosFixture;
    if (estado) result = result.filter((p) => p.estado_posible_cliente === estado);
    if (empresaId) result = result.filter((p) => p.empresa_id === empresaId);
    if (responsableId) result = result.filter((p) => p.responsable_id === responsableId);
    return HttpResponse.json(result);
  }),
  ...makeCrudHandlers<Prospecto>(
    `${API}/prospectos`,
    prospectosFixture,
    (body, id) => ({
      id,
      empresa_id: String(body['empresa_id'] ?? ''),
      responsable_id: String(body['responsable_id'] ?? ''),
      creado_por: String(body['creado_por'] ?? body['responsable_id'] ?? ''),
      nombre_contacto: String(body['nombre_contacto'] ?? ''),
      correo_contacto: (body['correo_contacto'] as string | null) ?? null,
      telefono_contacto: (body['telefono_contacto'] as string | null) ?? null,
      cargo_contacto: (body['cargo_contacto'] as string | null) ?? null,
      como_nos_conocio: (body['como_nos_conocio'] as Prospecto['como_nos_conocio']) ?? null,
      estado_posible_cliente:
        (body['estado_posible_cliente'] as Prospecto['estado_posible_cliente']) ?? 'frio',
      notas: (body['notas'] as string | null) ?? null,
      creado_en: nowIso(),
      actualizado_en: nowIso(),
    }),
    (item, body) => ({ ...item, ...body, actualizado_en: nowIso() }) as Prospecto,
  ).slice(1), // omite el GET de lista que ya tiene filtros arriba
  http.post(`${API}/prospectos/:id/convertir`, async ({ params }) => {
    await withDelay();
    const prospecto = prospectosFixture.find((p) => p.id === params['id']);
    if (!prospecto) return errors.notFound();
    // Mutar el prospecto in-place: ADR-025
    prospecto.estado_posible_cliente = 'convertido';
    prospecto.actualizado_en = nowIso();
    // Crear cliente con FK de trazabilidad: ADR-024
    const cliente: Cliente = {
      id: crypto.randomUUID(),
      empresa_id: prospecto.empresa_id,
      responsable_id: prospecto.responsable_id,
      creado_por: prospecto.creado_por,
      nombre_contacto: prospecto.nombre_contacto,
      correo_contacto: prospecto.correo_contacto,
      telefono_contacto: prospecto.telefono_contacto,
      cargo_contacto: prospecto.cargo_contacto,
      como_nos_conocio: prospecto.como_nos_conocio,
      notas: prospecto.notas,
      prospecto_origen_id: prospecto.id,
      creado_en: nowIso(),
      actualizado_en: nowIso(),
    };
    clientesFixture.push(cliente);
    return HttpResponse.json(cliente, { status: 201 });
  }),
  http.get(`${API}/prospectos/:id/tratos`, async ({ params }) => {
    await withDelay();
    return HttpResponse.json(tratosFixture.filter((t) => t.prospecto_id === params['id']));
  }),
];
