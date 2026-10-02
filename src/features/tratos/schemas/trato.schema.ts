// Schema Zod para Trato — modelo unificado al contrato del back.
// Sin XOR, sin campo estado, sin superRefine.
// tratoEditSchema es tratoSchema sin contactoId (contactoId es inmutable en el back).

import { z } from 'zod';
import { requiredTrimmedName } from '@/lib/validation';
import { getMexicoCityToday, isValidYmd } from '@/lib/date';

const tratoFields = z.object({
  contactoId: z.string().min(1, { message: 'El contacto es requerido' }),
  responsableId: z.string().min(1, { message: 'El responsable es requerido' }),
  nombre: requiredTrimmedName(200),
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
  fechaCierreEsperada: z
    .string()
    .refine((value) => value === '' || isValidYmd(value), 'La fecha de cierre no es válida')
    .nullable()
    .optional()
    .or(z.literal('')),
});

function refineFechaCierre(
  values: { fechaCierreEsperada?: string | null },
  ctx: z.RefinementCtx,
): void {
  const value = values.fechaCierreEsperada;
  if (!value || !isValidYmd(value)) return;
  if (value < getMexicoCityToday()) {
    ctx.addIssue({
      code: 'custom',
      path: ['fechaCierreEsperada'],
      message: 'La fecha de cierre no puede ser anterior a hoy',
    });
  }
}

export const tratoSchema = tratoFields.superRefine(refineFechaCierre);
export const tratoEditSchema = tratoFields.omit({ contactoId: true }).superRefine(refineFechaCierre);

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
