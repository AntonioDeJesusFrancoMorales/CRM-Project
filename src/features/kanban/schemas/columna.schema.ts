// Schema Zod para Columna del catálogo — alineado a ColumnaResponse.java.
// Es la entidad del catálogo (independiente del tablero); distinta de ColumnaTableroDto.

import { z } from 'zod';
import { tipoTablero, tipoColumna, estadoTrato, estadoTarea } from './tablero.schema';

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

export const columnaCreateSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  color: z.string().min(1, 'El color es obligatorio'),
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
  nombre: z.string().min(1).optional(),
  color: z.string().min(1).optional(),
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
