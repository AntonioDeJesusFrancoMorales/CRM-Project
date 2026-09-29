import type { Trato } from '@/api/types';
import { isHttpError } from '@/api/http-error';
import { localizeApiErrorMessage } from '@/lib/api-error';

function getRelatedDealName(errorMessage: string, details: Array<{ field: string; message: string }> | undefined, tratos: Trato[]): { id: string; name: string } | undefined {
  const candidates = [errorMessage, ...(details ?? []).map((detail) => detail.message)];
  const trato = tratos.find((item) => candidates.some((candidate) => candidate.includes(item.id)));
  return trato ? { id: trato.id, name: trato.nombre } : undefined;
}

export function getContactoDeleteErrorMessage(error: unknown, tratos: Trato[] = []): string {
  if (!isHttpError(error)) return 'No fue posible eliminar el contacto';

  const message = localizeApiErrorMessage(error.message);
  const relatedDeal = getRelatedDealName(message, error.details, tratos);
  if (!relatedDeal) return message;

  if (message.includes(relatedDeal.id)) return message.replaceAll(relatedDeal.id, relatedDeal.name);
  return `${message}: ${relatedDeal.name}`;
}
