import type { Contacto } from '@/api/types';
import { localizeApiErrorMessage } from '@/lib/api-error';
import type { ContactoCreateInput } from '../schemas/contacto.schema';

export const DUPLICATE_CONTACTO_NAME_MESSAGE = 'Ya existe un contacto con este nombre.';

type ContactoFormField = keyof ContactoCreateInput;

const fieldAliases: Record<string, ContactoFormField> = {
  nombre: 'nombre',
  name: 'nombre',
  correo: 'correo',
  email: 'correo',
  mail: 'correo',
  telefono: 'telefono',
  phone: 'telefono',
  empresaid: 'empresaId',
  estadorelacion: 'estadoRelacion',
  status: 'estadoRelacion',
  cargo: 'cargo',
  comonosconocio: 'comoNosConocio',
  responsableid: 'responsableId',
};

const visibleFields = new Set<ContactoFormField>([
  'nombre',
  'correo',
  'telefono',
  'empresaId',
  'estadoRelacion',
  'cargo',
  'comoNosConocio',
  'responsableId',
]);

export interface MappedContactoServerError {
  field?: ContactoFormField;
  message: string;
}

function normalizeFieldKey(field: string): string {
  return field.trim().replace(/[^a-z\d]/gi, '').toLowerCase();
}

function resolveField(field: string, message: string): ContactoFormField | undefined {
  const directField = fieldAliases[normalizeFieldKey(field)];
  if (directField) return directField;

  const normalizedMessage = message.toLowerCase();
  if (/\b(name|nombre)\b/.test(normalizedMessage)) return 'nombre';
  if (/\b(email|correo|mail)\b/.test(normalizedMessage)) return 'correo';
  if (/telefono|phone|telephone/.test(normalizedMessage)) return 'telefono';
  if (/estado[_\s-]?relacion|status/.test(normalizedMessage)) return 'estadoRelacion';
  return undefined;
}

export function mapContactoServerError(error: {
  field: string;
  message: string;
}): MappedContactoServerError {
  const field = resolveField(error.field, error.message);
  const message = localizeApiErrorMessage(error.message, error.field);

  if (field && visibleFields.has(field)) return { field, message };
  return { message };
}

export function hasDuplicateContactoName(
  contactos: Contacto[] | undefined,
  name: string,
  currentContactoId?: string,
): boolean {
  const normalizedName = name.trim().toLowerCase();
  if (!normalizedName || !contactos) return false;

  return contactos.some(
    (contacto) =>
      contacto.id !== currentContactoId && contacto.nombre.trim().toLowerCase() === normalizedName,
  );
}
