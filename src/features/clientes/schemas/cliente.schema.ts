import { z } from 'zod';

// Validador laxo de teléfono LATAM: dígitos, espacios, +, (), -, mínimo 7 caracteres.
const phoneRegex = /^[\d\s+()-]{7,20}$/;

// ADR-034: como_nos_conocio usa .optional() SIN .default() (lección WARN-03 de Change 4).
export const clienteCreateSchema = z.object({
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
  notas: z.string().max(2000).optional().or(z.literal('')),
});

export const clienteUpdateSchema = clienteCreateSchema.partial();

export type ClienteCreateInput = z.infer<typeof clienteCreateSchema>;
export type ClienteUpdateInput = z.infer<typeof clienteUpdateSchema>;

// Valores por defecto para el formulario de creación.
// como_nos_conocio: undefined (NO string vacío — es enum .optional()).
export const CLIENTE_EMPTY_DEFAULTS: ClienteCreateInput = {
  nombre_contacto: '',
  empresa_id: '',
  responsable_id: '',
  correo_contacto: '',
  telefono_contacto: '',
  cargo_contacto: '',
  notas: '',
  como_nos_conocio: undefined,
};
