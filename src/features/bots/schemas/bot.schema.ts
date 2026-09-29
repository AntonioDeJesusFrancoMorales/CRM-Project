import { z } from 'zod';
import { requiredTrimmedName } from '@/lib/validation';

// Schemas de Bot — alineados al contrato del back (BotController + CreateBotRequest/EditBotRequest).
// nombre: requerido. webhookUrl: URL completa del nodo Webhook de n8n. canalId: opcional
// (vacío/undefined = aplica a todos los canales).

const nombre = requiredTrimmedName(100, 'Máximo 100 caracteres');
const webhookUrl = z
  .string()
  .min(1, 'La URL del webhook es requerida')
  .url('Debe ser una URL válida (https://...)');
const canalId = z.string().optional();

export const botCreateSchema = z.object({
  nombre,
  canalId,
  webhookUrl,
});

export const botUpdateSchema = z.object({
  nombre,
  canalId,
  webhookUrl,
});

export type BotCreateInput = z.infer<typeof botCreateSchema>;
export type BotUpdateInput = z.infer<typeof botUpdateSchema>;
