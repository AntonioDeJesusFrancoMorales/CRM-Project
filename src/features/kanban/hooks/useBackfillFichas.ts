// useBackfillFichas — backfill automático de fichas para entidades sin ficha.
//
// Al montar el Kanban, puede haber entidades (tratos o tareas) creadas antes
// de que se implementara la creación automática de fichas, o creadas directamente
// por el back, que no tienen ficha en ningún tablero. Este hook las detecta y
// crea las fichas faltantes en silencio (sin toasts), reutilizando useAutoFicha.
//
// Garantías:
//   - Idempotente: usa un useRef (set de ids procesados) para evitar re-disparos.
//   - Anti-loop: la creación invalida la query de fichas → re-render, pero el guard
//     evita procesar ids que ya fueron enviados en esta sesión.
//   - Best-effort: si una creación falla, el resto continúa.
//   - No bloquea el render: el board renderiza normalmente mientras el backfill corre.

import { useEffect, useRef } from 'react';
import type { TipoTablero } from '@/features/kanban/schemas/tablero.schema';
import type { TipoFicha, Ficha } from '@/features/kanban/schemas/ficha.schema';
import { useTratos } from '@/features/tratos/hooks/useTratos';
import { useTareas } from '@/features/tareas/hooks/useTareas';
import { useFichas } from './useFichas';
import { useAutoFicha } from './useAutoFicha';

// ---------------------------------------------------------------------------
// Hook público
// ---------------------------------------------------------------------------

export function useBackfillFichas(tipoTablero: TipoTablero, tipoFicha: TipoFicha): void {
  // Queries — solo una de las dos (tratos o tareas) se usa según tipoTablero
  const tratosQuery = useTratos();
  const tareasQuery = useTareas();
  const fichasQuery = useFichas();

  // useAutoFicha resuelve tableros, toma columnas[0] y crea la ficha en silencio
  const { crearFichaPara } = useAutoFicha(tipoTablero, tipoFicha);

  // Guard de idempotencia: ids procesados en esta sesión (mount)
  const procesadosRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Esperar a que ambas queries relevantes estén listas
    const fichas = fichasQuery.data;

    const procesados = procesadosRef.current;
    if (!procesados) return;

    if (tipoTablero === 'TRATOS') {
      const tratos = tratosQuery.data;
      if (!tratos || !fichas) return;
      runBackfill(tratos, fichas, procesados, crearFichaPara, (e, f) =>
        f.tratoId === e.id,
      );
    } else {
      // TAREAS
      const tareas = tareasQuery.data;
      if (!tareas || !fichas) return;
      runBackfill(tareas, fichas, procesados, crearFichaPara, (e, f) =>
        f.tareaId === e.id,
      );
    }
  }, [
    tipoTablero,
    tratosQuery.data,
    tareasQuery.data,
    fichasQuery.data,
    crearFichaPara,
  ]);
}

// ---------------------------------------------------------------------------
// Helper interno — genérico sobre Trato | Tarea
// ---------------------------------------------------------------------------

function runBackfill<T extends { id: string; responsableId: string }>(
  entidades: T[],
  fichas: Ficha[],
  procesados: Set<string>,
  crearFichaPara: (entity: { id: string; responsableId?: string }) => Promise<void>,
  tieneFilcha: (e: T, f: Ficha) => boolean,
): void {
  // Calcular entidades sin ficha en NINGÚN tablero
  const faltantes = entidades.filter(
    (e) =>
      !procesados.has(e.id) && // no procesado aún en esta sesión
      !fichas.some((f) => tieneFilcha(e, f)), // no tiene ficha en ningún tablero
  );

  if (faltantes.length === 0) return;

  // Marcar todos como procesados ANTES de lanzar las promesas (anti-loop)
  for (const e of faltantes) {
    procesados.add(e.id);
  }

  // Crear fichas en paralelo — best-effort: errores individuales no rompen los demás
  void Promise.all(
    faltantes.map((e) =>
      crearFichaPara({ id: e.id, responsableId: e.responsableId }).catch(() => {
        // Degradación elegante: falló la creación, pero no afecta al resto
      }),
    ),
  );
}
