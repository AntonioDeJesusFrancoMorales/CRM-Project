import type {
  AccionPermiso,
  AlcancePermiso,
  GrupoSensible,
  PermisoRecurso,
  RecursoCRM,
  Rol,
} from '@/api/types';

export const RECURSOS_CRM: readonly RecursoCRM[] = [
  'TABLERO',
  'COLUMNA',
  'FICHA',
  'TRATO',
  'TAREA',
  'CONTACTO',
  'EMPRESA',
  'ETIQUETA',
  'AGENDA',
  'ROL',
  'USUARIO',
] as const;

export const ACCIONES_PERMISO: readonly AccionPermiso[] = [
  'LEER',
  'CREAR',
  'ACTUALIZAR',
  'ELIMINAR',
  'ADMINISTRAR',
] as const;

export const ALCANCES_PERMISO: readonly AlcancePermiso[] = [
  'TODO_COMPARTIDO',
  'PROPIOS_O_ASIGNADOS',
  'TABLEROS_PERMITIDOS',
] as const;

const RECURSOS_TRABAJO: readonly RecursoCRM[] = [
  'TABLERO',
  'COLUMNA',
  'FICHA',
  'TRATO',
  'TAREA',
  'CONTACTO',
  'EMPRESA',
  'ETIQUETA',
  'AGENDA',
] as const;

const ALCANCES_POR_RECURSO: Record<RecursoCRM, readonly AlcancePermiso[]> = {
  TABLERO: ['TODO_COMPARTIDO', 'TABLEROS_PERMITIDOS'],
  COLUMNA: ['TODO_COMPARTIDO', 'TABLEROS_PERMITIDOS'],
  FICHA: ['TODO_COMPARTIDO', 'TABLEROS_PERMITIDOS'],
  TRATO: ['TODO_COMPARTIDO', 'PROPIOS_O_ASIGNADOS'],
  TAREA: ['TODO_COMPARTIDO', 'PROPIOS_O_ASIGNADOS'],
  CONTACTO: ['TODO_COMPARTIDO', 'PROPIOS_O_ASIGNADOS'],
  EMPRESA: ['TODO_COMPARTIDO', 'PROPIOS_O_ASIGNADOS'],
  ETIQUETA: ['TODO_COMPARTIDO'],
  AGENDA: ['TODO_COMPARTIDO', 'PROPIOS_O_ASIGNADOS'],
  ROL: ['TODO_COMPARTIDO'],
  USUARIO: ['TODO_COMPARTIDO'],
};

export const GRUPOS_SENSIBLES: readonly GrupoSensible[] = [
  'FINANCIERO',
  'CONTACTO_PRIVADO',
] as const;

export function isRecursoCRM(value: unknown): value is RecursoCRM {
  return typeof value === 'string' && RECURSOS_CRM.includes(value as RecursoCRM);
}

export function isAccionPermiso(value: unknown): value is AccionPermiso {
  return typeof value === 'string' && ACCIONES_PERMISO.includes(value as AccionPermiso);
}

export function isAlcancePermiso(value: unknown): value is PermisoRecurso['alcance'] {
  return typeof value === 'string' && ALCANCES_PERMISO.includes(value as AlcancePermiso);
}

export function getSupportedScopes(recurso: RecursoCRM): readonly AlcancePermiso[] {
  return ALCANCES_POR_RECURSO[recurso];
}

export function supportsScope(recurso: RecursoCRM, alcance: AlcancePermiso): boolean {
  return getSupportedScopes(recurso).includes(alcance);
}

export function isGrupoSensible(value: unknown): value is GrupoSensible {
  return typeof value === 'string' && GRUPOS_SENSIBLES.includes(value as GrupoSensible);
}

function normalizeStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  return [...new Set(value.filter((item): item is string => typeof item === 'string' && item.trim() !== ''))];
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeUuidArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const ids = normalizeStringArray(value);
  if (ids === null || ids.some((id) => !UUID_PATTERN.test(id))) return null;
  return ids;
}

function normalizeGroupArray(value: unknown): GrupoSensible[] | null {
  if (!Array.isArray(value)) return null;
  return [...new Set(value.filter(isGrupoSensible))];
}

/**
 * Normaliza el DTO sin convertir datos ausentes en permisos efectivos.
 * Un grupo nulo permanece nulo para que la UI pueda distinguir "sin dato" de
 * una lista explícita vacía.
 */
