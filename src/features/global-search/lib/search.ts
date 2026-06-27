import type { Contacto, Empresa, Tarea, Trato } from '@/api/types';

export type GlobalSearchEntity = 'empresa' | 'contacto' | 'trato' | 'tarea';

export interface GlobalSearchResult {
  id: string;
  type: GlobalSearchEntity;
  title: string;
  subtitle?: string;
  badge?: string;
  to: string;
  haystack: string;
}

export interface GlobalSearchGroups {
  empresas: GlobalSearchResult[];
  contactos: GlobalSearchResult[];
  tratos: GlobalSearchResult[];
  tareas: GlobalSearchResult[];
}

interface BuildGlobalSearchResultsInput {
  empresas?: Empresa[];
  contactos?: Contacto[];
  tratos?: Trato[];
  tareas?: Tarea[];
  query: string;
  limitPerGroup?: number;
}

const DEFAULT_LIMIT_PER_GROUP = 5;
const MIN_QUERY_LENGTH = 2;

function compact(values: Array<string | number | null | undefined>): string {
  return values
    .filter((value): value is string | number => value !== null && value !== undefined && String(value).trim() !== '')
    .map(String)
    .join(' ');
}

export function normalizeSearchText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function matches(result: GlobalSearchResult, normalizedQuery: string): boolean {
  return normalizeSearchText(result.haystack).includes(normalizedQuery);
}

function limit(results: GlobalSearchResult[], limitPerGroup: number): GlobalSearchResult[] {
  return results.slice(0, limitPerGroup);
}

function buildEmpresaResult(empresa: Empresa): GlobalSearchResult {
  return {
    id: empresa.id,
    type: 'empresa',
    title: empresa.nombre,
    subtitle: compact([empresa.sector, empresa.telefono]),
    badge: empresa.estadoRelacion,
    to: `/empresas/${empresa.id}`,
    haystack: compact([
      empresa.nombre,
      empresa.sector,
      empresa.telefono,
      empresa.paginaWeb,
      empresa.facebook,
      empresa.instagram,
      empresa.twitter,
      empresa.notas,
    ]),
  };
}

function buildContactoResult(contacto: Contacto): GlobalSearchResult {
  return {
    id: contacto.id,
    type: 'contacto',
    title: contacto.nombre,
    subtitle: compact([contacto.cargo, contacto.correo, contacto.telefono]),
    badge: contacto.estadoRelacion,
    to: `/contactos/${contacto.id}`,
    haystack: compact([
      contacto.nombre,
      contacto.correo,
      contacto.telefono,
      contacto.cargo,
      contacto.comoNosConocio,
      contacto.estadoRelacion,
    ]),
  };
}

function buildTratoResult(trato: Trato): GlobalSearchResult {
  return {
    id: trato.id,
    type: 'trato',
    title: trato.nombre,
    subtitle: compact([trato.tipoContrato, trato.valorEstimado]),
    badge: trato.estado,
    to: `/tratos/${trato.id}`,
    haystack: compact([
      trato.nombre,
      trato.tipoContrato,
      trato.estado,
      trato.motivoPerdida,
      trato.valorEstimado,
      trato.probabilidad,
    ]),
  };
}

function buildTareaResult(tarea: Tarea): GlobalSearchResult {
  return {
    id: tarea.id,
    type: 'tarea',
    title: tarea.titulo,
    subtitle: compact([tarea.descripcion, tarea.prioridad]),
    badge: tarea.tipo,
    to: `/tareas/${tarea.id}`,
    haystack: compact([
      tarea.titulo,
      tarea.descripcion,
      tarea.tipo,
      tarea.prioridad,
      tarea.fechaLimite,
    ]),
  };
}

export function buildGlobalSearchResults({
  empresas = [],
  contactos = [],
  tratos = [],
  tareas = [],
  query,
  limitPerGroup = DEFAULT_LIMIT_PER_GROUP,
}: BuildGlobalSearchResultsInput): GlobalSearchGroups {
  const normalizedQuery = normalizeSearchText(query);

  if (normalizedQuery.length < MIN_QUERY_LENGTH) {
    return { empresas: [], contactos: [], tratos: [], tareas: [] };
  }

  return {
    empresas: limit(empresas.map(buildEmpresaResult).filter((result) => matches(result, normalizedQuery)), limitPerGroup),
    contactos: limit(contactos.map(buildContactoResult).filter((result) => matches(result, normalizedQuery)), limitPerGroup),
    tratos: limit(tratos.map(buildTratoResult).filter((result) => matches(result, normalizedQuery)), limitPerGroup),
    tareas: limit(tareas.map(buildTareaResult).filter((result) => matches(result, normalizedQuery)), limitPerGroup),
  };
}

export function countGlobalSearchResults(groups: GlobalSearchGroups): number {
  return groups.empresas.length + groups.contactos.length + groups.tratos.length + groups.tareas.length;
}
