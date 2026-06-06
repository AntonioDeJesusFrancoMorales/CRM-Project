import { z } from 'zod';

// Validador laxo de teléfono LATAM: dígitos, espacios, +, (), -, mínimo 7 caracteres.
const phoneRegex = /^[\d\s+()-]{7,20}$/;

export const empresaCreateSchema = z.object({
  nombre: z.string().min(1, { message: 'El nombre es requerido' }).max(150),
  sector: z.string().max(80).optional().or(z.literal('')),
  telefono: z
    .string()
    .regex(phoneRegex, { message: 'Teléfono inválido' })
    .optional()
    .or(z.literal('')),
  paginaWeb: z.string().url({ message: 'URL inválida' }).optional().or(z.literal('')),
  facebook: z.string().max(150).optional().or(z.literal('')),
  instagram: z.string().max(150).optional().or(z.literal('')),
  twitter: z.string().max(150).optional().or(z.literal('')),
  // Campos que Create/EditEmpresaRequest aceptan (opcionales).
  estadoRelacion: z.enum(['PROSPECTO', 'ACTIVO', 'INACTIVO']).optional(),
  notas: z.string().max(2000).optional().or(z.literal('')),
});

export const empresaUpdateSchema = empresaCreateSchema.partial();

export type EmpresaCreateInput = z.infer<typeof empresaCreateSchema>;
export type EmpresaUpdateInput = z.infer<typeof empresaUpdateSchema>;
