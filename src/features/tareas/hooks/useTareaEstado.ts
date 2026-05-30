// useTareaEstado — estado client-only de una tarea, persistido en localStorage.
// El back no tiene campo estado en Tarea (ADR-050). Clave: tarea-estado-${id}.
// Valor por defecto: 'pendiente'.
//
// Las funciones puras (get/set/clear) siguen disponibles para tests y lecturas one-shot.
// El hook useTareaEstado expone el estado de forma REACTIVA vía useSyncExternalStore:
// cualquier componente que lo use (badge en tabla, badge en detalle, menú) se entera
// del cambio y re-renderiza, aunque el cambio venga de otra instancia.

import { useCallback, useSyncExternalStore } from 'react';
import type { EstadoTareaLocal } from '@/api/types';

const storageKey = (id: string) => `tarea-estado-${id}`;

const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  // 'storage' cubre cambios hechos en otra pestaña.
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

export function getTareaEstado(id: string): EstadoTareaLocal {
  return (localStorage.getItem(storageKey(id)) as EstadoTareaLocal | null) ?? 'pendiente';
}

export function setTareaEstado(id: string, estado: EstadoTareaLocal): void {
  localStorage.setItem(storageKey(id), estado);
  emit();
}

export function clearTareaEstado(id: string): void {
  localStorage.removeItem(storageKey(id));
  emit();
}

/**
 * Estado reactivo de una tarea. Devuelve el estado actual y un setter que persiste
 * en localStorage y notifica a todas las instancias suscritas para el mismo id.
 */
export function useTareaEstado(
  id: string,
): readonly [EstadoTareaLocal, (estado: EstadoTareaLocal) => void] {
  const estado = useSyncExternalStore(
    subscribe,
    () => getTareaEstado(id),
    () => 'pendiente' as EstadoTareaLocal,
  );

  const setEstado = useCallback(
    (nuevo: EstadoTareaLocal) => setTareaEstado(id, nuevo),
    [id],
  );

  return [estado, setEstado] as const;
}
