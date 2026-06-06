// useCrearTratoConFicha — hook de composición: crea un trato y, en éxito,
// crea automáticamente una ficha TRATO en la primera columna del tablero TRATOS.
//
// Diseño (orquestación en el front):
//   El back AR-CRM desacopla CreateTratoService y CreateFicha a propósito; el cliente
//   orquesta ambas llamadas. Esto es contract-respecting (el back expone ambos endpoints
//   justamente para eso).
//
// Robustez:
//   Si no hay tablero TRATOS, o el tablero no tiene columnas, el trato se crea igual y
//   la ficha se omite sin lanzar error (degradación elegante). Ver useAutoFicha.
//
// UX de toasts:
//   useCreateTrato emite 'Trato "${nombre}" creado' en su onSuccess.
//   La ficha se crea en silencio (useCreateFicha con silentSuccess) para NO mostrar un
//   segundo toast "Ficha creada": al crear un trato, la única confirmación es la del
//   trato. El flujo manual de crear ficha (FichaCreateDialog) sigue mostrando su toast.

import { useState } from 'react';
import { useAutoFicha } from '@/features/kanban/hooks/useAutoFicha';
import { useCreateTrato } from './useCreateTrato';
import type { TratoCreateInput } from '../schemas/trato.schema';
import type { Trato, TratoCreatePayload } from '@/api/types';

// Forma pública del hook — API tipo mutación simplificada (homologada con useCrearTareaConFicha)
export interface UseCrearTratoConFichaResult {
  crear: (values: TratoCreateInput) => Promise<Trato>;
  isPending: boolean;
  error: Error | null;
}

export function useCrearTratoConFicha(): UseCrearTratoConFichaResult {
  const createTratoMutation = useCreateTrato();
  const { crearFichaPara } = useAutoFicha('TRATOS', 'TRATO');
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  async function crear(values: TratoCreateInput): Promise<Trato> {
    setIsPending(true);
    setError(null);

    // Normaliza opcionales del form (undefined) a null para el contrato del back
    const payload: TratoCreatePayload = {
      contactoId: values.contactoId,
      responsableId: values.responsableId,
      nombre: values.nombre,
      tipoContrato: values.tipoContrato,
      valorEstimado: values.valorEstimado ?? null,
      probabilidad: values.probabilidad ?? null,
      fechaCierreEsperada: values.fechaCierreEsperada?.trim()
        ? values.fechaCierreEsperada
        : null,
    };

    try {
      // Paso 1: crear el trato
      const createdTrato = await new Promise<Trato>((resolve, reject) => {
        createTratoMutation.mutate(payload, {
          onSuccess: (trato) => resolve(trato),
          onError: (err) => reject(err),
        });
      });

      // Paso 2: crear la ficha automáticamente (best-effort, degradación elegante)
      await crearFichaPara({
        id: createdTrato.id,
      });

      return createdTrato;
    } catch (err) {
      const e = err instanceof Error ? err : new Error('Error desconocido al crear trato');
      setError(e);
      throw e;
    } finally {
      setIsPending(false);
    }
  }

  return { crear, isPending, error };
}