export function normalizePermisoRecurso(value: unknown): PermisoRecurso | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Record<string, unknown>;
  if (!isRecursoCRM(candidate['recurso'])) return null;

  const acciones = Array.isArray(candidate['acciones'])
    ? [...new Set(candidate['acciones'].filter(isAccionPermiso))]
    : [];
  if (!isAlcancePermiso(candidate['alcance'])) return null;
  const alcance = candidate['alcance'];
  if (!supportsScope(candidate['recurso'], alcance)) return null;

  const rawIds = candidate['idsPermitidos'];
  const idsPermitidos = normalizeUuidArray(rawIds);
  if (Array.isArray(rawIds) && idsPermitidos === null) return null;
  if (alcance === 'TABLEROS_PERMITIDOS' && (idsPermitidos?.length ?? 0) === 0) return null;
  if (alcance !== 'TABLEROS_PERMITIDOS' && (idsPermitidos?.length ?? 0) > 0) return null;

  return {
    recurso: candidate['recurso'],
    acciones,
    alcance,
    idsPermitidos,
    gruposLectura: normalizeGroupArray(candidate['gruposLectura']),
    gruposEscritura: normalizeGroupArray(candidate['gruposEscritura']),
  };
}

export function normalizePermisos(value: unknown): PermisoRecurso[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(normalizePermisoRecurso)
    .filter((permission): permission is PermisoRecurso => permission !== null);
}

export function normalizeRol(value: Rol): Rol {
  return {
    ...value,
    permisos: normalizePermisos((value as unknown as Record<string, unknown>)['permisos']),
  };
}

function findPermission(permisos: readonly PermisoRecurso[], recurso: RecursoCRM) {
  return permisos.find((permission) => permission.recurso === recurso);
}

/** ADMINISTRAR habilita las acciones operativas, pero no inventa ADMINISTRAR. */
export function permisoPermiteAccion(
  permission: PermisoRecurso | undefined,
  accion: AccionPermiso,
): boolean {
  if (!permission) return false;
  if (permission.acciones.includes(accion)) return true;
  return accion !== 'ADMINISTRAR' && permission.acciones.includes('ADMINISTRAR');
}

export function canFromPermisos(
  permisos: readonly PermisoRecurso[],
  recurso: RecursoCRM,
  accion: AccionPermiso,
): boolean {
  return permisoPermiteAccion(findPermission(permisos, recurso), accion);
}

export function canReadGroupFromPermisos(
  permisos: readonly PermisoRecurso[],
  recurso: RecursoCRM,
  grupo: GrupoSensible,
): boolean {
  const permission = findPermission(permisos, recurso);
  return (
    permisoPermiteAccion(permission, 'LEER') &&
    permission?.gruposLectura?.includes(grupo) === true
  );
}

export function canWriteGroupFromPermisos(
  permisos: readonly PermisoRecurso[],
  recurso: RecursoCRM,
  grupo: GrupoSensible,
): boolean {
  const permission = findPermission(permisos, recurso);
  const hasWriteAction =
    permisoPermiteAccion(permission, 'CREAR') ||
    permisoPermiteAccion(permission, 'ACTUALIZAR') ||
    permisoPermiteAccion(permission, 'ELIMINAR');
  return hasWriteAction && permission?.gruposEscritura?.includes(grupo) === true;
}

export function createEmptyPermission(recurso: RecursoCRM): PermisoRecurso {
  return {
    recurso,
    acciones: [],
    alcance: 'TODO_COMPARTIDO',
    idsPermitidos: null,
    gruposLectura: [],
    gruposEscritura: [],
  };
}

export function createDefaultPermissionMatrix(): PermisoRecurso[] {
  return RECURSOS_CRM.map(createEmptyPermission);
}

export type PermissionTemplate = 'SIN_ACCESO' | 'SOLO_LECTURA' | 'OPERATIVO' | 'ADMINISTRADOR';

export function applyPermissionTemplate(template: PermissionTemplate): PermisoRecurso[] {
  const accionesByTemplate: Record<PermissionTemplate, AccionPermiso[]> = {
    SIN_ACCESO: [],
    SOLO_LECTURA: ['LEER'],
    OPERATIVO: ['LEER', 'CREAR', 'ACTUALIZAR'],
    ADMINISTRADOR: ['LEER', 'CREAR', 'ACTUALIZAR', 'ELIMINAR', 'ADMINISTRAR'],
  };
  const gruposAdministrador: GrupoSensible[] = ['FINANCIERO', 'CONTACTO_PRIVADO'];

  return RECURSOS_CRM.map((recurso) => {
    const isAdministrator = template === 'ADMINISTRADOR';
    const hasWorkGrant = RECURSOS_TRABAJO.includes(recurso);
    const acciones = isAdministrator || hasWorkGrant ? accionesByTemplate[template] : [];
    return {
      ...createEmptyPermission(recurso),
      acciones: [...acciones],
      alcance: 'TODO_COMPARTIDO',
      gruposLectura: isAdministrator ? [...gruposAdministrador] : [],
      gruposEscritura: isAdministrator ? [...gruposAdministrador] : [],
    };
  });
}
