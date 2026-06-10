import { z } from 'zod';

// Schemas de Etiqueta — alineados al contrato del back (EtiquetaController + CreateEtiquetaRequest).
// nombre: 1-50 chars. color: hex #RRGGBB. tipoEtiqueta: TAREA|TRATO (INMUTABLE tras crear).

export const tipoEtiqueta = z.enum(['TAREA', 'TRATO']);
export type TipoEtiquetaInput = z.infer<typeof tipoEtiqueta>;

const nombre = z.string().min(1, 'El nombre es requerido').max(50, 'Máximo 50 caracteres');
const color = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'El color debe ser hex #RRGGBB');

// Create: nombre + tipoEtiqueta + color (los tres requeridos, como CreateEtiquetaRequest).
export const etiquetaCreateSchema = z.object({
  nombre,
  tipoEtiqueta,
  color,
});

// Edit: solo nombre y color (el back NO permite cambiar el tipo).
export const etiquetaUpdateSchema = z.object({
  nombre,
  color,
});

export type EtiquetaCreateInput = z.infer<typeof etiquetaCreateSchema>;
export type EtiquetaUpdateInput = z.infer<typeof etiquetaUpdateSchema>;
