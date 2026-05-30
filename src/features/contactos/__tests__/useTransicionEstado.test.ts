import { describe, it, expect } from 'vitest';
import { puedeTransicionar } from '../hooks/useTransicionEstado';
import type { EstadoRelacion } from '@/api/types';

// Tabla de transiciones:
// ACTIVO/INACTIVO → PROSPECTO: bloqueado siempre
// * → INACTIVO con tratos activos: bloqueado
// Idempotencia (mismo estado): permitido
// Demás: permitido

describe('puedeTransicionar', () => {
  // --- Idempotencia ---
  it('PROSPECTO → PROSPECTO: ok (idempotente)', () => {
    expect(puedeTransicionar('PROSPECTO', 'PROSPECTO', false)).toEqual({ ok: true });
  });

  it('ACTIVO → ACTIVO: ok (idempotente)', () => {
    expect(puedeTransicionar('ACTIVO', 'ACTIVO', false)).toEqual({ ok: true });
  });

  it('INACTIVO → INACTIVO: ok (idempotente)', () => {
    expect(puedeTransicionar('INACTIVO', 'INACTIVO', false)).toEqual({ ok: true });
  });

  // --- Bloqueado: * → PROSPECTO desde no-PROSPECTO ---
  it('ACTIVO → PROSPECTO: bloqueado (no se puede retrogradar a prospecto)', () => {
    const result = puedeTransicionar('ACTIVO', 'PROSPECTO', false);
    expect(result.ok).toBe(false);
    expect(result.razon).toBeDefined();
    expect(result.razon!.length).toBeGreaterThan(0);
  });

  it('INACTIVO → PROSPECTO: bloqueado (no se puede retrogradar a prospecto)', () => {
    const result = puedeTransicionar('INACTIVO', 'PROSPECTO', false);
    expect(result.ok).toBe(false);
    expect(result.razon).toBeDefined();
  });

  // --- Bloqueado: → INACTIVO con tratos activos ---
  it('PROSPECTO → INACTIVO con tratos activos: bloqueado', () => {
    const result = puedeTransicionar('PROSPECTO', 'INACTIVO', true);
    expect(result.ok).toBe(false);
    expect(result.razon).toBeDefined();
    expect(result.razon!.length).toBeGreaterThan(0);
  });

  it('ACTIVO → INACTIVO con tratos activos: bloqueado', () => {
    const result = puedeTransicionar('ACTIVO', 'INACTIVO', true);
    expect(result.ok).toBe(false);
    expect(result.razon).toBeDefined();
  });

  it('INACTIVO → INACTIVO con tratos activos: ok (idempotente aunque haya tratos)', () => {
    // Idempotencia tiene prioridad sobre el guard de tratos activos
    expect(puedeTransicionar('INACTIVO', 'INACTIVO', true)).toEqual({ ok: true });
  });

  // --- Permitido: transiciones válidas sin tratos activos ---
  it('PROSPECTO → ACTIVO sin tratos activos: ok', () => {
    expect(puedeTransicionar('PROSPECTO', 'ACTIVO', false)).toEqual({ ok: true });
  });

  it('PROSPECTO → INACTIVO sin tratos activos: ok', () => {
    expect(puedeTransicionar('PROSPECTO', 'INACTIVO', false)).toEqual({ ok: true });
  });

  it('ACTIVO → INACTIVO sin tratos activos: ok', () => {
    expect(puedeTransicionar('ACTIVO', 'INACTIVO', false)).toEqual({ ok: true });
  });

  it('INACTIVO → ACTIVO: ok', () => {
    expect(puedeTransicionar('INACTIVO', 'ACTIVO', false)).toEqual({ ok: true });
  });

  it('INACTIVO → ACTIVO con tratos activos: ok (solo INACTIVO bloquea)', () => {
    expect(puedeTransicionar('INACTIVO', 'ACTIVO', true)).toEqual({ ok: true });
  });

  // --- Verificación de la firma de tipos ---
  it('acepta los 3 valores válidos de EstadoRelacion', () => {
    const estados: EstadoRelacion[] = ['PROSPECTO', 'ACTIVO', 'INACTIVO'];
    for (const actual of estados) {
      for (const nuevo of estados) {
        const result = puedeTransicionar(actual, nuevo, false);
        expect(result).toHaveProperty('ok');
      }
    }
  });
});
