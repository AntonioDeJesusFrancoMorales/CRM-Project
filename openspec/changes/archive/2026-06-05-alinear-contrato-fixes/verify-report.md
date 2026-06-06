# Verification Report — alinear-contrato-fixes (Change 1)

**Change**: alinear-contrato-fixes
**Mode**: Strict TDD
**Fecha**: 2026-06-05

---

## Completeness

| Metrica | Valor |
|---------|-------|
| Tasks total | 21 |
| Tasks complete | 21 |
| Tasks incomplete | 0 |

Todas las fases F1–F5 marcadas `[x]`. Ninguna tarea pendiente.

---

## Build & Tests Execution

**Type-check**: ✅ `pnpm tsc --noEmit` → 0 errores.

**Tests**: ✅ 953 passed / 0 failed / 0 skipped — 111 archivos

```
Test Files  111 passed (111)
      Tests  953 passed (953)
   Duration  ~42s
```

---

## Spec Compliance Matrix

### REQ-1 — reordenar-columnas: serializacion ColumnaId

| Requirement | Evidencia | Resultado |
|---|---|---|
| useReordenarColumnas envia `Array<{value}>` | `hooks.write.test.ts` — capturedBody.nuevoOrden[0] es `{value: string}` | ✅ COMPLIANT |
| MSW handler acepta `Array<{value}>` y extrae `.value` | tableros.ts linea 157: `body.nuevoOrden.map(item => item.value)` | ✅ COMPLIANT |
| Wire format documentado con comentario en el hook | Comentario en `useReordenarColumnas.ts` sobre ColumnaId record | ✅ COMPLIANT |

### REQ-2 — empresa paginaWeb camelCase

| Requirement | Evidencia | Resultado |
|---|---|---|
| `empresaCreateSchema` usa `paginaWeb` | `empresa.schema.ts` linea 14 | ✅ COMPLIANT |
| `EmpresaForm` usa `name="paginaWeb"` y `EMPTY_DEFAULTS.paginaWeb` | `EmpresaForm.tsx` lineas 113, 33 | ✅ COMPLIANT |
| Schema rechaza `pagina_web` (campo desconocido = stripped) | `empresa.schema.test.ts` | ✅ COMPLIANT |

### REQ-3 — tareaUpdateSchema: sin .partial(), campos @NotNull requeridos

| Requirement | Evidencia | Resultado |
|---|---|---|
| `responsableId` requerido | `tarea.schema.ts` lineas 27-38 | ✅ COMPLIANT |
| `titulo`/`tipo`/`prioridad`/`fechaLimite` requeridos | idem | ✅ COMPLIANT |
| Sin `fechaCompletada` en el schema | rg confirma ausencia | ✅ COMPLIANT |
| Sin `tratoId` en update schema | rg confirma ausencia | ✅ COMPLIANT |

### REQ-4 — usuarioUpdateSchema: nombre/correo requeridos

| Requirement | Evidencia | Resultado |
|---|---|---|
| `nombre` required (sin `.optional()`) | `usuario.schema.ts` lineas 18-22 | ✅ COMPLIANT |
| `correo` required (sin `.optional()`) | idem | ✅ COMPLIANT |
| `rolId` sigue siendo `.optional()` | idem | ✅ COMPLIANT |

### REQ-5a — fichas create/edit body: sin responsableId/creadoPor

| Requirement | Evidencia | Resultado |
|---|---|---|
| `fichaCreateSchema` sin `responsableId`/`creadoPor` | `ficha.schema.ts` | ✅ COMPLIANT |
| `fichaEditSchema` sin `responsableId` | idem | ✅ COMPLIANT |
| `useAutoFicha` payload limpio | `hooks.write.test.ts` capturedBody test | ✅ COMPLIANT |
| `FichaCreateDialog` payload limpio | `FichaCreateDialog.tsx` lineas 70-83 | ✅ COMPLIANT |
| MSW handler `POST /fichas/create` no echa responsableId/creadoPor | `tableros.ts` handler | ✅ COMPLIANT |

### REQ-5b — fichaSchema response: campos del back exactos

| Requirement | Evidencia | Resultado |
|---|---|---|
| `fichaSchema` acepta `{id, columnaId, tipoFicha, tratoId, tareaId, actualizadoEn}` sin lanzar | `ficha.schema.test.ts` | ✅ COMPLIANT |
| `fichaSchema` NO declara `responsableId`/`creadoPor`/`creadoEn` | `ficha.schema.ts` lineas 20-27 | ✅ COMPLIANT |
| `fichasFixture` sin campos fantasma | `tableros.ts` fixtures | ✅ COMPLIANT |
| `FICHA_FIXTURE` en tests limpio | `hooks.write.test.ts` | ✅ COMPLIANT |

### REQ-6 — fichas drag: migrar a PUT /fichas/mover-columna

| Requirement | Evidencia | Resultado |
|---|---|---|
| `endpoints.fichas.moverColumna(id)` existe | `endpoints.ts` linea 58 | ✅ COMPLIANT |
| `useMoverFicha` hook existe y usa PUT con `{targetColumnaId}` | `useMoverFicha.ts` | ✅ COMPLIANT |
| Optimistic update implementado | `useMoverFicha.ts` onMutate/onError/onSuccess | ✅ COMPLIANT |
| `KanbanBoard` usa `useMoverFicha` para drag | `KanbanBoard.tsx` | ✅ COMPLIANT |
| MSW handler `PUT /fichas/mover-columna` existe | `tableros.ts` lineas 326-337 | ✅ COMPLIANT |
| 4 tests de `useMoverFicha` verdes | `useMoverFicha.test.ts` | ✅ COMPLIANT |

---

## Verify Warnings (primera pasada) — todos limpiados antes del archive

