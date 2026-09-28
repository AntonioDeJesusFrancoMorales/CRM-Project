import { describe, expect, it } from 'vitest';
import {
  isValidOptionalSocialUrl,
  isValidOptionalWebsiteUrl,
  normalizeSocialUrl,
  normalizeWebsiteUrl,
} from '../lib/empresaLinks';

describe('empresa link normalization', () => {
  it('adds HTTPS to a bare website domain', () => {
    expect(normalizeWebsiteUrl('  www.pagina.com  ')).toBe('https://www.pagina.com/');
    expect(normalizeWebsiteUrl('pagina.com')).toBe('https://pagina.com/');
  });

  it('preserves an explicit HTTP scheme', () => {
    expect(normalizeWebsiteUrl('http://pagina.com/contacto')).toBe('http://pagina.com/contacto');
  });

  it('rejects malformed and non-web website values', () => {
    expect(normalizeWebsiteUrl('ftp://pagina.com')).toBeNull();
    expect(normalizeWebsiteUrl('//pagina.com')).toBeNull();
    expect(normalizeWebsiteUrl('no-es-url')).toBeNull();
    expect(isValidOptionalWebsiteUrl('   ')).toBe(true);
    expect(isValidOptionalWebsiteUrl('https://')).toBe(false);
  });

  it('normalizes social handles to HTTPS profile URLs', () => {
    expect(normalizeSocialUrl('@qa_example_01', 'instagram')).toBe(
      'https://instagram.com/qa_example_01',
    );
    expect(normalizeSocialUrl('@qa_example_01', 'twitter')).toBe(
      'https://x.com/qa_example_01',
    );
    expect(normalizeSocialUrl('@qa_example_01', 'facebook')).toBe(
      'https://facebook.com/qa_example_01',
    );
  });

  it('accepts full social profile URLs and rejects non-web schemes', () => {
    expect(normalizeSocialUrl('https://instagram.com/empresa', 'instagram')).toBe(
      'https://instagram.com/empresa',
    );
    expect(isValidOptionalSocialUrl('ftp://instagram.com/empresa', 'instagram')).toBe(false);
    expect(isValidOptionalSocialUrl('   ', 'twitter')).toBe(true);
  });
});
