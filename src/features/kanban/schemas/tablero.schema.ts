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

// TipoEstadoColumnaTableroTarea: domain/.../enums/TipoEstadoColumnaTableroTarea.java
export const estadoTarea = z.enum(['PENDIENTE', 'EN_CURSO', 'FINALIZADA']);
export type EstadoTarea = z.infer<typeof estadoTarea>;

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
  // nullish (= nullable + optional): el back puede omitir estas claves por
  // completo en ColumnaTableroDto. .nullable() solo aceptaba null presente;
  // si la clave falta (undefined) Zod lanzaba ZodError y el tablero no dibujaba.
  estadoTarea: estadoTarea.nullish(),
  estadoTrato: estadoTrato.nullish(),
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

// ---------------------------------------------------------------------------
// CreateTableroRequest — payload para POST /tableros/create
// Fuente: CreateTableroRequest.java. nombre (@NotBlank, 1-100), descripcion
// (@NotBlank), tipoTablero (@NotNull) son obligatorios. El back sintetiza las
// 4 columnas por defecto; el cliente no las envía.
// superUsuarioId se OMITE: el back lo ignora (lo deriva del JWT del actor).
// columnasPredeterminadas es opcional (existe en el contrato del back).
// ---------------------------------------------------------------------------

export const tableroCreateSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(100, 'Máximo 100 caracteres'),
  descripcion: z.string().min(1, 'La descripción es obligatoria'),
  tipoTablero,
  columnasPredeterminadas: z.boolean().optional(),
});

export type TableroCreateInput = z.infer<typeof tableroCreateSchema>;

// ---------------------------------------------------------------------------
// EditTableroRequest — payload para PUT /tableros/edit?id=
// Fuente: EditTableroRequest.java. Solo nombre (@NotBlank, 1-100) y descripcion
// (sin restricción) son editables; tipoTablero y creadoEn se preservan.
// ---------------------------------------------------------------------------

export const tableroEditSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(100, 'Máximo 100 caracteres'),
  descripcion: z.string().nullable().optional(),
});

export type TableroEditInput = z.infer<typeof tableroEditSchema>;
