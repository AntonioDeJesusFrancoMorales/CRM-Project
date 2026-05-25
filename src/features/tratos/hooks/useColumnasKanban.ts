// useColumnasKanban — seam de columnas del tablero kanban (ADR-059).
// v1: columnas hardcodeadas del enum EstadoTrato.
// La interfaz ColumnaKanban permite futura configuración por instancia sin reescritura.

import type { EstadoTrato } from '@/api/types';

export interface ColumnaKanban {
  id: EstadoTrato;
  label: string;
  color: string;        // token Tailwind: 'blue' | 'green' | 'red'
  esTerminal: boolean;
  requiereModal: boolean;
}

const COLUMNAS: ColumnaKanban[] = [
  {
    id: 'abierto',
    label: 'Abierto',
    color: 'blue',
    esTerminal: false,
    requiereModal: false,
  },
  {
    id: 'ganado',
    label: 'Ganado',
    color: 'green',
    esTerminal: true,
    requiereModal: false,
  },
  {
    id: 'perdido',
    label: 'Perdido',
    color: 'red',
    esTerminal: true,
    requiereModal: true,
  },
];

export function useColumnasKanban(): ColumnaKanban[] {
  return COLUMNAS;
}
