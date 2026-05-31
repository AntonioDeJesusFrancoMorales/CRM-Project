// useCrearTareaConFicha — hook de composición: crea una tarea y, en éxito,
// crea automáticamente una ficha TAREA en la primera columna del tablero TAREAS.
//
// Diseño (orquestación en el front):
//   El back AR-CRM desacopla CreateTareaService y CreateFicha a propósito; el cliente
//   orquesta ambas llamadas. Esto es contract-respecting (el back expone ambos endpoints
//   justamente para eso).
//
// Robustez:
//   Si no hay tablero TAREAS, o el tablero no tiene columnas, la tarea se crea igual y
//   la ficha se omite sin lanzar error (degradación elegante).
//
// UX de toasts:
//   useCreateTarea ya emite "Tarea creada" en su onSuccess.
//   useCreateFicha emite "Ficha creada" en su onSuccess.
//   Decisión: se mantienen ambos toasts. El toast de ficha actúa como confirmación de
//   que la tarjeta ya aparecerá en el tablero. Si en el futuro se quiere suprimir el
//   segundo, basta con crear una variante silenciosa de useCreateFicha.

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { tableroSchema, type Tablero } from '@/features/kanban/schemas/tablero.schema';
import type { FichaCreateInput } from '@/features/kanban/schemas/ficha.schema';
import { MOCK_USER_ID } from '@/features/kanban/lib/mockUser';
import { useCreateTarea } from './useCreateTarea';
import { useCreateFicha } from '@/features/kanban/hooks/useCreateFicha';
import { tablerosKeys } from '@/features/kanban/hooks/useTableros';
import type { TareaCreateInput } from '../schemas/tarea.schema';
import type { Tarea } from '@/api/types';

// Forma pública del hook — API tipo mutación simplificada
export interface UseCrearTareaConFichaResult {
  crear: (values: TareaCreateInput) => Promise<Tarea>;
  isPending: boolean;
  error: Error | null;
}

export function useCrearTareaConFicha(): UseCrearTareaConFichaResult {
  const queryClient = useQueryClient();
  const createTareaMutation = useCreateTarea();
  const createFichaMutation = useCreateFicha();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  async function crear(values: TareaCreateInput): Promise<Tarea> {
    setIsPending(true);
    setError(null);

    try {
      // Paso 1: crear la tarea
      const createdTarea = await new Promise<Tarea>((resolve, reject) => {
        createTareaMutation.mutate(values, {
          onSuccess: (tarea) => resolve(tarea),
          onError: (err) => reject(err),
        });
      });

      // Paso 2: resolver el tablero TAREAS (garantizando que los datos estén disponibles
      // incluso si el Kanban no está montado — se usa fetchQuery para cachear o re-fetch)
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
        // Si la carga de tableros falla, degradar graciosamente: la tarea ya fue creada
        return createdTarea;
      }

      const tableroTareas = tableros.find((t) => t.tipoTablero === 'TAREAS');

      if (!tableroTareas) {
        // Sin tablero TAREAS → omitir ficha, degradación elegante
        return createdTarea;
      }

      const primeraColumna = tableroTareas.columnas[0];

      if (!primeraColumna) {
        // Tablero sin columnas → omitir ficha, degradación elegante
        return createdTarea;
      }

      // Paso 3: crear la ficha TAREA en la primera columna
      const fichaPayload: FichaCreateInput = {
        columnaId: primeraColumna.id,
        tipoFicha: 'TAREA',
        tareaId: createdTarea.id,
        tratoId: null,
        responsableId: createdTarea.responsableId ?? MOCK_USER_ID,
        creadoPor: MOCK_USER_ID,
      };

      // La creación de ficha es best-effort: si falla, la tarea ya fue creada y no se revierte
      try {
        await new Promise<void>((resolve, reject) => {
          createFichaMutation.mutate(fichaPayload, {
            onSuccess: () => resolve(),
            onError: (err) => reject(err),
          });
        });
      } catch {
        // Ficha fallida: degradar graciosamente — la tarea ya existe
      }

      return createdTarea;
    } catch (err) {
      const e = err instanceof Error ? err : new Error('Error desconocido al crear tarea');
      setError(e);
      throw e;
    } finally {
      setIsPending(false);
    }
  }

  return { crear, isPending, error };
}
