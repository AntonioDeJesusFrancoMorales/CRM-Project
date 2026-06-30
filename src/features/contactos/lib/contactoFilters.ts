import type { Contacto } from '@/api/types';

export interface ContactoFilters {
  search: string;
  empresaId?: string;
  responsableId?: string;
  comoNosConocio?: string;
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
): Contacto[] {
  const term = filters.search.trim().toLowerCase();
  const origen = filters.comoNosConocio?.trim().toLowerCase();

  return contactos.filter((contacto) => {
    if (term && !matchesSearch(contacto, term)) return false;
    if (filters.empresaId && contacto.empresaId !== filters.empresaId) return false;
    if (filters.responsableId && contacto.responsableId !== filters.responsableId) return false;
    if (origen && contacto.comoNosConocio?.toLowerCase() !== origen) return false;

    return true;
  });
}

function matchesSearch(contacto: Contacto, term: string): boolean {
  return (
    contacto.nombre.toLowerCase().includes(term) ||
    (contacto.correo?.toLowerCase().includes(term) ?? false) ||
    (contacto.cargo?.toLowerCase().includes(term) ?? false) ||
    (contacto.telefono?.toLowerCase().includes(term) ?? false)
  );
}
