const FIELD_LABELS: Record<string, string> = {
  name: 'El nombre',
  nombre: 'El nombre',
  estadoRelacion: 'El estado de relación',
  nuevoEstado: 'El nuevo estado',
  empresaId: 'La empresa',
  responsableId: 'El responsable',
  correo: 'El correo',
  email: 'El correo',
};

function normalizeKey(value: string): string {
  return value.trim().replace(/[^a-z\d]/gi, '').toLowerCase();
}

function findFieldKey(field: string, message: string): string | undefined {
  const normalizedField = normalizeKey(field);
  if (normalizedField === 'name' || normalizedField === 'nombre') return 'nombre';
  if (normalizedField === 'estadorelacion' || normalizedField === 'status') {
    return 'estadoRelacion';
  }
  if (normalizedField === 'nuevoestado') return 'nuevoEstado';
  if (normalizedField === 'empresaid') return 'empresaId';
  if (normalizedField === 'responsableid') return 'responsableId';
  if (normalizedField === 'correo' || normalizedField === 'email') return 'correo';

  const normalizedMessage = message.toLowerCase();
  if (/\b(name|nombre)\b/.test(normalizedMessage)) return 'nombre';
  if (/estado[_\s-]?relacion|nuevo[_\s-]?estado/.test(normalizedMessage)) {
    return /nuevo[_\s-]?estado/.test(normalizedMessage) ? 'nuevoEstado' : 'estadoRelacion';
  }
  return undefined;
}

const REQUIRED_MESSAGE_SOURCE =
  '(?:is\\s+required|(?:is|must|cannot)\\s+(?:not\\s+)?be\\s+(?:blank|empty)|requerid[oa]?|obligatori[oa]?)';
const REQUIRED_PATTERN = new RegExp(REQUIRED_MESSAGE_SOURCE, 'i');

/**
 * Localizes the backend's common required-field messages without discarding
 * additional server-provided context.
 */
export function localizeApiErrorMessage(message: string, field = ''): string {
  const fieldKey = findFieldKey(field, message);
  if (!fieldKey || !REQUIRED_PATTERN.test(message) && !REQUIRED_PATTERN.test(field)) {
    return message;
  }

  const label = FIELD_LABELS[fieldKey];
  if (!label) return message;

  const replacement = `${label} es requerido`;
  const fieldPattern =
    fieldKey === 'nombre'
      ? new RegExp(`\\b(name|nombre)\\s+${REQUIRED_MESSAGE_SOURCE}`, 'i')
      : fieldKey === 'estadoRelacion'
        ? new RegExp(`\\bestado[_\\s-]?relacion\\s+${REQUIRED_MESSAGE_SOURCE}`, 'i')
        : fieldKey === 'nuevoEstado'
          ? new RegExp(`\\bnuevo[_\\s-]?estado\\s+${REQUIRED_MESSAGE_SOURCE}`, 'i')
          : undefined;

  if (fieldPattern?.test(message)) return message.replace(fieldPattern, replacement);
  return replacement;
}
