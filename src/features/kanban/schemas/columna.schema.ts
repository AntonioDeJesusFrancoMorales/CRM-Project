// Schema Zod para Columna del catálogo — alineado a ColumnaResponse.java.
// Es la entidad del catálogo (independiente del tablero); distinta de ColumnaTableroDto.

import { z } from 'zod';
import { requiredTrimmedName } from '@/lib/validation';
import { tipoTablero, tipoColumna } from './tablero.schema';
import { COLUMN_PALETTE } from '../lib/columnPalette';

// ---------------------------------------------------------------------------
// ColumnaResponse — shape del back para el catálogo de columnas
// Reutiliza tipoTablero y tipoColumna de tablero.schema
// ---------------------------------------------------------------------------

export const columnaSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  color: z.string(),
  tipoTablero,
  tipoColumna,
});

export type Columna = z.infer<typeof columnaSchema>;

// ---------------------------------------------------------------------------
// CreateColumnaRequest — payload para POST /columnas/create
// Fuente: CreateColumnaRequest.java. El back no declara @NotNull en el DTO
// (la validación vive en el dominio Columna.create); modelamos los campos
// significativos como requeridos. superUsuarioId se OMITE (opcional, derivado).
// ---------------------------------------------------------------------------

// Regex hex puro — acepta cualquier color #RRGGBB como fallback de servidor
const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;

export const columnaCreateSchema = z.object({
  nombre: requiredTrimmedName(
    80,
    'El nombre no puede superar los 80 caracteres',
    'El nombre es obligatorio',
  ),
  color: z
    .string()
    .regex(HEX_REGEX, 'El color debe ser un valor hexadecimal válido (#RRGGBB)')
    .refine(
      (v) => (COLUMN_PALETTE as readonly string[]).includes(v),
      'El color debe ser uno de los colores predefinidos de la paleta',
    ),
  tipoTablero,
  tipoColumna,
});

export type ColumnaCreateInput = z.infer<typeof columnaCreateSchema>;

// ---------------------------------------------------------------------------
// EditColumnaRequest — payload para PUT /columnas/edit?id=
// Fuente: EditColumnaRequest.java. Todos los campos son opcionales (edición
// parcial); el back no impone restricciones de anotación.
// ---------------------------------------------------------------------------

export const columnaEditSchema = z.object({
  nombre: requiredTrimmedName(
    80,
    'El nombre no puede superar los 80 caracteres',
    'El nombre es obligatorio',
  ).optional(),
  // color acepta cualquier hex #RRGGBB válido — NO restringe a la paleta.
  // Columnas existentes pueden tener colores legacy fuera de la paleta;
  // la restricción de paleta se aplica solo en la UI (ColorPaletteField), no en el schema.
  color: z
    .string()
    .regex(HEX_REGEX, 'El color debe ser un valor hexadecimal válido (#RRGGBB)')
    .optional(),
  tipoTablero: tipoTablero.optional(),
  tipoColumna: tipoColumna.optional(),
});

export type ColumnaEditInput = z.infer<typeof columnaEditSchema>;

// ---------------------------------------------------------------------------
// asignarColumnaSchema — input del form para asignar columna a tablero.
// Refleja AsignarColumnaRequest.java: limiteWip, nota (opcional), totalValorEstimado.
// El back DROPEÓ estadoTrato/estadoTarea por columna, así que el form ya no los pide.
// tipoTablero queda como discriminador del form (NO se envía al back).
// ---------------------------------------------------------------------------

export const asignarColumnaSchema = z.object({
  tipoTablero,
  limiteWip: z.number().int().min(1, 'El límite WIP debe ser al menos 1'),
  totalValorEstimado: z.number().min(0),
});

export type AsignarColumnaFormValues = z.infer<typeof asignarColumnaSchema>;

// ---------------------------------------------------------------------------
// columnaNuevaSchema — form completo "Nueva columna".
// Combina campos de creación (nombre + color) con los de asignación (limiteWip,
// totalValorEstimado). El discriminador tipoTablero es parte del form pero NO se
// envía al back. Sin estado: el back ya no lo modela por columna.
// ---------------------------------------------------------------------------

export const columnaNuevaSchema = z.object({
  tipoTablero,
  nombre: requiredTrimmedName(
    80,
    'El nombre no puede superar los 80 caracteres',
    'El nombre es obligatorio',
  ),
  color: z
    .string()
    .regex(
      /^#[0-9A-Fa-f]{6}$/,
      'El color debe ser un valor hexadecimal válido (#RRGGBB)',
    )
    .refine(
      (v) => (COLUMN_PALETTE as readonly string[]).includes(v),
      'El color debe ser uno de los colores predefinidos de la paleta',
    ),
  limiteWip: z.number().int().min(1, 'El límite WIP debe ser al menos 1'),
  totalValorEstimado: z.number().min(0),
});

export type ColumnaNuevaFormValues = z.infer<typeof columnaNuevaSchema>;
