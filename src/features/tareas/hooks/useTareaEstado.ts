// useTareaEstado — funciones puras para persistir el estado de una tarea en localStorage.
// El estado es client-only: el back no tiene campo estado en Tarea (ADR-050).
// Clave de localStorage: tarea-estado-${id}
// Valor por defecto: 'pendiente'

import type { EstadoTareaLocal } from '@/api/types';

const storageKey = (id: string) => `tarea-estado-${id}`;

export function getTareaEstado(id: string): EstadoTareaLocal {
  return (localStorage.getItem(storageKey(id)) as EstadoTareaLocal | null) ?? 'pendiente';
}

export function setTareaEstado(id: string, estado: EstadoTareaLocal): void {
  localStorage.setItem(storageKey(id), estado);
}

export function clearTareaEstado(id: string): void {
  localStorage.removeItem(storageKey(id));
}
