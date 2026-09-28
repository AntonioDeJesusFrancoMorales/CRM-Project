export type EmpresaSocialNetwork = 'facebook' | 'instagram' | 'twitter';

const socialProfileHosts: Record<EmpresaSocialNetwork, string> = {
  facebook: 'facebook.com',
  instagram: 'instagram.com',
  twitter: 'x.com',
};

const schemePattern = /^[a-z][a-z\d+.-]*:/i;
const hostPortPattern = /^[^/\s:]+:\d+(?:[/?#]|$)/;
const handlePattern = /^[a-z\d._-]{1,100}$/i;

/** Returns an HTTP(S) URL, adding HTTPS only when the input has no scheme. */
export function normalizeWebsiteUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith('//')) return null;

  const hasExplicitWebScheme = /^https?:\/\//i.test(trimmed);
  const hasNonWebScheme = schemePattern.test(trimmed) && !hostPortPattern.test(trimmed);

  if (hasNonWebScheme && !hasExplicitWebScheme) return null;

  const candidate = hasExplicitWebScheme ? trimmed : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return null;
  }

  if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname) return null;
  if (parsed.hostname === '.' || parsed.hostname === '..' || parsed.hostname.includes('..')) {
    return null;
  }
  if (
    !hasExplicitWebScheme &&
    !parsed.hostname.includes('.') &&
    parsed.hostname !== 'localhost' &&
    !/^\d{1,3}(?:\.\d{1,3}){3}$/.test(parsed.hostname)
  ) {
    return null;
  }

  return parsed.href;
}

export function isValidOptionalWebsiteUrl(value: string): boolean {
  return value.trim() === '' || normalizeWebsiteUrl(value) !== null;
}

/** Converts a social handle to a canonical profile URL and validates full web URLs. */
export function normalizeSocialUrl(
  value: string,
  network: EmpresaSocialNetwork,
): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const handle = trimmed.startsWith('@') ? trimmed.slice(1) : trimmed;
  const isHandle = trimmed.startsWith('@') || /^[a-z\d_-]+$/i.test(trimmed);

  if (isHandle && handlePattern.test(handle)) {
    return `https://${socialProfileHosts[network]}/${handle}`;
  }

  return normalizeWebsiteUrl(trimmed);
}

export function isValidOptionalSocialUrl(
  value: string,
  network: EmpresaSocialNetwork,
): boolean {
  return value.trim() === '' || normalizeSocialUrl(value, network) !== null;
}

export function displayWebsiteUrl(value: string): string {
  return value.trim().replace(/^https?:\/\//i, '').replace(/\/$/, '');
}
