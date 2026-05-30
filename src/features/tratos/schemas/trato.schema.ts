// Schema Zod para Trato — modelo unificado al contrato del back.
// Sin XOR, sin campo estado, sin superRefine.
// tratoEditSchema es tratoSchema sin contactoId (contactoId es inmutable en el back).

import { z } from 'zod';

export const tratoSchema = z.object({
  contactoId: z.string().min(1, { message: 'El contacto es requerido' }),
  responsableId: z.string().min(1, { message: 'El responsable es requerido' }),
  nombre: z
    .string()
    .min(1, { message: 'El nombre es requerido' })
    .max(200, { message: 'El nombre no puede superar 200 caracteres' }),
  tipoContrato: z.enum(['SERVICIO', 'LICENCIA', 'SUSCRIPCION', 'PERMANENTE', 'OTRO'], {
    message: 'Selecciona un tipo de contrato válido',
  }),
  valorEstimado: z
    .number()
    .nonnegative({ message: 'El valor estimado debe ser positivo' })
    .nullable()
    .optional(),
  probabilidad: z
    .number()
    .min(0, { message: 'Probabilidad mínima 0' })
    .max(100, { message: 'Probabilidad máxima 100' })
    .nullable()
    .optional(),
  fechaCierreEsperada: z.string().nullable().optional().or(z.literal('')),
});

export const tratoEditSchema = tratoSchema.omit({ contactoId: true });

export type TratoCreateInput = z.infer<typeof tratoSchema>;
export type TratoEditInput = z.infer<typeof tratoEditSchema>;

// Valores por defecto para TratoForm en modo create.
export const TRATO_EMPTY_DEFAULTS: TratoCreateInput = {
  contactoId: '',
  responsableId: '',
  nombre: '',
  tipoContrato: 'SERVICIO',
  valorEstimado: null,
  probabilidad: null,
  fechaCierreEsperada: '',
};
