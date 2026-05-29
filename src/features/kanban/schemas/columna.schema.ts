// Schema Zod para Columna del catálogo — alineado a ColumnaResponse.java.
// Es la entidad del catálogo (independiente del tablero); distinta de ColumnaTableroDto.

import { z } from 'zod';
import { tipoTablero, tipoColumna, estadoTrato } from './tablero.schema';

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
// Refleja AsignarColumnaRequest.java: limiteWip @NotNull @Min(1), estadoTrato
// opcional, totalValorEstimado @NotNull BigDecimal.
// NO modifica columnaSchema (catálogo de lectura).
// ---------------------------------------------------------------------------

export const asignarColumnaSchema = z.object({
  limiteWip: z.number().int().min(1, 'El límite WIP debe ser al menos 1'),
  estadoTrato: estadoTrato.optional(),
  totalValorEstimado: z.number().min(0),
});

export type AsignarColumnaFormValues = z.infer<typeof asignarColumnaSchema>;
