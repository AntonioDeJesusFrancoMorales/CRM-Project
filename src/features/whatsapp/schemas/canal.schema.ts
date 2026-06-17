import { z } from 'zod';

export const canalSchema = z.object({
  empresaId: z.string().min(1, 'Selecciona una empresa').optional(),
  nombre: z.string().min(1, 'El nombre es requerido').max(100),
});

export type CanalFormValues = z.infer<typeof canalSchema>;
