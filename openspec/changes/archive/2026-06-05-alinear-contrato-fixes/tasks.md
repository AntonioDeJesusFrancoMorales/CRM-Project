# Tasks — Change 1: alinear-contrato-fixes

**Status**: completado
**Modo**: Strict TDD — RED → GREEN → REFACTOR
**Runner**: `pnpm test:run`
**Type-check**: `pnpm tsc --noEmit`
**Fecha**: 2026-06-05

---

## Resumen de fases

| Fase | Descripcion | Tareas |
|------|-------------|--------|
| F1 | Mocks & Fixtures (actualizar MSW a la shape real del back) | 4 |
| F2 | Schemas & Types (RED primero) | 6 |
| F3 | Hooks (actualizar payload senders y crear useMoverFicha) | 4 |
| F4 | Components (KanbanBoard rewire, EmpresaForm, FichaForm cleanup) | 3 |
| F5 | Limpieza & Verificacion | 4 |
| **Total** | | **21** |

---

## F1 — Mocks & Fixtures

> Actualizar MSW a la shape real del back. Depende de F2.1 (el tipo Ficha cambia → TS errara en el fixture).

- [x] **F1.1** Actualizar `fichasFixture` en `src/mocks/fixtures/tableros.ts`: eliminar `responsableId`, `creadoPor`, `creadoEn` de los 5 objetos ficha.

- [x] **F1.2** Actualizar MSW handler `POST /fichas/create` en `src/mocks/handlers/tableros.ts`: eliminar lectura de `responsableId`/`creadoPor` del body; ficha construida en la respuesta solo con `{id, columnaId, tipoFicha, tratoId, tareaId, actualizadoEn}`.

- [x] **F1.3** Actualizar MSW handler `PUT /tableros/reordenar-columnas` en `src/mocks/handlers/tableros.ts`: cambiar tipado de `body.nuevoOrden` a `Array<{value: string}>`; extraer `.value` al reordenar.

- [x] **F1.4** Agregar MSW handler `PUT /fichas/mover-columna` (NUEVO) en `src/mocks/handlers/tableros.ts`: lee `id` de querystring y `targetColumnaId` de body; actualiza `fichasFixture`; retorna ficha actualizada con shape `FichaResponse`.

---

## F2 — Schemas & Types

> Strict TDD: escribir test en RED, luego implementar.

- [x] **F2.1** [TEST+IMPL] `fichaSchema` response — eliminar campos fantasma.
  - Test: `fichaSchema.parse()` exitoso con shape real `{id, columnaId, tipoFicha, tratoId, tareaId, actualizadoEn}` (sin responsableId/creadoPor/creadoEn).
  - Impl: `src/features/kanban/schemas/ficha.schema.ts` — eliminar `responsableId`, `creadoPor`, `creadoEn` de `fichaSchema`.
  - Nuevos archivos de test: `src/features/kanban/__tests__/ficha.schema.test.ts`

- [x] **F2.2** [TEST+IMPL] `fichaCreateSchema` — eliminar `responsableId`/`creadoPor`.
  - Test: payload minimo `{columnaId, tipoFicha, tratoId, tareaId}` → `success: true`.
  - Impl: mismas lineas en `ficha.schema.ts`.

- [x] **F2.3** [TEST+IMPL] `fichaEditSchema` — eliminar `responsableId`.
  - Test: payload `{columnaId, tipoFicha, tratoId, tareaId}` → `success: true`.
  - Impl: mismas lineas en `ficha.schema.ts`.

- [x] **F2.4** [TEST+IMPL] `empresa.schema.ts` — renombrar `pagina_web` → `paginaWeb`.
  - Test: `empresaCreateSchema.safeParse({ nombre: 'Acme', paginaWeb: 'https://acme.com' })` → `success: true`.
  - Impl: `src/features/empresas/schemas/empresa.schema.ts` linea 14.
  - Test file: `src/features/empresas/__tests__/empresa.schema.test.ts`

- [x] **F2.5** [TEST+IMPL] `tarea.schema.ts` — quitar `.partial()`, campos `@NotNull` requeridos.
  - Test: sin responsableId/titulo/tipo/prioridad/fechaLimite → `success: false`; todos presentes → `success: true`; sin `fechaCompletada` en el schema.
  - Impl: `src/features/tareas/schemas/tarea.schema.ts` — reescribir `tareaUpdateSchema`.
  - Test file: `src/features/tareas/__tests__/tarea.schema.test.ts`

