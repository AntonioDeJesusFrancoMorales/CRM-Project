import type { EstadoTareaLocal, PrioridadTarea, Tarea, TipoTarea } from '@/api/types';
import { getTareaEstado } from '../hooks/useTareaEstado';

export type VencimientoTareaFilter = 'vencidas' | 'proximas';

export interface TareaFilters {
  search: string;
  estado?: EstadoTareaLocal;
  prioridad?: PrioridadTarea;
  responsableId?: string;
  tratoId?: string;
  tipo?: TipoTarea;
  vencimiento?: VencimientoTareaFilter;
}

export function createEmptyTareaFilters(
  initial?: Partial<TareaFilters>,
): TareaFilters {
  return { search: '', ...initial };
}

export function hasActiveTareaFilters(filters: TareaFilters): boolean {
  return (
    filters.search.trim().length > 0 ||
    filters.estado !== undefined ||
    filters.prioridad !== undefined ||
    filters.responsableId !== undefined ||
    filters.tratoId !== undefined ||
    filters.tipo !== undefined ||
    filters.vencimiento !== undefined
  );
}

export function applyTareaFilters(
  tareas: Tarea[],
  filters: TareaFilters,
  now: Date = new Date(),
): Tarea[] {
  const term = filters.search.trim().toLowerCase();

  return tareas.filter((tarea) => {
    if (term && !tarea.titulo.toLowerCase().includes(term)) return false;
    if (filters.estado && getTareaEstado(tarea.id) !== filters.estado) return false;
    if (filters.prioridad && tarea.prioridad !== filters.prioridad) return false;
    if (filters.responsableId && tarea.responsableId !== filters.responsableId) return false;
    if (filters.tratoId && tarea.tratoId !== filters.tratoId) return false;
    if (filters.tipo && tarea.tipo !== filters.tipo) return false;
    if (!matchesVencimiento(tarea, filters.vencimiento, now)) return false;

    return true;
  });
}

function matchesVencimiento(
  tarea: Tarea,
  filter: VencimientoTareaFilter | undefined,
  now: Date,
): boolean {
  if (!filter) return true;

  const fechaLimite = new Date(tarea.fechaLimite);
  if (Number.isNaN(fechaLimite.getTime())) return false;

  if (filter === 'vencidas') {
    return tarea.fechaCompletada === null && fechaLimite < now;
  }

  const en7Dias = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return fechaLimite >= now && fechaLimite <= en7Dias;
}
