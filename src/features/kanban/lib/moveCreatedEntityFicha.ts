import { z } from 'zod';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { fichaSchema, type TipoFicha } from '../schemas/ficha.schema';

/**
 * Moves the ficha created by the backend for a newly created Trato or Tarea.
 * Entity creation owns ficha creation, so this function never creates a second ficha.
 */
export async function moveCreatedEntityFicha(
  tipoFicha: TipoFicha,
  entityId: string,
  targetColumnId: string,
): Promise<void> {
  const rawFichas = await apiClient.get<unknown[]>(endpoints.fichas.getAll({ tipoFicha }));
  const fichas = z.array(fichaSchema).parse(rawFichas);
  const ficha = fichas.find((item) =>
    tipoFicha === 'TRATO' ? item.tratoId === entityId : item.tareaId === entityId,
  );

  if (!ficha || ficha.columnaId === targetColumnId) return;

  await apiClient.put(
    endpoints.fichas.moverColumna(ficha.id),
    { targetColumnaId: targetColumnId },
  );
}
