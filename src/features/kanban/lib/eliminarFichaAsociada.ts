// eliminarFichaAsociada — borra la ficha asociada a una tarea/trato.
//
// Por qué existe: el back NO borra en cascada (verificado en DeleteTareaService/
// DeleteTratoService/DeleteFichaService — cada delete borra solo lo suyo, sin FK
// ON DELETE CASCADE). El invariante "entidad + ficha se borran juntas" es propiedad
// del FRONT. Este helper lo centraliza.
//
// Robustez: asegura las fichas en cache con fetchQuery (las listas de tareas/tratos
// no montan el Kanban, así que ['fichas'] puede no estar cargada). Best-effort: si
// no encuentra la ficha o el borrado falla, no rompe el borrado de la entidad.

import type { QueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { fichaSchema, type Ficha } from '@/features/kanban/schemas/ficha.schema';
import { fichasKeys } from '@/features/kanban/hooks/useFichas';

export async function eliminarFichaAsociada(
  queryClient: QueryClient,
  match: (ficha: Ficha) => boolean,
): Promise<void> {
  let fichas: Ficha[];
  try {
    fichas = await queryClient.fetchQuery<Ficha[]>({
      queryKey: fichasKeys.all,
      queryFn: async () => {
        const data = await apiClient.get<unknown[]>(endpoints.fichas.getAll());
        return z.array(fichaSchema).parse(data);
      },
    });
  } catch {
    return; // no se pudieron resolver las fichas → best-effort
  }

  const ficha = fichas.find(match);
  if (!ficha) return;

  try {
    await apiClient.delete<void>(endpoints.fichas.delete(ficha.id));
  } catch {
    // best-effort: la entidad ya se borró; la ficha quedará para el próximo backfill/limpieza
  }
}
