// Convierte strings vacíos a null en un objeto plano. Útil antes de enviar
// payloads donde el backend espera null en vez de "" para campos opcionales.

export function stringsToNulls<T extends Record<string, unknown>>(input: T): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    result[key] = value === '' ? null : value;
  }
  return result as T;
}

// Convierte null a string vacío en valores de form (defaultValues para edit).
export function nullsToStrings<T extends Record<string, unknown>>(input: T): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    result[key] = value === null ? '' : value;
  }
  return result as T;
}
