// Schemas Zod para el feature Kanban — alineados al contrato real del back AR-CRM.
// Fuente de verdad: TableroResponse.java, ColumnaTableroDto.java, enums Java confirmados.

import { z } from 'zod';
import { requiredTrimmedName } from '@/lib/validation';

// ---------------------------------------------------------------------------
// Enums confirmados contra Java (fuente de verdad)
// TipoTablero: domain/.../enums/TipoTablero.java
// TipoColumna: domain/.../enums/TipoColumna.java
// ---------------------------------------------------------------------------

export const tipoTablero = z.enum(['TAREAS', 'TRATOS']);
export type TipoTablero = z.infer<typeof tipoTablero>;

export const tipoColumna = z.enum(['PREDETERMINADA', 'PERSONALIZADA']);
export type TipoColumna = z.infer<typeof tipoColumna>;

// ---------------------------------------------------------------------------
// ColumnaTableroDto — columna en contexto de tablero (embedded en TableroResponse)
// Campos: id (= columnaId del catálogo), nombre, color, limiteWip, nota,
//         totalValorEstimado
// El back DROPEÓ estadoTarea/estadoTrato de la columna (refactor "simplify board
// column relation"): ya no se exponen ni se aceptan. El estado del trato/tarea NO
// se deriva más de la columna. Ver ColumnaTableroDto.java (fuente de verdad).
// ---------------------------------------------------------------------------

export const columnaTableroSchema = z.object({
  id: z.string(),
  nombre: z.string().nullable(),
  color: z.string().nullable(),
  limiteWip: z.number().int().nullable(),
  nota: z.string().nullable(),
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
// columnasPredeterminadas se mantiene opcional en el formulario por compatibilidad,
// pero el payload de transporte siempre la envía explícitamente como true.
// ---------------------------------------------------------------------------

export const tableroCreateSchema = z.object({
  nombre: requiredTrimmedName(100, 'Máximo 100 caracteres', 'El nombre es obligatorio'),
  descripcion: z.string().trim().min(1, 'La descripción es obligatoria'),
  tipoTablero,
  columnasPredeterminadas: z.boolean().optional(),
});

export type TableroCreateInput = z.infer<typeof tableroCreateSchema>;

// Payload exacto de POST /tableros/create. El DTO actual del back requiere el campo
// columnasPredeterminadas como boolean no nulo; el frontend lo envía siempre como true
// para conservar el comportamiento de columnas predeterminadas del back.
export type TableroCreatePayload = Pick<
  TableroCreateInput,
  'nombre' | 'descripcion' | 'tipoTablero'
> & {
  columnasPredeterminadas: true;
};

// ---------------------------------------------------------------------------
// EditTableroRequest — payload para PUT /tableros/edit?id=
// Fuente: EditTableroRequest.java. Solo nombre y descripcion (@NotBlank) son
// editables; tipoTablero y creadoEn se preservan.
// ---------------------------------------------------------------------------

export const tableroEditSchema = z.object({
  nombre: requiredTrimmedName(100, 'Máximo 100 caracteres', 'El nombre es obligatorio'),
  descripcion: z.string().trim().min(1, 'La descripción es obligatoria'),
});

export type TableroEditInput = z.infer<typeof tableroEditSchema>;
