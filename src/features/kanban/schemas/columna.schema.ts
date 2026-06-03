// Schema Zod para Columna del catálogo — alineado a ColumnaResponse.java.
// Es la entidad del catálogo (independiente del tablero); distinta de ColumnaTableroDto.

import { z } from 'zod';
import { tipoTablero, tipoColumna, estadoTrato, estadoTarea } from './tablero.schema';
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
  nombre: z
    .string()
    .min(1, 'El nombre es obligatorio')
    .max(80, 'El nombre no puede superar los 80 caracteres'),
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
  nombre: z.string().min(1, 'El nombre es obligatorio').max(80, 'El nombre no puede superar los 80 caracteres').optional(),
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
// Refleja AsignarColumnaRequest.java con invariantes de exclusividad:
//   - TRATOS: estadoTrato requerido, estadoTarea prohibido
//   - TAREAS: estadoTarea requerido, estadoTrato prohibido, totalValorEstimado=0
// El campo tipoTablero es el discriminador del form (NO se envía al back).
// ---------------------------------------------------------------------------

export const asignarColumnaSchema = z
  .object({
    tipoTablero,
    limiteWip: z.number().int().min(1, 'El límite WIP debe ser al menos 1'),
    estadoTrato: estadoTrato.optional(),
    estadoTarea: estadoTarea.optional(),
    totalValorEstimado: z.number().min(0),
  })
  .superRefine((v, ctx) => {
    if (v.tipoTablero === 'TRATOS') {
      if (!v.estadoTrato)
        ctx.addIssue({
          code: 'custom',
          path: ['estadoTrato'],
          message: 'Selecciona un estado de trato',
        });
      if (v.estadoTarea)
        ctx.addIssue({
          code: 'custom',
          path: ['estadoTarea'],
          message: 'No aplica en tableros de tratos',
        });
    } else {
      // TAREAS
      if (!v.estadoTarea)
        ctx.addIssue({
          code: 'custom',
          path: ['estadoTarea'],
          message: 'Selecciona un estado de tarea',
        });
      if (v.estadoTrato)
        ctx.addIssue({
          code: 'custom',
          path: ['estadoTrato'],
          message: 'No aplica en tableros de tareas',
        });
      if (v.totalValorEstimado !== 0)
        ctx.addIssue({
          code: 'custom',
          path: ['totalValorEstimado'],
          message: 'Debe ser 0 en tableros de tareas',
        });
    }
  });

export type AsignarColumnaFormValues = z.infer<typeof asignarColumnaSchema>;

// ---------------------------------------------------------------------------
// columnaNuevaSchema — form completo "Nueva columna" (Fase 3).
// Combina campos de creación (nombre + color) con los de asignación (limiteWip,
// estado, totalValorEstimado). El discriminador tipoTablero es parte del form
// pero NO se envía al back.
// Reutiliza el superRefine de exclusividad de estado de asignarColumnaSchema.
// ---------------------------------------------------------------------------

export const columnaNuevaSchema = z
  .object({
    tipoTablero,
    nombre: z
      .string()
      .min(1, 'El nombre es obligatorio')
      .max(80, 'El nombre no puede superar los 80 caracteres'),
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
    estadoTrato: estadoTrato.optional(),
    estadoTarea: estadoTarea.optional(),
    totalValorEstimado: z.number().min(0),
  })
  .superRefine((v, ctx) => {
    if (v.tipoTablero === 'TRATOS') {
      if (!v.estadoTrato)
        ctx.addIssue({
          code: 'custom',
          path: ['estadoTrato'],
          message: 'Selecciona un estado de trato',
        });
      if (v.estadoTarea)
        ctx.addIssue({
          code: 'custom',
          path: ['estadoTarea'],
          message: 'No aplica en tableros de tratos',
        });
    } else {
      // TAREAS
      if (!v.estadoTarea)
        ctx.addIssue({
          code: 'custom',
          path: ['estadoTarea'],
          message: 'Selecciona un estado de tarea',
        });
      if (v.estadoTrato)
        ctx.addIssue({
          code: 'custom',
          path: ['estadoTrato'],
          message: 'No aplica en tableros de tareas',
        });
      if (v.totalValorEstimado !== 0)
        ctx.addIssue({
          code: 'custom',
          path: ['totalValorEstimado'],
          message: 'Debe ser 0 en tableros de tareas',
        });
    }
  });

export type ColumnaNuevaFormValues = z.infer<typeof columnaNuevaSchema>;
