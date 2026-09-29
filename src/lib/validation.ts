import { z } from 'zod';

export function requiredTrimmedName(
  max: number,
  maxMessage?: string,
  requiredMessage = 'El nombre es requerido',
) {
  return z
    .string()
    .trim()
    .min(1, { message: requiredMessage })
    .max(max, { message: maxMessage ?? `El nombre no puede superar ${max} caracteres` });
}
