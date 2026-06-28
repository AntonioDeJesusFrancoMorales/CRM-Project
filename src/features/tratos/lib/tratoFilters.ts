import type { EstadoTrato, TipoContrato, Trato } from '@/api/types';

export type CierreEsperadoFilter =
  | 'todas'
  | 'vencidas'
  | 'proximos-7'
  | 'proximos-30'
  | 'sin-fecha';

export interface TratoFilters {
  search: string;
  estado?: EstadoTrato;
  tipoContrato?: TipoContrato;
  responsableId?: string;
  contactoId?: string;
  valorMin?: number;
  valorMax?: number;
  cierreEsperado?: CierreEsperadoFilter;
}

export function createEmptyTratoFilters(): TratoFilters {
  return { search: '' };
}

export function hasActiveTratoFilters(filters: TratoFilters): boolean {
  return (
    filters.search.trim().length > 0 ||
    filters.estado !== undefined ||
    filters.tipoContrato !== undefined ||
    filters.responsableId !== undefined ||
    filters.contactoId !== undefined ||
    filters.valorMin !== undefined ||
    filters.valorMax !== undefined ||
    (filters.cierreEsperado !== undefined && filters.cierreEsperado !== 'todas')
  );
}

export function applyTratoFilters(
  tratos: Trato[],
  filters: TratoFilters,
  now: Date = new Date(),
): Trato[] {
  const term = filters.search.trim().toLowerCase();

  return tratos.filter((trato) => {
    if (term && !trato.nombre.toLowerCase().includes(term)) return false;
    if (filters.estado && trato.estado !== filters.estado) return false;
    if (filters.tipoContrato && trato.tipoContrato !== filters.tipoContrato) return false;
    if (filters.responsableId && trato.responsableId !== filters.responsableId) return false;
    if (filters.contactoId && trato.contactoId !== filters.contactoId) return false;

    if (filters.valorMin !== undefined) {
      if (trato.valorEstimado === null || trato.valorEstimado < filters.valorMin) return false;
    }

    if (filters.valorMax !== undefined) {
      if (trato.valorEstimado === null || trato.valorEstimado > filters.valorMax) return false;
    }

    if (!matchesCierreEsperado(trato.fechaCierreEsperada, filters.cierreEsperado, now)) {
      return false;
    }

    return true;
  });
}

function matchesCierreEsperado(
  fechaCierreEsperada: string | null,
  filter: CierreEsperadoFilter | undefined,
  now: Date,
): boolean {
  if (!filter || filter === 'todas') return true;
  if (filter === 'sin-fecha') return fechaCierreEsperada === null;
  if (!fechaCierreEsperada) return false;

  const fecha = new Date(fechaCierreEsperada);
  if (Number.isNaN(fecha.getTime())) return false;

  if (filter === 'vencidas') return fecha < now;

  const days = filter === 'proximos-7' ? 7 : 30;
  const limit = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return fecha >= now && fecha <= limit;
}
