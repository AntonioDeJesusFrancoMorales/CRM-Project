import type { Contacto } from '@/api/types';

export interface ContactoFilters {
  search: string;
  empresaId?: string;
  responsableId?: string;
  comoNosConocio?: string;
}

export interface ContactoFilterOptions {
  includePrivateData?: boolean;
}

export function createEmptyContactoFilters(): ContactoFilters {
  return { search: '' };
}

export function hasActiveContactoFilters(filters: ContactoFilters): boolean {
  return (
    filters.search.trim().length > 0 ||
    filters.empresaId !== undefined ||
    filters.responsableId !== undefined ||
    filters.comoNosConocio !== undefined
  );
}

export function applyContactoFilters(
  contactos: Contacto[],
  filters: ContactoFilters,
  options: ContactoFilterOptions = {},
): Contacto[] {
  const term = filters.search.trim().toLowerCase();
  const origen = filters.comoNosConocio?.trim().toLowerCase();
  const includePrivateData = options.includePrivateData ?? true;

  return contactos.filter((contacto) => {
    if (term && !matchesSearch(contacto, term, includePrivateData)) return false;
    if (filters.empresaId && contacto.empresaId !== filters.empresaId) return false;
    if (filters.responsableId && contacto.responsableId !== filters.responsableId) return false;
    if (origen && contacto.comoNosConocio?.toLowerCase() !== origen) return false;

    return true;
  });
}

function matchesSearch(contacto: Contacto, term: string, includePrivateData: boolean): boolean {
  return (
    contacto.nombre.toLowerCase().includes(term) ||
    (contacto.cargo?.toLowerCase().includes(term) ?? false) ||
    (includePrivateData &&
      ((contacto.correo?.toLowerCase().includes(term) ?? false) ||
        (contacto.telefono?.toLowerCase().includes(term) ?? false)))
  );
}
