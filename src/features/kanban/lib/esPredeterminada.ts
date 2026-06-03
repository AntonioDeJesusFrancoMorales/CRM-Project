// Función pura: indica si una columna del tablero es de tipo PREDETERMINADA.
// Cruza el id de la ColumnaTablero con el catálogo (Columna[]) para derivar tipoColumna.
// ColumnaTablero NO expone tipoColumna directamente; la fuente de verdad es el catálogo.
//
// Regla de negocio: las columnas PREDETERMINADA no pueden borrarse; las PERSONALIZADA sí.
// Si el id no está en el catálogo → se trata como PERSONALIZADA (borrable) por defecto seguro.

import type { Columna } from '../schemas/columna.schema';

/**
 * Devuelve `true` si la columna identificada por `columnaId` es de tipo PREDETERMINADA
 * en el catálogo. Devuelve `false` si es PERSONALIZADA o si el id no está en el catálogo.
 */
export function esPredeterminada(columnaId: string, catalogo: Columna[]): boolean {
  const entrada = catalogo.find((c) => c.id === columnaId);
  if (!entrada) return false;
  return entrada.tipoColumna === 'PREDETERMINADA';
}
