# Proposal: alinear-contrato-fixes (Change 1)

## Intent

Eliminar 7 desajustes confirmados entre el front y el back que hoy rompen mutaciones en produccion o corrompen datos silenciosamente. Ninguno requiere UI nueva — todos son correcciones de contrato: schemas Zod, payloads de hooks, mocks MSW y la migracion de un endpoint de drag a su ruta dedicada.

La prioridad es estabilidad: cada item en este change es un bug activo o una perdida de datos silenciosa.

## Scope

### In Scope — 7 items CONFIRMADOS

| # | ID | Riesgo | Descripcion |
|---|-----|--------|-------------|
| 1 | reordenar-columnas | CRITICO | Front envia `nuevoOrden: string[]`; back espera `List<ColumnaId>` = `[{value: uuid}]`. 400 en produccion. |
| 2 | empresa paginaWeb | CRITICO | Snake `pagina_web` → camel `paginaWeb` en schema + form. El dato se pierde hoy. |
| 3 | tareas/edit | ALTA | `.partial()` hace todo opcional; back tiene 5 campos `@NotNull`. 400 en edicion. |
| 4 | usuarios/edit | ALTA | `nombre`/`correo` son `.optional()`; back los requiere `@NotBlank`. 400 en edicion. |
| 5a | fichas create/edit body | ALTA | `responsableId`/`creadoPor` en request body — back los ignora, jackson los descarta. Noise en la red. |
| 5b | fichaSchema response | CRITICO | `fichaSchema` requiere `responsableId`, `creadoPor`, `creadoEn`; `FichaResponse.java` NO los devuelve → `z.parse()` lanza en CADA lectura. Feature kanban completamente roto en produccion. |
| 6 | fichas drag → mover-columna | ALTA | Drag usa `PUT /fichas/edit` con body completo; back tiene endpoint dedicado `PUT /api/fichas/mover-columna?id=` con `{targetColumnaId}` unicamente. Migrar al endpoint correcto. |

**Cross-cutting obligatorio:** Los mocks MSW aceptan las shapes INCORRECTAS del front, enmascarando los bugs en tests. Cada handler tocado DEBE ser actualizado a la shape real del back.

### Out of Scope (Change 2)

- NEW-B: `keycloakId` en `usuarioUpdateSchema`
- NEW-C: empresa `estadoRelacion`/`responsableId`/`notas`
- contactos/empresas cambiar-estado
- fichas get-by-id
- contacto campo `cargo`
- roles CRUD
- agendas

## Capabilities afectadas

| Capability | Cambio |
|------------|--------|
| `kanban-management` | Items 1, 5a, 5b, 6 — fichaSchema response, fichaCreate/EditSchema, useAutoFicha, useMoverFicha (nuevo), reordenar-columnas wire format, KanbanBoard rewired |
| `empresas-management` | Item 2 — paginaWeb camelCase en schema y form |
| `tareas-management` | Item 3 — tareaUpdateSchema sin .partial(), 5 campos @NotNull |
| `usuarios-management` | Item 4 — usuarioUpdateSchema nombre/correo required |

## Modulos afectados

| Modulo | Archivos |
|--------|----------|
| kanban/schemas | `src/features/kanban/schemas/ficha.schema.ts` |
| kanban/hooks | `src/features/kanban/hooks/useReordenarColumnas.ts`, `useAutoFicha.ts`, `useCreateFicha.ts` (tipos), `useUpdateFicha.ts` (tipos) |
| kanban/hooks NEW | `src/features/kanban/hooks/useMoverFicha.ts` (crear) |
| kanban/components | `src/features/kanban/components/KanbanBoard.tsx`, `KanbanColumn.tsx`, `FichaCreateDialog.tsx`, `FichaForm.tsx` |
| kanban/tests | `src/features/kanban/__tests__/hooks.write.test.ts`, y otros |
| empresas/schemas | `src/features/empresas/schemas/empresa.schema.ts` |
| empresas/components | `src/features/empresas/components/EmpresaForm.tsx`, `EmpresaFormDialog.tsx` |
| tareas/schemas | `src/features/tareas/schemas/tarea.schema.ts` |
| tareas/components | `src/features/tareas/components/TareaEditDialog.tsx` |
| usuarios/schemas | `src/features/usuarios/schemas/usuario.schema.ts` |
| api | `src/api/endpoints.ts` |
| mocks | `src/mocks/handlers/tableros.ts`, `src/mocks/fixtures/tableros.ts` |

## Endpoints referenciados

| Metodo | Path | Item |
|--------|------|------|
| PUT | `/api/tableros/reordenar-columnas?id={tableroId}` | 1 |
| POST | `/api/empresas/create` | 2 |
| PUT | `/api/empresas/edit?id={id}` | 2 |
| PUT | `/api/tareas/edit?id={id}` | 3 |
| PUT | `/api/usuarios/edit?id={id}` | 4 |
| POST | `/api/fichas/create` | 5a, 5b |
| GET | `/api/fichas/get-all` | 5b |
| PUT | `/api/fichas/edit?id={id}` | 5a |
| PUT | `/api/fichas/mover-columna?id={fichaId}` | 6 |

## Risks

| Riesgo | Probabilidad | Mitigacion |
|--------|-------------|------------|
| Romper kanban por cambio de shape `Ficha` | Alta | TDD: tests en RED primero; tsc guia los errores de tipo en cadena |
| FichaForm con selector responsable muerto | Media | W1 investigado: el selector era muerto (FichaCreateDialog lo descartaba antes del HTTP call). Se elimina en cleanup. |
| Mock de reordenamiento acept strings — enmascara el bug | Alta | RESUELTO: handler actualizado a `Array<{value: string}>` |

## Plan de rollback

Todos los cambios son en-archivo sin migraciones de datos ni cambios de API. Rollback = `git revert` del commit del change. No hay state externo afectado. Los mocks MSW actualizados son solo para el entorno de desarrollo/tests — no afectan produccion.

Riesgo de rollback: BAJO.

## Dependencies

- Back AR-CRM con los endpoints verificados (todos existentes en produccion).
- Ninguna dependencia de cambio externo.

## Success Criteria

- [x] `pnpm test:run` verde (953 tests, 0 failed).
- [x] `pnpm tsc --noEmit` 0 errores.
- [x] fichaSchema response acepta `{id, columnaId, tipoFicha, tratoId, tareaId, actualizadoEn}` sin lanzar.
- [x] useReordenarColumnas envia `[{value: uuid}]` al back.
- [x] useMoverFicha existe y usa `PUT /fichas/mover-columna` con optimistic update.
- [x] empresaCreateSchema usa `paginaWeb` (camelCase).
- [x] tareaUpdateSchema requiere responsableId/titulo/tipo/prioridad/fechaLimite.
- [x] usuarioUpdateSchema requiere nombre y correo.
