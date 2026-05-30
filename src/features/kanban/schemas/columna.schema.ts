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
