// useAutoFicha — hook compartido de orquestación: dado un tipoTablero y tipoFicha,
// expone una función async que crea automáticamente una ficha para una entidad creada.
//
// Reutilizado por useCrearTareaConFicha y useCrearTratoConFicha para evitar duplicación.
//
// Garantías:
//   - fetchQuery asegura datos frescos aunque el Kanban no esté montado.
//   - Si no hay tablero del tipo, o no tiene columnas → no crea ficha (degradación elegante).
//   - La ficha se crea siempre en silencio (silentSuccess: true).

import { useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { tableroSchema, type Tablero, type TipoTablero } from '@/features/kanban/schemas/tablero.schema';
import type { FichaCreateInput, TipoFicha } from '@/features/kanban/schemas/ficha.schema';
import { MOCK_USER_ID } from '@/features/kanban/lib/mockUser';
import { tablerosKeys } from './useTableros';
import { useCreateFicha } from './useCreateFicha';

export interface AutoFichaEntity {
  id: string;
  responsableId?: string;
}

export interface UseAutoFichaResult {
  crearFichaPara: (entity: AutoFichaEntity) => Promise<void>;
}

export function useAutoFicha(tipoTablero: TipoTablero, tipoFicha: TipoFicha): UseAutoFichaResult {
  const queryClient = useQueryClient();
  const createFichaMutation = useCreateFicha({ silentSuccess: true });

  async function crearFichaPara(entity: AutoFichaEntity): Promise<void> {
    // Resolver tableros (fetchQuery garantiza datos aunque el Kanban no esté montado)
    let tableros: Tablero[] = [];
    try {
      const raw = await queryClient.fetchQuery<Tablero[]>({
        queryKey: tablerosKeys.all,
        queryFn: async () => {
          const data = await apiClient.get<unknown[]>(endpoints.tableros.getAll());
          return z.array(tableroSchema).parse(data);
        },
      });
      tableros = raw;
    } catch {
      // Si la carga de tableros falla, degradar graciosamente
      return;
    }

    const tableroTarget = tableros.find((t) => t.tipoTablero === tipoTablero);

    if (!tableroTarget) {
      // Sin tablero del tipo requerido → omitir ficha, degradación elegante
      return;
    }

    const primeraColumna = tableroTarget.columnas[0];

    if (!primeraColumna) {
      // Tablero sin columnas → omitir ficha, degradación elegante
      return;
    }

    // Construir payload según tipoFicha
    const fichaPayload: FichaCreateInput = {
      columnaId: primeraColumna.id,
      tipoFicha,
      tratoId: tipoFicha === 'TRATO' ? entity.id : null,
      tareaId: tipoFicha === 'TAREA' ? entity.id : null,
      responsableId: entity.responsableId ?? MOCK_USER_ID,
      creadoPor: MOCK_USER_ID,
    };

    // La creación de ficha es best-effort: si falla, la entidad ya fue creada
    try {
      await new Promise<void>((resolve, reject) => {
        createFichaMutation.mutate(fichaPayload, {
          onSuccess: () => resolve(),
          onError: (err) => reject(err),
        });
      });
    } catch {
      // Ficha fallida: degradar graciosamente
    }
  }

  return { crearFichaPara };
}
