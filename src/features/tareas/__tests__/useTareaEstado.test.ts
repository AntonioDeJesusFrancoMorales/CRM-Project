// F5.1 + F5.2 — useTareaEstado: funciones puras de localStorage para estado client-only.
// Estado no existe en el back; se persiste en localStorage con clave tarea-estado-${id}.
// Valor por defecto: 'pendiente'.

import { describe, it, expect, beforeEach } from 'vitest';
import { getTareaEstado, setTareaEstado, clearTareaEstado } from '../hooks/useTareaEstado';

const ID = 'e1111111-eeee-1111-eeee-111111111111';
const KEY = `tarea-estado-${ID}`;

describe('useTareaEstado', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('getTareaEstado devuelve "pendiente" cuando no hay valor en localStorage', () => {
    expect(getTareaEstado(ID)).toBe('pendiente');
  });

  it('setTareaEstado persiste el estado en localStorage', () => {
    setTareaEstado(ID, 'en_progreso');
    expect(localStorage.getItem(KEY)).toBe('en_progreso');
  });

  it('getTareaEstado devuelve el valor persistido', () => {
    setTareaEstado(ID, 'completada');
    expect(getTareaEstado(ID)).toBe('completada');
  });

  it('clearTareaEstado elimina la clave de localStorage', () => {
    setTareaEstado(ID, 'completada');
    clearTareaEstado(ID);
    expect(localStorage.getItem(KEY)).toBeNull();
    // Después de clear, getTareaEstado vuelve al valor por defecto
    expect(getTareaEstado(ID)).toBe('pendiente');
  });
});
