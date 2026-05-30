import { z } from 'zod';

// Schema para crear usuario — alineado al contrato RPC del back.
// Incluye rolId e initialPassword (requeridos por CreateUsuarioRequest).
// No incluye rol_sistema, rol_empresa ni activo (campos legacy o READ-ONLY).
export const usuarioCreateSchema = z.object({
  nombre: z.string().min(1, 'Nombre obligatorio').max(100, 'Nombre demasiado largo'),
  correo: z.string().email('Correo inválido').max(120, 'Correo demasiado largo'),
  rolId: z.string().min(1, 'El rol es requerido'),
  initialPassword: z.string().min(1, 'La contrasena inicial es requerida'),
});

// Schema para editar usuario — alineado a EditUsuarioRequest.
// Sin initialPassword (no se edita por este endpoint).
// Sin activo (READ-ONLY desde el back).
export const usuarioUpdateSchema = z.object({
  nombre: z.string().min(1, 'Nombre obligatorio').max(100, 'Nombre demasiado largo').optional(),
  correo: z.string().email('Correo inválido').max(120, 'Correo demasiado largo').optional(),
  rolId: z.string().min(1, 'El rol es requerido').optional(),
});

export type UsuarioCreateInput = z.infer<typeof usuarioCreateSchema>;
export type UsuarioUpdateInput = z.infer<typeof usuarioUpdateSchema>;
