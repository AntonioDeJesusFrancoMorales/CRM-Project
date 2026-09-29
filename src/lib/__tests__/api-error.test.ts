import { describe, expect, it } from 'vitest';
import { localizeApiErrorMessage } from '../api-error';

describe('localizeApiErrorMessage', () => {
  it('localizes the backend phrase "must not be blank"', () => {
    expect(localizeApiErrorMessage('name must not be blank')).toBe('El nombre es requerido');
  });
});
