import { z } from 'zod';
import { requiredTrimmedName } from '@/lib/validation';

// Schema para crear un rol del CRM — alineado al contrato del back (RolController.create).
// nombre: requerido, máximo 80 chars. descripcion: opcional.
// `activo` NO va en el payload: el back lo fuerza a true al crear (display-only en el front).
export const rolCreateSchema = z.object({
  nombre: requiredTrimmedName(80, 'Máximo 80 caracteres'),
  descripcion: z.string().max(255, 'Máximo 255 caracteres').optional(),
});

// Schema para editar un rol — alineado a RolController.edit (todos los campos opcionales).
export const rolUpdateSchema = z.object({
  nombre: requiredTrimmedName(80, 'Máximo 80 caracteres').optional(),
  descripcion: z.string().max(255, 'Máximo 255 caracteres').optional(),
});

export type RolCreateInput = z.infer<typeof rolCreateSchema>;
export type RolUpdateInput = z.infer<typeof rolUpdateSchema>;
