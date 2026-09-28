import type { EmpresaCreateInput } from '../schemas/empresa.schema';
import {
  normalizeSocialUrl,
  normalizeWebsiteUrl,
  type EmpresaSocialNetwork,
} from './empresaLinks';

const socialFields: Array<{
  field: 'facebook' | 'instagram' | 'twitter';
  network: EmpresaSocialNetwork;
}> = [
  { field: 'facebook', network: 'facebook' },
  { field: 'instagram', network: 'instagram' },
  { field: 'twitter', network: 'twitter' },
];

const textFields = [
  'nombre',
  'sector',
  'telefono',
  'paginaWeb',
  'facebook',
  'instagram',
  'twitter',
  'notas',
] as const;

export function normalizeEmpresaValues(
  input: Partial<EmpresaCreateInput>,
): Partial<EmpresaCreateInput> {
  const normalized: Record<string, unknown> = { ...input };

  for (const field of textFields) {
    const value = normalized[field];
    if (typeof value === 'string') normalized[field] = value.trim();
  }

  if (typeof normalized.paginaWeb === 'string' && normalized.paginaWeb) {
    normalized.paginaWeb = normalizeWebsiteUrl(normalized.paginaWeb) ?? normalized.paginaWeb;
  }

  for (const { field, network } of socialFields) {
    const value = normalized[field];
    if (typeof value === 'string' && value) {
      normalized[field] = normalizeSocialUrl(value, network) ?? value;
    }
  }

  return normalized as Partial<EmpresaCreateInput>;
}
