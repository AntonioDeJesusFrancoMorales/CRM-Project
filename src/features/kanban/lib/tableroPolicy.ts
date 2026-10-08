import type { Tablero, TipoTablero } from '../schemas/tablero.schema';

/**
 * Interim frontend identity for the two base boards.
 *
 * The backend does not expose esBase/protegido yet, so deletion protection is derived from
 * immutable response data only. When that backend flag exists, replace this policy rather than
 * using mutable names as identity.
 */
export type TableroProtectionRecord = Pick<Tablero, 'id' | 'tipoTablero' | 'creadoEn'>;

const SUPPORTED_BOARD_TYPES: readonly TipoTablero[] = ['TAREAS', 'TRATOS'];

function compareAge(left: TableroProtectionRecord, right: TableroProtectionRecord): number {
  const leftTime = Date.parse(left.creadoEn);
  const rightTime = Date.parse(right.creadoEn);

  if (Number.isFinite(leftTime) && Number.isFinite(rightTime) && leftTime !== rightTime) {
    return leftTime - rightTime;
  }

  if (Number.isFinite(leftTime) !== Number.isFinite(rightTime)) {
    return Number.isFinite(leftTime) ? -1 : 1;
  }

  if (left.creadoEn !== right.creadoEn) {
    return left.creadoEn < right.creadoEn ? -1 : 1;
  }

  // Tie-break by immutable id so the protected board is deterministic.
  if (left.id === right.id) return 0;
  return left.id < right.id ? -1 : 1;
}

export function getBaseTableroIds(
  tableros: readonly TableroProtectionRecord[],
): ReadonlySet<string> {
  const baseIds = new Set<string>();

  for (const tipoTablero of SUPPORTED_BOARD_TYPES) {
    const oldest = tableros
      .filter((tablero) => tablero.tipoTablero === tipoTablero)
      .reduce<
        TableroProtectionRecord | undefined
      >((currentOldest, tablero) => (!currentOldest || compareAge(tablero, currentOldest) < 0 ? tablero : currentOldest), undefined);

    if (oldest) baseIds.add(oldest.id);
  }

  return baseIds;
}

export function canDeleteTablero(
  tablero: Pick<Tablero, 'id'>,
  baseTableroIds: ReadonlySet<string>,
): boolean {
  return !baseTableroIds.has(tablero.id);
}
