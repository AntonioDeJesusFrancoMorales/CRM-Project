// Schema Zod para Tarea — Lote B (ADR-048).
// tareaCreateSchema: trato_id REQUERIDO (min 1), sin lógica XOR (una tarea siempre pertenece a un trato).
// tareaUpdateSchema: .partial() + extiende con estado y fecha_completada (para mutations inline).

import { z } from 'zod';

export const tareaCreateSchema = z.object({
  trato_id: z.string().min(1, { message: 'El trato es requerido' }),
  responsable_id: z.string().min(1, { message: 'El responsable es requerido' }),
  titulo: z
    .string()
    .min(1, { message: 'El título es requerido' })
    .max(200, { message: 'El título no puede superar 200 caracteres' }),
  descripcion: z.string().nullable().optional(),
  tipo: z.enum(['llamada', 'reunion', 'email', 'demo', 'seguimiento']),
  prioridad: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  fecha_limite: z.string().nullable().optional(),
});

// El schema de update permite modificar estado y fecha_completada (mutations programáticas).
// No expone trato_id (una tarea no cambia de trato).
export const tareaUpdateSchema = tareaCreateSchema
  .omit({ trato_id: true })
  .partial()
  .extend({
    estado: z.enum(['pendiente', 'en_progreso', 'completada']).optional(),
    fecha_completada: z.string().nullable().optional(),
  });

export type TareaCreateInput = z.infer<typeof tareaCreateSchema>;
export type TareaUpdateInput = z.infer<typeof tareaUpdateSchema>;

// Valores por defecto para TareaForm en modo create.
export const TAREA_EMPTY_DEFAULTS: TareaCreateInput = {
  trato_id: '',
  responsable_id: '',
  titulo: '',
  descripcion: null,
  tipo: 'seguimiento',
  prioridad: 2,
  fecha_limite: null,
};
