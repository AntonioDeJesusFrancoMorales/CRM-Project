import type { ApiError } from './types';

// Error tipado que envuelve la forma del contrato API:
// { status, error, message, details? }. Lanzado por apiClient cuando !res.ok.

export class HttpError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details: ApiError['details'];

  constructor(payload: ApiError) {
    super(payload.message);
    this.name = 'HttpError';
    this.status = payload.status;
    this.code = payload.error;
    this.details = payload.details;
  }
}

export function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError;
}
