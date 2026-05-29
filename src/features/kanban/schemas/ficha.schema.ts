// Schemas Zod para Ficha — alineados a FichaResponse.java, CreateFichaRequest.java, EditFichaRequest.java.
// TipoFicha confirmado contra domain/.../enums/TipoFicha.java: TRATO | TAREA (MAYÚSCULAS).

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Enum TipoFicha — TRATO | TAREA (confirma: NO son minúsculas 'trato'/'tarea')
// ---------------------------------------------------------------------------

export const tipoFicha = z.enum(['TRATO', 'TAREA']);
export type TipoFicha = z.infer<typeof tipoFicha>;

// ---------------------------------------------------------------------------
// FichaResponse — shape del back para lectura
// creadoEn / actualizadoEn: Instant del back, serializado como string ISO
// tratoId / tareaId: nullable — TRATO requiere tratoId, TAREA requiere tareaId
// ---------------------------------------------------------------------------

export const fichaSchema = z.object({
  id: z.string(),
  columnaId: z.string(),
  tipoFicha,
  tratoId: z.string().nullable(),
  tareaId: z.string().nullable(),
  responsableId: z.string(),
  creadoPor: z.string(),
  creadoEn: z.string(),
  actualizadoEn: z.string(),
});

export type Ficha = z.infer<typeof fichaSchema>;

// ---------------------------------------------------------------------------
// CreateFichaRequest — payload para POST /fichas/create
// creadoPor REQUERIDO (inmutable una vez creado — no en EditFichaRequest)
// ---------------------------------------------------------------------------

export const fichaCreateSchema = z.object({
  columnaId: z.string(),
  tipoFicha,
  tratoId: z.string().nullable().optional(),
  tareaId: z.string().nullable().optional(),
  responsableId: z.string(),
  creadoPor: z.string(),
});

export type FichaCreateInput = z.infer<typeof fichaCreateSchema>;

// ---------------------------------------------------------------------------
// EditFichaRequest — payload para PUT /fichas/edit?id=
// Sin creadoPor (inmutable en el back — el comment del DTO lo aclara)
// Se usa para mover ficha (cambiar columnaId) y para otras ediciones
// ---------------------------------------------------------------------------

export const fichaEditSchema = z.object({
  columnaId: z.string(),
  tipoFicha,
  tratoId: z.string().nullable().optional(),
  tareaId: z.string().nullable().optional(),
  responsableId: z.string(),
});

export type FichaEditInput = z.infer<typeof fichaEditSchema>;
