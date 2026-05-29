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
// "Trato activo" (Change 4 / W1 fix): el estado del trato se DERIVA de la columna del Kanban.
// El campo `trato.estado` NO existe en el modelo. El caller computa:
//   tieneTratosActivos = tratosDelContacto.some(t =>
//     deriveEstadoTrato(t.id, fichas, columnasTablTratos) === 'ABIERTO'
//   )
// donde fichas viene de useFichas() (queryKey ['fichas']) y columnasTablTratos
// son las columnas del primer tablero con tipoTablero === 'TRATOS'.

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
