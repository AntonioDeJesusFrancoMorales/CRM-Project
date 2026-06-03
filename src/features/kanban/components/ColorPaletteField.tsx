// ColorPaletteField — campo presentacional de selección de color por paleta.
// Renderiza swatches (círculos) para cada color de COLUMN_PALETTE.
// Controlado: recibe value/onChange. Accesible: aria-label por color, indicación de seleccionado.
// legacyColor: si el color actual no está en COLUMN_PALETTE, se muestra como swatch extra
// (rotulado "Color actual") para preservarlo sin perder la selección al editar.

import { cn } from '@/lib/utils';
import { COLUMN_PALETTE } from '../lib/columnPalette';
import type { PaletteColor } from '../lib/columnPalette';

// Nombres legibles en español para aria-label de accesibilidad
const NOMBRE_COLOR: Record<string, string> = {
  '#94a3b8': 'Gris pizarra',
  '#60a5fa': 'Azul',
  '#34d399': 'Verde esmeralda',
  '#fbbf24': 'Ámbar',
  '#f87171': 'Rojo',
  '#a78bfa': 'Violeta',
  '#fb923c': 'Naranja',
  '#38bdf8': 'Celeste',
  '#4ade80': 'Verde',
  '#f472b6': 'Rosa',
};

interface ColorPaletteFieldProps {
  value: string | null | undefined;
  onChange: (color: string) => void;
  /** Deshabilita la interacción (p.ej. mientras se envía el formulario). */
  disabled?: boolean;
  /** Id del campo, para asociar con un label externo si hace falta. */
  id?: string;
  /**
   * Color legacy (opcional): si está fuera de COLUMN_PALETTE se muestra como swatch
   * extra "Color actual" para que el usuario pueda mantenerlo o elegir otro de la paleta.
   * Útil en edición de columnas existentes con colores no estándar.
   */
  legacyColor?: string;
}

// Helper interno de chequeo en paleta
function esColorPaleta(color: string): color is PaletteColor {
  return (COLUMN_PALETTE as readonly string[]).includes(color);
}

export function ColorPaletteField({ value, onChange, disabled, id, legacyColor }: ColorPaletteFieldProps) {
  // Mostrar swatch legacy si legacyColor es hex válido y NO está en la paleta
  const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;
  const mostrarLegacy =
    legacyColor !== undefined &&
    legacyColor !== null &&
    HEX_REGEX.test(legacyColor) &&
    !esColorPaleta(legacyColor);

  return (
    <div
      id={id}
      role="group"
      aria-label="Paleta de colores"
      className="flex flex-wrap gap-2"
    >
      {/* Swatch extra para color legacy (fuera de paleta) */}
      {mostrarLegacy && (
        <button
          key={`legacy-${legacyColor}`}
          type="button"
          aria-label="Color actual"
          aria-pressed={value === legacyColor}
          disabled={disabled}
          onClick={() => onChange(legacyColor!)}
          className={cn(
            'h-7 w-7 rounded-full border-2 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            value === legacyColor
              ? 'scale-110 border-foreground shadow-md'
              : 'border-transparent hover:scale-105 hover:border-muted-foreground/50',
            disabled && 'cursor-not-allowed opacity-50',
          )}
          style={{ backgroundColor: legacyColor }}
          title="Color actual (personalizado)"
        >
          {value === legacyColor && (
            <span
              className="flex h-full w-full items-center justify-center text-white"
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3 w-3"
              >
                <polyline points="2,6 5,9 10,3" />
              </svg>
            </span>
          )}
        </button>
      )}

      {COLUMN_PALETTE.map((color) => {
        const seleccionado = value === color;
        const nombre = NOMBRE_COLOR[color] ?? color;

        return (
          <button
            key={color}
            type="button"
            aria-label={nombre}
            aria-pressed={seleccionado}
            disabled={disabled}
            onClick={() => onChange(color)}
            className={cn(
              'h-7 w-7 rounded-full border-2 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              seleccionado
                ? 'scale-110 border-foreground shadow-md'
                : 'border-transparent hover:scale-105 hover:border-muted-foreground/50',
              disabled && 'cursor-not-allowed opacity-50',
            )}
            style={{ backgroundColor: color }}
          >
            {/* Indicador visual de seleccionado: check blanco interno */}
            {seleccionado && (
              <span
                className="flex h-full w-full items-center justify-center text-white"
                aria-hidden="true"
              >
                <svg
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3 w-3"
                >
                  <polyline points="2,6 5,9 10,3" />
                </svg>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
