import { z } from 'zod';

export const canalSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(100),
  instanceName: z.string().min(1, 'El nombre de instancia es requerido').max(100),
  apiUrl: z.string().url('Debe ser una URL válida').max(500),
  apiKey: z.string().min(1, 'La API key es requerida').max(500),
});

export type CanalFormValues = z.infer<typeof canalSchema>;