Los 4 warnings detectados en la verificacion inicial fueron limpiados en el mismo ciclo de apply:

### W1 (PRODUCCION) — FichaForm selector responsable muerto — CERRADO

**Problema:** `FichaForm.tsx` tenia un `FormField` para `responsableId` que `FichaCreateDialog.handleSubmit` descartaba antes del HTTP call. El campo no tenia efecto funcional — era dead UI que contradecia el contrato limpio.

**Investigacion:** Se verifico que no habia otra ruta que consumiera el valor del selector. `FichaCreateDialog` solo crea la Ficha, no la entidad asociada. El selector era genuinamente muerto.

**Resolucion:** Eliminados de `FichaForm.tsx`: import `useUsuarios`, campo `responsableId` en `fichaFormSchema`, campo `responsableId` en `resolveEntitySchema`, `defaultValues.responsableId`, el `FormField` Responsable completo, y la llamada a `useUsuarios()`. `FichaFormValues` queda como `{entidadId: string}`.

**Impacto:** Tests actualizados con TDD (RED primero, GREEN tras implementar).

### W2 (test hygiene) — KanbanColumn.test.tsx makeFixhas() — CERRADO

**Problema:** El factory `makeFixhas()` en `KanbanColumn.test.tsx` creaba objetos `Ficha` con campos `responsableId`/`creadoPor`/`creadoEn`. Estos campos no existen en el tipo `Ficha` corregido pero el compilador no los detectaba por widening de inference en `Array.from()`.

**Resolucion:** Eliminados los campos de `makeFixhas()`.

### W3 (test hygiene) — 3 nombres de test stale — CERRADO

**Problema:** Tres describes/tests referenciaban `creadoEn` o `creadoPor MOCK_USER_ID` en sus nombres aunque las aserciones internas eran correctas.

**Resolucion:**
- `hooks.read.test.ts:404` — nombre "creadoEn" → "actualizadoEn"
- `KanbanColumn.test.tsx:198` — nombre "creadoEn ASC" → "actualizadoEn ASC"
- `KanbanCard.test.tsx:381` — describe "envio con creadoPor MOCK_USER_ID" → "envio sin responsableId (back infiere del JWT)"

### W4 (test hygiene) — MSW response shape en KanbanCard.test.tsx — CERRADO

**Problema:** Los tests (b) y (c) de `FichaCreateDialog` en `KanbanCard.test.tsx` tenian un override del handler `POST /fichas/create` que echabia `responsableId`/`creadoPor`/`creadoEn` en la respuesta, contradiciendo la shape real del back.

**Resolucion:** Los overrides ahora retornan `{id, columnaId, tipoFicha, tratoId, tareaId, actualizadoEn}` unicamente. Tambien eliminados: stub de `/api/usuarios/get-all` del helper `renderForm()` en `FichaForm.test.tsx` e imports MSW/server innecesarios.

---

## Estado final despues del cleanup

| Metrica | Valor |
|---------|-------|
| Tests totales | 953 passed |
| Tests failed | 0 |
| Test files | 111 |
| Type errors | 0 |
| CRITICAL | 0 |
| WARNING | 0 (todos W1-W4 cerrados) |

---

## Correctness (Static — Structural Evidence)

| Requirement | Estado | Notas |
|---|---|---|
| `fichaSchema` sin campos fantasma | ✅ | id/columnaId/tipoFicha/tratoId/tareaId/actualizadoEn solamente |
| `fichaCreateSchema` sin responsableId/creadoPor | ✅ | Verificado en schema.ts y tests |
| `fichaEditSchema` sin responsableId | ✅ | idem |
| `empresa.schema.ts` paginaWeb camelCase | ✅ | Linea 14; rg: 0 hits de `pagina_web` en produccion |
| `tareaUpdateSchema` 5 campos required | ✅ | Sin .partial(), sin fechaCompletada, sin tratoId |
| `usuarioUpdateSchema` nombre/correo required | ✅ | Sin .optional() en ambos |
| `useMoverFicha` con optimistic update completo | ✅ | onMutate/onError/onSuccess implementados |
| `useReordenarColumnas` wire format `[{value}]` | ✅ | Verificado con test de capturedBody |
| `useAutoFicha` payload limpio | ✅ | Sin MOCK_USER_ID, sin responsableId/creadoPor |
| `KanbanBoard` drag usa `useMoverFicha` | ✅ | buildDragEndHandler con firma MoverFichaVars |
| `fichasFixture` limpia | ✅ | Todos los mocks de ficha sin campos fantasma |
| `FichaForm` sin selector responsable muerto | ✅ | W1 cerrado |

---

## Coherence (Design)

| Decision | Seguida | Notas |
|---|---|---|
| D1 — wrapping ColumnaId en el front | ✅ | Comentario en hook; nota cross-team en archive-report |
| D2 — fichaSchema sin responsableId/creadoPor/creadoEn | ✅ | 0 hits en produccion |
| D3 — useMoverFicha con optimistic update | ✅ | 4 tests verdes |
| D4 — buildDragEndHandler nueva firma `{fichaId, targetColumnaId}` | ✅ | useUpdateFicha no usado para drag |
| D5 — useUpdateFicha se mantiene para ediciones generales | ✅ | Coexiste con useMoverFicha |
| D6 — FichaForm sin selector muerto | ✅ | W1 cerrado, tests actualizados TDD |

---

## Verdict

**PASS**

953 tests / 0 failed. `tsc --noEmit` 0 errores. Los 7 contract fixes implementados y verificados. Los 4 warnings W1-W4 cerrados en el mismo ciclo antes del archive. No queda deuda activa en este change.

---

## skill_resolution

`injected` — compact rules aplicadas desde instrucciones del orquestador (artifact store: hybrid; strict TDD activo).
