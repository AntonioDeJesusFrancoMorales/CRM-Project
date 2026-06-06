// Schemas Zod para Ficha — alineados a FichaResponse.java, CreateFichaRequest.java, EditFichaRequest.java.
// TipoFicha confirmado contra domain/.../enums/TipoFicha.java: TRATO | TAREA (MAYÚSCULAS).

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Enum TipoFicha — TRATO | TAREA (confirma: NO son minúsculas 'trato'/'tarea')
// ---------------------------------------------------------------------------

export const tipoFicha = z.enum(['TRATO', 'TAREA']);
export type TipoFicha = z.infer<typeof tipoFicha>;

// ---------------------------------------------------------------------------
// FichaResponse — shape del back para lectura (alineado a FichaResponse.java)
// El back devuelve exactamente: id, columnaId, tipoFicha, tratoId, tareaId, actualizadoEn
// responsableId, creadoPor, creadoEn NO existen en FichaResponse.java
// tratoId / tareaId: nullable — TRATO requiere tratoId, TAREA requiere tareaId
// ---------------------------------------------------------------------------

export const fichaSchema = z.object({
  id: z.string(),
  columnaId: z.string(),
  tipoFicha,
  tratoId: z.string().nullable(),
  tareaId: z.string().nullable(),
  actualizadoEn: z.string(),
});

export type Ficha = z.infer<typeof fichaSchema>;

// ---------------------------------------------------------------------------
// CreateFichaRequest — payload para POST /fichas/create (alineado a CreateFichaRequest.java)
// responsableId y creadoPor NO existen en CreateFichaRequest.java
// El back infiere el actor del JWT (ActorContext)
// ---------------------------------------------------------------------------

export const fichaCreateSchema = z.object({
  columnaId: z.string(),
  tipoFicha,
  tratoId: z.string().nullable().optional(),
  tareaId: z.string().nullable().optional(),
});

export type FichaCreateInput = z.infer<typeof fichaCreateSchema>;

// ---------------------------------------------------------------------------
// EditFichaRequest — payload para PUT /fichas/edit?id= (alineado a EditFichaRequest.java)
// Sin creadoPor (inmutable) ni responsableId (no está en EditFichaRequest.java)
// Se usa para mover ficha (cambiar columnaId) y para otras ediciones
// ---------------------------------------------------------------------------

export const fichaEditSchema = z.object({
  columnaId: z.string(),
  tipoFicha,
  tratoId: z.string().nullable().optional(),
  tareaId: z.string().nullable().optional(),
});

export type FichaEditInput = z.infer<typeof fichaEditSchema>;
