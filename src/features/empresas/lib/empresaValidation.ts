import type { Empresa } from '@/api/types';
import type { EmpresaCreateInput } from '../schemas/empresa.schema';
import { localizeApiErrorMessage } from '@/lib/api-error';

export const DUPLICATE_EMPRESA_NAME_MESSAGE = 'Ya existe una empresa con este nombre.';

type EmpresaFormField = keyof EmpresaCreateInput;
type EmpresaServerField = EmpresaFormField | 'responsableId' | 'creadoPor';

const fieldAliases: Record<string, EmpresaServerField> = {
  nombre: 'nombre',
  name: 'nombre',
  sector: 'sector',
  telefono: 'telefono',
  phone: 'telefono',
  telephone: 'telefono',
  paginaweb: 'paginaWeb',
  website: 'paginaWeb',
  webpage: 'paginaWeb',
  web: 'paginaWeb',
  facebook: 'facebook',
  instagram: 'instagram',
  twitter: 'twitter',
  twitterx: 'twitter',
  estadorelacion: 'estadoRelacion',
  status: 'estadoRelacion',
  notas: 'notas',
  notes: 'notas',
  responsableid: 'responsableId',
  creadopor: 'creadoPor',
};

const fieldLabels: Partial<Record<EmpresaServerField, string>> = {
  paginaWeb: 'Página web',
  responsableId: 'Responsable',
  creadoPor: 'Creado por',
};

const visibleFields = new Set<EmpresaServerField>([
  'nombre',
  'sector',
  'telefono',
  'paginaWeb',
  'facebook',
  'instagram',
  'twitter',
  'estadoRelacion',
  'notas',
]);

export interface MappedEmpresaServerError {
  field?: EmpresaFormField;
  message: string;
}

function normalizeFieldKey(field: string): string {
  return field
    .trim()
    .replace(/[^a-z\d]/gi, '')
    .toLowerCase();
}

function resolveField(field: string, message: string): EmpresaServerField | undefined {
  const directField = fieldAliases[normalizeFieldKey(field)];
  if (directField) return directField;

  const normalizedMessage = message.toLowerCase();
  if (/\b(name|nombre)\b/.test(normalizedMessage)) return 'nombre';
  if (/(pagina[_\s]?web|website|\burl\b|\buri\b)/.test(normalizedMessage)) {
    return 'paginaWeb';
  }

  return undefined;
}

function isInvalidWebsiteMessage(field: EmpresaServerField | undefined, message: string): boolean {
  const normalizedMessage = message.toLowerCase();
  const refersToWebsite =
    field === 'paginaWeb' || /(pagina[_\s]?web|website|\burl\b|\buri\b)/.test(normalizedMessage);
  return refersToWebsite && /url|uri|invalid|inválid|format|formato|valid/.test(normalizedMessage);
}

function localizeServerMessage(field: EmpresaServerField | undefined, message: string): string {
  const localizedMessage = localizeApiErrorMessage(message, field ?? '');
  if (localizedMessage !== message) return localizedMessage;
  if (isInvalidWebsiteMessage(field, message)) {
    return 'La página web debe ser una URL válida.';
  }

  return message.replace(/pagina[_\s]?web/gi, 'Página web');
}

export function mapEmpresaServerError(error: {
  field: string;
  message: string;
}): MappedEmpresaServerError {
  const field = resolveField(error.field, error.message);
  const message = localizeServerMessage(field, error.message);

  if (field && visibleFields.has(field)) {
    return { field: field as EmpresaFormField, message };
  }

  const label = field ? fieldLabels[field] : undefined;
  return { message: label ? `${label}: ${message}` : message };
}

export function hasDuplicateEmpresaName(
  empresas: Empresa[] | undefined,
  name: string,
  currentEmpresaId?: string,
): boolean {
  const normalizedName = name.trim().toLowerCase();
  if (!normalizedName || !empresas) return false;

  return empresas.some(
    (empresa) =>
      empresa.id !== currentEmpresaId && empresa.nombre.trim().toLowerCase() === normalizedName,
  );
}
