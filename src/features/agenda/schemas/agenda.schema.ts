// Schema Zod para Agenda — alineado al contrato real del back AR-CRM.
// Fuente de verdad: AgendaResponse.java, CreateAgendaRequest.java, EditAgendaRequest.java,
// model/entity/Agenda.java, enums/TipoAgenda.java, enums/RecordatorioEstado.java.
//
// Agenda es un EVENTO de calendario (LLAMADA | REUNION), NO una tarea: tiene fecha + hora,
// puede vincularse opcionalmente a una tarea o un trato, y configura un recordatorio por
// email que dispara el back (AgendaReminderScheduler). El front SOLO setea
// recordatorioHabilitado + minutosAntes; el estado del recordatorio es READ-ONLY.

import { z } from 'zod';
import { isValidYmd } from '@/lib/date';

// ---------------------------------------------------------------------------
// Enums confirmados contra Java (fuente de verdad)
// TipoAgenda: domain/.../enums/TipoAgenda.java → { LLAMADA, REUNION }
// RecordatorioEstado: domain/.../enums/RecordatorioEstado.java → { PENDIENTE, ENVIADO, FALLIDO }
// ---------------------------------------------------------------------------

export const tipoAgenda = z.enum(['LLAMADA', 'REUNION']);
export type TipoAgenda = z.infer<typeof tipoAgenda>;

export const recordatorioEstado = z.enum(['PENDIENTE', 'ENVIADO', 'FALLIDO']);
export type RecordatorioEstado = z.infer<typeof recordatorioEstado>;

function isValidAgendaDate(value: string): boolean {
  return isValidYmd(value);
}

