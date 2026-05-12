import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'El correo es requerido' })
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, { message: 'Correo inválido' }),
  password: z
    .string()
    .min(1, { message: 'La contraseña es requerida' })
    .min(8, { message: 'La contraseña debe tener al menos 8 caracteres' }),
});

export type LoginInput = z.infer<typeof loginSchema>;
