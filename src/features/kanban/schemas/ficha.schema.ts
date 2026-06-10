// Schemas Zod para Ficha — alineados a FichaResponse.java, CreateFichaRequest.java, EditFichaRequest.java.
// TipoFicha confirmado contra domain/.../enums/TipoFicha.java: TRATO | TAREA (MAYÚSCULAS).

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Enum TipoFicha — TRATO | TAREA (confirma: NO son minúsculas 'trato'/'tarea')
// ---------------------------------------------------------------------------

export const tipoFicha = z.enum(['TRATO', 'TAREA']);
export type TipoFicha = z.infer<typeof tipoFicha>;

// ---------------------------------------------------------------------------
// EtiquetaRef — ref COMPACTA que la ficha trae embebida (FichaResponse.EtiquetaRefDto).
// SOLO {id, tipoEtiqueta}: NO trae nombre ni color. El catálogo (/etiquetas/get-all)
// es la fuente de verdad de nombre+color → el render del chip hace join por id.
// ---------------------------------------------------------------------------

export const etiquetaRefSchema = z.object({
  id: z.string(),
  tipoEtiqueta: z.enum(['TAREA', 'TRATO']),
});

export type EtiquetaRef = z.infer<typeof etiquetaRefSchema>;

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
  // etiquetas: refs compactas embebidas. Opcional por tolerancia a fixtures/respuestas
  // sin el campo; los consumidores normalizan con `?? []`. El back siempre lo envía.
  etiquetas: z.array(etiquetaRefSchema).optional(),
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
  // etiquetaIds opcional: se resuelve contra el catálogo en el back. Deben matchear el tipo.
  etiquetaIds: z.array(z.string()).optional(),
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
  // etiquetaIds (back EditFichaRequest): null/ausente = deja las tags como están;
  // [] = borra todas; lista = reemplaza en full. Mantener undefined para no tocarlas.
  etiquetaIds: z.array(z.string()).optional(),
});

export type FichaEditInput = z.infer<typeof fichaEditSchema>;
