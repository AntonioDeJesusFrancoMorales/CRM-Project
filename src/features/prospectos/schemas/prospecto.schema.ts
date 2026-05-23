import { z } from 'zod';

// Validador laxo de teléfono LATAM: dígitos, espacios, +, (), -, mínimo 7 caracteres.
const phoneRegex = /^[\d\s+()-]{7,20}$/;

export const prospectoCreateSchema = z.object({
  nombre_contacto: z.string().min(1, { message: 'El nombre del contacto es requerido' }).max(150),
  empresa_id: z.string().min(1, { message: 'La empresa es requerida' }),
  responsable_id: z.string().min(1, { message: 'El responsable es requerido' }),
  correo_contacto: z
    .string()
    .email({ message: 'Correo inválido' })
    .optional()
    .or(z.literal('')),
  telefono_contacto: z
    .string()
    .regex(phoneRegex, { message: 'Teléfono inválido' })
    .optional()
    .or(z.literal('')),
  cargo_contacto: z.string().max(100).optional().or(z.literal('')),
  como_nos_conocio: z
    .enum(['referido', 'redes_sociales', 'busqueda', 'evento', 'otro'])
    .optional(),
  estado_posible_cliente: z
    .enum(['frio', 'tibio', 'caliente'])
    .optional(),
  notas: z.string().max(2000).optional().or(z.literal('')),
});

export const prospectoUpdateSchema = prospectoCreateSchema.partial();

export type ProspectoCreateInput = z.infer<typeof prospectoCreateSchema>;
export type ProspectoUpdateInput = z.infer<typeof prospectoUpdateSchema>;
