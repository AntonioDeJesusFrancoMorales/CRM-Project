import { z } from 'zod';
import { isValidOptionalSocialUrl, isValidOptionalWebsiteUrl } from '../lib/empresaLinks';

// Validador laxo de teléfono LATAM: dígitos, espacios, +, (), -, mínimo 7 caracteres.
const phoneRegex = /^[\d\s+()-]{7,20}$/;

export const empresaCreateSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, { message: 'El nombre es requerido' })
    .max(150, { message: 'El nombre no puede superar 150 caracteres' }),
  sector: z
    .string()
    .trim()
    .max(80, { message: 'El sector no puede superar 80 caracteres' })
    .optional()
    .or(z.literal('')),
  telefono: z
    .string()
    .trim()
    .refine((value) => value === '' || phoneRegex.test(value), { message: 'Teléfono inválido' })
    .optional()
    .or(z.literal('')),
  paginaWeb: z
    .string()
    .trim()
    .refine(isValidOptionalWebsiteUrl, {
      message: 'La página web debe ser una URL válida.',
    })
    .optional()
    .or(z.literal('')),
  facebook: z
    .string()
    .trim()
    .max(150, { message: 'Facebook no puede superar 150 caracteres' })
    .refine((value) => isValidOptionalSocialUrl(value, 'facebook'), {
      message: 'Facebook debe ser una URL válida o un usuario con @.',
    })
    .optional()
    .or(z.literal('')),
  instagram: z
    .string()
    .trim()
    .max(150, { message: 'Instagram no puede superar 150 caracteres' })
    .refine((value) => isValidOptionalSocialUrl(value, 'instagram'), {
      message: 'Instagram debe ser una URL válida o un usuario con @.',
    })
    .optional()
    .or(z.literal('')),
  twitter: z
    .string()
    .trim()
    .max(150, { message: 'Twitter / X no puede superar 150 caracteres' })
    .refine((value) => isValidOptionalSocialUrl(value, 'twitter'), {
      message: 'Twitter / X debe ser una URL válida o un usuario con @.',
    })
    .optional()
    .or(z.literal('')),
  // Campos que Create/EditEmpresaRequest aceptan (opcionales).
  estadoRelacion: z.enum(['PROSPECTO', 'ACTIVO', 'INACTIVO']).optional(),
  notas: z
    .string()
    .trim()
    .max(2000, { message: 'Las notas no pueden superar 2000 caracteres' })
    .optional()
    .or(z.literal('')),
});

export const empresaUpdateSchema = empresaCreateSchema.partial();

export type EmpresaCreateInput = z.infer<typeof empresaCreateSchema>;
export type EmpresaUpdateInput = z.infer<typeof empresaUpdateSchema>;
