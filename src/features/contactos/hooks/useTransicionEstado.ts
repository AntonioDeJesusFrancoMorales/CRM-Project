// useTransicionEstado — función pura de validación de transiciones de estadoRelacion.
// No es un hook de React (no usa hooks internos). El nombre sigue la convención
// de carpeta de hooks dado que pertenece al dominio de contactos.
//
// Reglas:
//   ACTIVO → PROSPECTO  : bloqueado
//   INACTIVO → PROSPECTO: bloqueado
//   Demás (incluyendo idempotencia): permitido
//
// REGLA SUSPENDIDA (2026-06-09): "no inactivar contacto con tratos activos".
// El back refactorizó el modelo ("simplify board column relation") y eliminó el
// estado tipado del trato (ABIERTO/GANADO/PERDIDO): ya no viene en la columna ni
// en TratoResponse. No hay forma fiable de derivar "trato activo", así que el
// guard de INACTIVO se suspende hasta acordar el nuevo modelo con el back.
// El parámetro tieneTratosActivos se conserva (firma + cableado intactos) para
// restaurar la regla con un solo cambio cuando el contrato esté definido.

import type { EstadoRelacion } from '@/api/types';

export interface TransicionResult {
  ok: boolean;
  razon?: string;
}

export function puedeTransicionar(
  actual: EstadoRelacion,
  nuevo: EstadoRelacion,
  _tieneTratosActivos: boolean,
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

  // Guard de INACTIVO suspendido — ver nota de cabecera (REGLA SUSPENDIDA).
  // Para restaurar: `if (nuevo === 'INACTIVO' && _tieneTratosActivos) { ... }`

  return { ok: true };
}
