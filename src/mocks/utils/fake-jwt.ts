// Genera un JWT falso pero estructuralmente válido (header.payload.signature).
// La signature NO se verifica criptográficamente (es un mock). El payload sí
// codifica datos reales para que jwt.io pueda inspeccionarlo en debug.

import type { Usuario } from '@/api/types';

interface JwtPayload {
  sub: string;
  exp: number;
  iat: number;
  nombre: string;
  rol_sistema: Usuario['rol_sistema'];
}

function base64UrlEncode(input: string): string {
  return btoa(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function fakeJwt(user: Pick<Usuario, 'id' | 'nombre' | 'rol_sistema'>): string {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload: JwtPayload = {
    sub: user.id,
    iat: now,
    exp: now + 8 * 60 * 60, // 8 horas
    nombre: user.nombre,
    rol_sistema: user.rol_sistema,
  };
  const signature = 'mock-signature-not-verified';
  return `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(payload))}.${signature}`;
}

export function decodeFakeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    if (!payload) return null;
    const padded = payload.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(padded)) as JwtPayload;
  } catch {
    return null;
  }
}