- [x] **F2.6** [TEST+IMPL] `usuario.schema.ts` — `nombre`/`correo` requeridos.
  - Test: sin `nombre` → `success: false`; sin `correo` → `success: false`; sin `rolId` → `success: true`.
  - Impl: `src/features/usuarios/schemas/usuario.schema.ts` — eliminar `.optional()` de nombre y correo.
  - Test file: `src/features/usuarios/__tests__/usuario.schema.test.ts`

---

## F3 — Hooks

> Depende de F2 (tipos corregidos).

- [x] **F3.1** [TEST+IMPL] `useAutoFicha` — no envia `responsableId`/`creadoPor`.
  - Test: `capturedBody` del POST /fichas/create NO contiene responsableId ni creadoPor.
  - Impl: `src/features/kanban/hooks/useAutoFicha.ts` — eliminar `responsableId`/`creadoPor` del payload.

- [x] **F3.2** Actualizar `FICHA_FIXTURE` y `CREATE_PAYLOAD` en `src/features/kanban/__tests__/hooks.write.test.ts`: eliminar `responsableId`, `creadoPor`, `creadoEn`.

- [x] **F3.3** [TEST+IMPL] `useMoverFicha` — crear hook NUEVO.
  - Tests: (a) invoca PUT /fichas/mover-columna?id= con `{targetColumnaId}`; (b) optimistic update mueve la ficha en el cache; (c) rollback en onError; (d) invalida `['fichas']` en onSuccess.
  - Impl: `src/features/kanban/hooks/useMoverFicha.ts` (nuevo).
  - Test file: `src/features/kanban/__tests__/useMoverFicha.test.ts` (nuevo)

- [x] **F3.4** [TEST+IMPL] `useReordenarColumnas` — body debe ser `Array<{value}>`.
  - Test: `capturedBody.nuevoOrden[0]` es `{value: string}`, NO es `string`.
  - Impl: `src/features/kanban/hooks/useReordenarColumnas.ts` linea 67.

---

## F4 — Components

> Depende de F2 y F3.

- [x] **F4.1** [TEST+IMPL] `buildDragEndHandler` + `KanbanBoard.tsx`.
  - Cambios: (1) `DragEndHandlerParams.mutate` firma → `(vars: { fichaId: string; targetColumnaId: string }) => void`; (2) body simplificado sin `FichaEditInput`; (3) import `useMoverFicha` en lugar de `useUpdateFicha`.
  - Tests actualizados: nueva firma en hooks.write.test.ts.

- [x] **F4.2** `EmpresaForm.tsx` + `EmpresaFormDialog.tsx` — paginaWeb.
  - Cambios: `EMPTY_DEFAULTS.paginaWeb`, `name="paginaWeb"`.

- [x] **F4.3** `FichaForm.tsx` — eliminar selector responsable muerto (W1).
  - Eliminado: import `useUsuarios`, `fichaFormSchema.responsableId`, `resolveEntitySchema.responsableId`, `defaultValues.responsableId`, `FormField Responsable`, `useUsuarios()` call.

---

## F5 — Limpieza & Verificacion

- [x] **F5.1** Actualizar `FICHA_FIXTURE` en `KanbanColumn.test.tsx` y `KanbanCard.test.tsx`: eliminar responsableId/creadoPor/creadoEn de makeFixhas() y inline mock responses.

- [x] **F5.2** Corregir nombres de tests stale (W3): "creadoEn" → "actualizadoEn" en hooks.read.test.ts:404, KanbanColumn.test.tsx:198, KanbanCard.test.tsx describe.

- [x] **F5.3** `pnpm tsc --noEmit` — 0 errores.

- [x] **F5.4** `pnpm test:run` — RESULTADO: 111 archivos, 953 tests, 0 failed.

---

## Dependencias entre fases

```
F2.1 (fichaSchema)
  └─► F1.1 (fixture tableros)
  └─► F1.2 (MSW create handler)
  └─► F2.2 y F2.3 (fichaCreate/EditSchema)
        └─► F3.1 (useAutoFicha + FICHA_FIXTURE)
        └─► F1.4 (MSW mover-columna) + F3.3 (useMoverFicha) — paralelos
              └─► F4.1 (KanbanBoard)

F2.4 (empresa schema) + F4.2 (EmpresaForm) — independientes
F2.5 (tarea schema) — independiente
F2.6 (usuario schema) — independiente
F1.3 (MSW reordenar) + F3.4 (useReordenarColumnas) — independientes
F5 — al final
```
