// Contexto de guarda click-vs-arrastre para el Kanban.
//
// Problema: con @dnd-kit, al SOLTAR una ficha tras arrastrarla, el navegador dispara
// igual un evento `click` sobre la tarjeta → navegaba al detalle sin que el usuario
// quisiera. El enfoque por coordenadas (pointerdown vs click) es frágil con el
// pointer-capture de dnd-kit.
//
// Solución determinística: el board levanta esta bandera en `onDragEnd` (siempre se
// dispara tras un arrastre real, que requiere superar el activationConstraint de 5px).
// El click inmediato posterior al drop la consulta y se cancela. La bandera vive a nivel
// del board (ref estable), así sobrevive a re-renders/remounts de las tarjetas.

import { createContext, useContext, type MutableRefObject } from 'react';

/** Ref compartido: true si recién terminó un arrastre (para cancelar el click post-drop). */
export const ArrastreRecienteContext = createContext<MutableRefObject<boolean> | null>(null);

export function useArrastreReciente(): MutableRefObject<boolean> | null {
  return useContext(ArrastreRecienteContext);
}