function isValidAgendaTime(value: string): boolean {
  return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function getMexicoCityCurrentDateTime(): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));

  return {
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}`,
  };
}

function isHttpUrl(value: string): boolean {
  if (!/^https?:\/\//i.test(value)) return false;

  try {
    const url = new URL(value);
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname.length > 0;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// AgendaResponse — shape del back para un evento de agenda.
// fecha: LocalDate ISO (YYYY-MM-DD). horaInicio/horaFin: LocalTime (HH:mm[:ss]).
// Campos de recordatorio (estado/enviadoEn/ultimoIntentoEn) son READ-ONLY: los maneja
// el scheduler del back, el front solo los muestra.
// ---------------------------------------------------------------------------

export const agendaSchema = z.object({
  id: z.string(),
  tipo: tipoAgenda,
  asunto: z.string(),
  descripcion: z.string().nullable(),
  fecha: z.string(),
  horaInicio: z.string(),
  horaFin: z.string().nullable(),
  tareaId: z.string().nullable(),
  tratoId: z.string().nullable(),
  ubicacion: z.string().nullable(),
  linkVideollamada: z.string().nullable(),
  creadoPor: z.string(),
  creadoEn: z.string(),
  actualizadoEn: z.string(),
  recordatorioHabilitado: z.boolean(),
  minutosAntes: z.number().int().nullable(),
  recordatorioEstado: recordatorioEstado.nullable(),
  recordatorioEnviadoEn: z.string().nullable(),
  ultimoIntentoEn: z.string().nullable(),
});

export type Agenda = z.infer<typeof agendaSchema>;

// ---------------------------------------------------------------------------
// Form schema (create/edit) — CreateAgendaRequest.java y EditAgendaRequest.java son
// IDÉNTICOS, así que un mismo shape sirve para ambos. Campos requeridos: tipo, asunto,
// fecha, horaInicio. horaFin debe ser posterior a horaInicio. minutosAntes ≥ 1 y requerido
// cuando recordatorioHabilitado es true.
// ---------------------------------------------------------------------------

const agendaFormShape = {
  tipo: tipoAgenda,
  asunto: z
    .string()
    .trim()
    .min(1, 'El asunto es obligatorio')
    .max(200, 'El asunto no puede superar los 200 caracteres'),
  descripcion: z
    .string()
    .max(1000, 'La descripción no puede superar los 1000 caracteres')
    .nullable()
    .optional(),
  fecha: z
    .string()
    .min(1, 'La fecha es obligatoria')
    .refine((value) => !value || isValidAgendaDate(value), 'La fecha no es válida'),
  horaInicio: z
    .string()
    .min(1, 'La hora de inicio es obligatoria')
    .refine((value) => !value || isValidAgendaTime(value), 'La hora de inicio no es válida'),
  horaFin: z
    .string()
    .refine((value) => !value || isValidAgendaTime(value), 'La hora de fin no es válida')
    .nullable()
    .optional(),
  tareaId: z.string().nullable().optional(),
  tratoId: z.string().nullable().optional(),
  ubicacion: z
    .string()
    .max(200, 'La ubicación no puede superar los 200 caracteres')
    .nullable()
    .optional(),
  linkVideollamada: z
    .string()
    .trim()
    .max(500, 'El link no puede superar los 500 caracteres')
    .nullable()
    .optional(),
  recordatorioHabilitado: z.boolean(),
  minutosAntes: z.number().int().min(1, 'Debe ser al menos 1 minuto').nullable().optional(),
};

// Invariantes de dominio compartidas por create y edit (Agenda.create / reconstitute).
// Regla de UX del front (más estricta que el back, que los acepta opcionales):
//   - REUNION (presencial) → ubicación obligatoria, sin link.
//   - LLAMADA (remota)     → link de videollamada obligatorio, sin ubicación.
function refineAgenda(v: z.infer<z.ZodObject<typeof agendaFormShape>>, ctx: z.RefinementCtx): void {
  // horaFin debe ser posterior a horaInicio (comparación lexicográfica de "HH:mm" es válida).
  if (
    v.horaFin &&
    isValidAgendaTime(v.horaFin) &&
    isValidAgendaTime(v.horaInicio) &&
    v.horaFin <= v.horaInicio
  ) {
    ctx.addIssue({
      code: 'custom',
      path: ['horaFin'],
      message: 'La hora de fin debe ser posterior a la de inicio',
    });
  }
  // Ubicación / link según el tipo (uno u otro, nunca ambos).
  if (v.tipo === 'REUNION' && !v.ubicacion?.trim()) {
    ctx.addIssue({
      code: 'custom',
      path: ['ubicacion'],
      message: 'La ubicación es obligatoria para reuniones',
    });
  }
  if (v.tipo === 'LLAMADA' && !v.linkVideollamada?.trim()) {
    ctx.addIssue({
      code: 'custom',
      path: ['linkVideollamada'],
      message: 'El link de videollamada es obligatorio para llamadas',
    });
  } else if (v.tipo === 'LLAMADA' && !isHttpUrl(v.linkVideollamada ?? '')) {
    ctx.addIssue({
      code: 'custom',
      path: ['linkVideollamada'],
      message: 'El link debe ser una URL absoluta válida con http o https',
    });
  }
  // minutosAntes requerido y ≥ 1 cuando el recordatorio está habilitado.
  if (v.recordatorioHabilitado && (v.minutosAntes === null || v.minutosAntes === undefined)) {
    ctx.addIssue({
      code: 'custom',
      path: ['minutosAntes'],
      message: 'Indica con cuántos minutos de anticipación enviar el recordatorio',
    });
  }

  const mexicoCityNow = getMexicoCityCurrentDateTime();
  const validDate = isValidAgendaDate(v.fecha);
  const validStartTime = isValidAgendaTime(v.horaInicio);

  if (validDate && v.fecha < mexicoCityNow.date) {
    ctx.addIssue({
      code: 'custom',
      path: ['fecha'],
      message: 'La fecha no puede ser anterior a hoy',
    });
  } else if (validDate && v.fecha === mexicoCityNow.date && validStartTime && v.horaInicio < mexicoCityNow.time) {
    ctx.addIssue({
      code: 'custom',
      path: ['horaInicio'],
      message: 'La hora de inicio no puede estar en el pasado',
    });
  }
}

export const agendaCreateSchema = z.object(agendaFormShape).superRefine(refineAgenda);
export const agendaEditSchema = z.object(agendaFormShape).superRefine(refineAgenda);

export type AgendaCreateInput = z.infer<typeof agendaCreateSchema>;
export type AgendaEditInput = z.infer<typeof agendaEditSchema>;

// ---------------------------------------------------------------------------
// Opciones de UI y defaults
// ---------------------------------------------------------------------------

export const TIPO_AGENDA_OPTIONS: Array<{ value: TipoAgenda; label: string }> = [
  { value: 'LLAMADA', label: 'Llamada' },
  { value: 'REUNION', label: 'Reunión' },
];

// Labels en español para el badge read-only del estado del recordatorio.
export const RECORDATORIO_ESTADO_LABEL: Record<RecordatorioEstado, string> = {
  PENDIENTE: 'Recordatorio pendiente',
  ENVIADO: 'Recordatorio enviado',
  FALLIDO: 'Recordatorio fallido',
};

// Valores por defecto del form en modo create.
export const AGENDA_EMPTY_DEFAULTS: AgendaCreateInput = {
  tipo: 'REUNION',
  asunto: '',
  descripcion: null,
  fecha: '',
  horaInicio: '',
  horaFin: null,
  tareaId: null,
  tratoId: null,
  ubicacion: null,
  linkVideollamada: null,
  recordatorioHabilitado: false,
  minutosAntes: null,
};
