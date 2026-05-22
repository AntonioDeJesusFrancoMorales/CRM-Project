import { z } from 'zod';

export const usuarioCreateSchema = z.object({
  nombre: z.string().min(1, 'Nombre obligatorio').max(150, 'Nombre demasiado largo'),
  correo: z.string().email('Correo inválido').max(200, 'Correo demasiado largo'),
  rol_sistema: z.enum(['admin', 'usuario'], {
    required_error: 'Selecciona un rol',
  }),
  rol_empresa: z.string().max(100, 'Rol empresa demasiado largo').optional().or(z.literal('')),
});

export const usuarioUpdateSchema = usuarioCreateSchema.partial();

export type UsuarioCreateInput = z.infer<typeof usuarioCreateSchema>;
export type UsuarioUpdateInput = z.infer<typeof usuarioUpdateSchema>;
