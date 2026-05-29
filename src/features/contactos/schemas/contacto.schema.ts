import { z } from 'zod';

// Validador laxo de teléfono LATAM: dígitos, espacios, +, (), -, mínimo 7 caracteres.
const phoneRegex = /^[\d\s+()-]{7,20}$/;

// Sugerencias para el campo comoNosConocio (combobox + texto libre).
// El campo acepta cualquier string — estas son sugerencias, no un enum.
export const COMO_NOS_CONOCIO_SUGERENCIAS = [
  'Referido',
  'Redes',
  'Web',
  'Evento',
  'Otro',
] as const satisfies readonly string[];

export const contactoCreateSchema = z.object({
  nombre: z.string().min(1, { message: 'El nombre es requerido' }).max(150),
  correo: z
    .string()
    .email({ message: 'Correo inválido' })
    .nullable()
    .optional(),
  telefono: z
    .string()
    .regex(phoneRegex, { message: 'Teléfono inválido' })
    .nullable()
    .optional(),
  // empresaId requerido — @NotNull en el back (CreateContactoRequest).
  empresaId: z
    .string()
    .uuid({ message: 'ID de empresa inválido' }),
  estadoRelacion: z.enum(['PROSPECTO', 'ACTIVO', 'INACTIVO']),
  comoNosConocio: z.string().max(200).nullable().optional(),
  responsableId: z.string().uuid().nullable().optional(),
});

// empresaId y creadoPor son inmutables en el back — no van en el schema de edición.
export const contactoUpdateSchema = z.object({
  nombre: z.string().min(1, { message: 'El nombre es requerido' }).max(150).optional(),
  correo: z
    .string()
    .email({ message: 'Correo inválido' })
    .nullable()
    .optional(),
  telefono: z
    .string()
    .regex(phoneRegex, { message: 'Teléfono inválido' })
    .nullable()
    .optional(),
  estadoRelacion: z.enum(['PROSPECTO', 'ACTIVO', 'INACTIVO']).optional(),
  comoNosConocio: z.string().max(200).nullable().optional(),
  responsableId: z.string().uuid().nullable().optional(),
});

// Valores iniciales vacíos para inicializar formularios en modo creación.
export const CONTACTO_EMPTY_DEFAULTS = {
  nombre: '',
  correo: null,
  telefono: null,
  empresaId: '',
  estadoRelacion: 'PROSPECTO' as const,
  comoNosConocio: null,
  responsableId: null,
} satisfies z.input<typeof contactoCreateSchema>;

export type ContactoCreateInput = z.infer<typeof contactoCreateSchema>;
export type ContactoUpdateInput = z.infer<typeof contactoUpdateSchema>;
