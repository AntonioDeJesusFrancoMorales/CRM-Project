import type { Empresa } from '@/api/types';

export interface EmpresaFilters {
  search: string;
  estadoRelacion?: Empresa['estadoRelacion'];
  sector?: string;
  responsableId?: string;
  web?: 'con-web' | 'sin-web';
}

export interface EmpresaFilterOptions {
  includePrivateData?: boolean;
}

export function createEmptyEmpresaFilters(): EmpresaFilters {
  return { search: '' };
}

export function hasActiveEmpresaFilters(filters: EmpresaFilters): boolean {
  return (
    filters.search.trim().length > 0 ||
    filters.estadoRelacion !== undefined ||
    filters.sector !== undefined ||
    filters.responsableId !== undefined ||
    filters.web !== undefined
  );
}

export function applyEmpresaFilters(
  empresas: Empresa[],
  filters: EmpresaFilters,
  options: EmpresaFilterOptions = {},
): Empresa[] {
  const term = filters.search.trim().toLowerCase();
  const sector = filters.sector?.trim().toLowerCase();
  const includePrivateData = options.includePrivateData ?? true;

  return empresas.filter((empresa) => {
    if (term && !matchesSearch(empresa, term, includePrivateData)) return false;
    if (filters.estadoRelacion && empresa.estadoRelacion !== filters.estadoRelacion) return false;
    if (sector && empresa.sector?.toLowerCase() !== sector) return false;
    if (filters.responsableId && empresa.responsableId !== filters.responsableId) return false;
    if (filters.web === 'con-web' && !empresa.paginaWeb) return false;
    if (filters.web === 'sin-web' && empresa.paginaWeb) return false;

    return true;
  });
}

function matchesSearch(empresa: Empresa, term: string, includePrivateData: boolean): boolean {
  return (
    empresa.nombre.toLowerCase().includes(term) ||
    (empresa.sector?.toLowerCase().includes(term) ?? false) ||
    (includePrivateData &&
      ((empresa.telefono?.toLowerCase().includes(term) ?? false) ||
        (empresa.paginaWeb?.toLowerCase().includes(term) ?? false)))
  );
}
