import { z } from 'zod';
import { requiredTrimmedName } from '@/lib/validation';

// Schema para crear usuario — alineado al contrato RPC del back.
// Incluye rolId e initialPassword (requeridos por CreateUsuarioRequest).
// No incluye rol_sistema, rol_empresa ni activo (campos legacy o READ-ONLY).
export const usuarioCreateSchema = z.object({
  nombre: requiredTrimmedName(100, 'Nombre demasiado largo', 'Nombre obligatorio'),
  correo: z.string().email('Correo inválido').max(120, 'Correo demasiado largo'),
  rolId: z.string().min(1, 'El rol es requerido'),
  initialPassword: z.string().min(1, 'La contrasena inicial es requerida'),
});

// Schema para editar usuario — alineado a EditUsuarioRequest.
// nombre y correo: REQUERIDOS (back @NotBlank / @Email @NotBlank).
// rolId: opcional (sin @NotNull en el back).
// Sin initialPassword (no se edita por este endpoint).
// Sin activo (READ-ONLY desde el back).
export const usuarioUpdateSchema = z.object({
  nombre: requiredTrimmedName(100, 'Nombre demasiado largo', 'Nombre obligatorio'),
  correo: z.string().email('Correo inválido').max(120, 'Correo demasiado largo'),
  rolId: z.string().min(1, 'El rol es requerido').optional(),
});

export type UsuarioCreateInput = z.infer<typeof usuarioCreateSchema>;
export type UsuarioUpdateInput = z.infer<typeof usuarioUpdateSchema>;
