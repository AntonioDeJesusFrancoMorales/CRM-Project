// useTransicionEstado — función pura de validación de transiciones de estadoRelacion.
// No es un hook de React (no usa hooks internos). El nombre sigue la convención
// de carpeta de hooks dado que pertenece al dominio de contactos.
//
// Reglas:
//   ACTIVO → PROSPECTO  : bloqueado
//   INACTIVO → PROSPECTO: bloqueado
//   * → INACTIVO con tieneTratosActivos: bloqueado
//   Demás (incluyendo idempotencia): permitido
//
// "Trato activo" = trato.estado === 'abierto' (enum real del front).
// El caller computa: tieneTratosActivos = tratosDelContacto.some(t => t.estado === 'abierto')

import type { EstadoRelacion } from '@/api/types';

export interface TransicionResult {
  ok: boolean;
  razon?: string;
}

export function puedeTransicionar(
  actual: EstadoRelacion,
  nuevo: EstadoRelacion,
  tieneTratosActivos: boolean,
): TransicionResult {
  // Idempotencia — siempre permitido
  if (actual === nuevo) return { ok: true };

  // Bloquear retrogradar a PROSPECTO desde ACTIVO o INACTIVO
  if (nuevo === 'PROSPECTO') {
    return {
      ok: false,
      razon: 'No se puede retrogradar un contacto a Prospecto',
    };
  }

  // Bloquear pasar a INACTIVO si tiene tratos con estado 'abierto'
  if (nuevo === 'INACTIVO' && tieneTratosActivos) {
    return {
      ok: false,
      razon: 'No se puede inactivar un contacto con tratos activos',
    };
  }

  return { ok: true };
}
