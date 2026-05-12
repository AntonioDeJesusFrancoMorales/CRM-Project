// Helpers para devolver errores en la forma del contrato API.

import { HttpResponse } from 'msw';
import type { ApiError } from '@/api/types';

export function apiError(
  status: number,
  error: string,
  message: string,
  details?: ApiError['details'],
): Response {
  const body: ApiError = { status, error, message, ...(details ? { details } : {}) };
  return HttpResponse.json(body, { status });
}

export const errors = {
  unauthorized: (message = 'No autorizado'): Response =>
    apiError(401, 'UNAUTHORIZED', message),
  forbidden: (message = 'No tienes permisos para esta acción'): Response =>
    apiError(403, 'FORBIDDEN', message),
  notFound: (message = 'Recurso no encontrado'): Response =>
    apiError(404, 'NOT_FOUND', message),
  validation: (details: ApiError['details'], message = 'Datos invalidos'): Response =>
    apiError(422, 'VALIDATION_ERROR', message, details),
  server: (message = 'Error interno del servidor'): Response =>
    apiError(500, 'INTERNAL_SERVER_ERROR', message),
};
