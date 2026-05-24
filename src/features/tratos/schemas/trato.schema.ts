// ADR-042 — Schema Zod para Trato con XOR cliente_id/prospecto_id.
// `superRefine` valida exactamente uno según el toggle `asociacion` y
// emite el issue con `path` al campo concreto para que el form lo muestre inline.

import { z } from 'zod';

export const tratoCreateSchema = z
  .object({
    asociacion: z.enum(['cliente', 'prospecto']),
    cliente_id: z.string().optional().or(z.literal('')),
    prospecto_id: z.string().optional().or(z.literal('')),
    nombre: z.string().min(1, { message: 'El nombre es requerido' }).max(200),
    responsable_id: z.string().min(1, { message: 'El responsable es requerido' }),
    valor_estimado: z
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
    fecha_cierre_esperada: z.string().nullable().optional().or(z.literal('')),
    tipo_contrato: z
      .enum(['precio_fijo', 'tiempo_materiales', 'retainer'])
      .nullable()
      .optional(),
  })
  .superRefine((data, ctx) => {
    const cliente = data.cliente_id?.trim() ?? '';
    const prospecto = data.prospecto_id?.trim() ?? '';

    if (data.asociacion === 'cliente') {
      if (!cliente) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cliente_id'],
          message: 'Selecciona un cliente',
        });
      }
      if (prospecto) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['prospecto_id'],
          message: 'No puede tener prospecto si la asociación es cliente',
        });
      }
    } else {
      if (!prospecto) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['prospecto_id'],
          message: 'Selecciona un prospecto',
        });
      }
      if (cliente) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['cliente_id'],
          message: 'No puede tener cliente si la asociación es prospecto',
        });
      }
    }
  });

export const tratoUpdateSchema = z.object({
  asociacion: z.enum(['cliente', 'prospecto']).optional(),
  cliente_id: z.string().optional().or(z.literal('')),
  prospecto_id: z.string().optional().or(z.literal('')),
  nombre: z.string().min(1).max(200).optional(),
  responsable_id: z.string().min(1).optional(),
  valor_estimado: z.number().nonnegative().nullable().optional(),
  probabilidad: z.number().min(0).max(100).nullable().optional(),
  fecha_cierre_esperada: z.string().nullable().optional().or(z.literal('')),
  tipo_contrato: z
    .enum(['precio_fijo', 'tiempo_materiales', 'retainer'])
    .nullable()
    .optional(),
});

export type TratoCreateInput = z.infer<typeof tratoCreateSchema>;
export type TratoUpdateInput = z.infer<typeof tratoUpdateSchema>;

// Valores por defecto para `TratoForm` en modo `create`.
export const TRATO_EMPTY_DEFAULTS: TratoCreateInput = {
  asociacion: 'cliente',
  cliente_id: '',
  prospecto_id: '',
  nombre: '',
  responsable_id: '',
  valor_estimado: null,
  probabilidad: null,
  fecha_cierre_esperada: '',
  tipo_contrato: null,
};
