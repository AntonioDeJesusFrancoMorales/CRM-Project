// Schema Zod para Tarea — enums del back (W2 fix, ADR-048).
// tareaCreateSchema: tratoId REQUERIDO camelCase, enums GENERAL/SEGUIMIENTO/NEGOCIACION/CIERRE y BAJA/MEDIA/ALTA/URGENTE.
// tareaUpdateSchema: .partial() sobre campos editables — NO incluye tratoId, estado ni responsableId.

import { z } from 'zod';
import type { TipoTarea, PrioridadTarea } from '@/api/types';
import { requiredTrimmedName } from '@/lib/validation';

export const tareaCreateSchema = z.object({
  tratoId: z.string().min(1, { message: 'El trato es requerido' }),
  responsableId: z.string().min(1, { message: 'El responsable es requerido' }),
  titulo: requiredTrimmedName(200, 'El título no puede superar 200 caracteres', 'El título es requerido'),
  descripcion: z.string().nullable().optional(),
  tipo: z.enum(['GENERAL', 'SEGUIMIENTO', 'NEGOCIACION', 'CIERRE']),
  prioridad: z.enum(['BAJA', 'MEDIA', 'ALTA', 'URGENTE']),
  fechaLimite: z.string().min(1, { message: 'La fecha límite es requerida' }),
});

// El schema de update alinea al contrato real de EditTareaRequest.java.
// Campos REQUERIDOS: responsableId, titulo, tipo, prioridad, fechaLimite.
// descripcion: opcional/nullable.
// NO incluye tratoId (inmutable — una tarea no cambia de trato).
// NO incluye estado (se modifica solo con TareaEstadoMenu).
// NO incluye fechaCompletada (no existe en EditTareaRequest.java — el back no lo acepta).
export const tareaUpdateSchema = z.object({
  responsableId: z.string().min(1, { message: 'El responsable es requerido' }),
  titulo: requiredTrimmedName(200, 'El título no puede superar 200 caracteres', 'El título es requerido'),
  descripcion: z.string().nullable().optional(),
  tipo: z.enum(['GENERAL', 'SEGUIMIENTO', 'NEGOCIACION', 'CIERRE']),
  prioridad: z.enum(['BAJA', 'MEDIA', 'ALTA', 'URGENTE']),
  // fechaLimite: ISO-8601 compatible con LocalDateTime del back (sin timezone o con Z)
  fechaLimite: z.string().min(1, { message: 'La fecha límite es requerida' }),
});

export type TareaCreateInput = z.infer<typeof tareaCreateSchema>;
export type TareaUpdateInput = z.infer<typeof tareaUpdateSchema>;

// Opciones de UI para Select de tipo (value = enum del back, label = español neutro).
export const TIPO_TAREA_OPTIONS: Array<{ value: TipoTarea; label: string }> = [
  { value: 'GENERAL', label: 'General' },
  { value: 'SEGUIMIENTO', label: 'Seguimiento' },
  { value: 'NEGOCIACION', label: 'Negociación' },
  { value: 'CIERRE', label: 'Cierre' },
];

// Opciones de UI para Select de prioridad (value = enum del back, label = español neutro).
export const PRIORIDAD_OPTIONS: Array<{ value: PrioridadTarea; label: string }> = [
  { value: 'BAJA', label: 'Baja' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'ALTA', label: 'Alta' },
  { value: 'URGENTE', label: 'Urgente' },
];

// Valores por defecto para TareaForm en modo create.
export const TAREA_EMPTY_DEFAULTS: TareaCreateInput = {
  tratoId: '',
  responsableId: '',
  titulo: '',
  descripcion: null,
  tipo: 'GENERAL',
  prioridad: 'MEDIA',
  fechaLimite: '',
};
