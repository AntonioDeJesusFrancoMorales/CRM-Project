// Schemas Zod para el feature Kanban — alineados al contrato real del back AR-CRM.
// Fuente de verdad: TableroResponse.java, ColumnaTableroDto.java, enums Java confirmados.

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Enums confirmados contra Java (fuente de verdad)
// TipoTablero: domain/.../enums/TipoTablero.java
// TipoColumna: domain/.../enums/TipoColumna.java
// TipoEstadoColumnaTableroTrato: domain/.../enums/TipoEstadoColumnaTableroTrato.java
// ---------------------------------------------------------------------------

export const tipoTablero = z.enum(['TAREAS', 'TRATOS']);
export type TipoTablero = z.infer<typeof tipoTablero>;

export const tipoColumna = z.enum(['PREDETERMINADA', 'PERSONALIZADA']);
export type TipoColumna = z.infer<typeof tipoColumna>;

export const estadoTrato = z.enum(['ABIERTO', 'GANADO', 'PERDIDO']);
export type EstadoTrato = z.infer<typeof estadoTrato>;

// ---------------------------------------------------------------------------
// ColumnaTableroDto — columna en contexto de tablero (embedded en TableroResponse)
// Campos: id (= columnaId del catálogo), nombre, color, limiteWip, nota,
//         estadoTarea, estadoTrato, totalValorEstimado
// Todos excepto id, nombre, color, totalValorEstimado son nullable.
// ---------------------------------------------------------------------------

export const columnaTableroSchema = z.object({
  id: z.string(),
  nombre: z.string().nullable(),
  color: z.string().nullable(),
  limiteWip: z.number().int().nullable(),
  nota: z.string().nullable(),
  estadoTarea: z.string().nullable(),
  estadoTrato: estadoTrato.nullable(),
  totalValorEstimado: z.number(),
});

export type ColumnaTablero = z.infer<typeof columnaTableroSchema>;

// ---------------------------------------------------------------------------
// TableroResponse — shape completo del tablero con columnas
// creadoEn: LocalDateTime del back serializado como string ISO
// ---------------------------------------------------------------------------

export const tableroSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  descripcion: z.string().nullable(),
  tipoTablero,
  columnas: z.array(columnaTableroSchema),
  creadoEn: z.string(),
});

export type Tablero = z.infer<typeof tableroSchema>;
