# Verify Report: kanban-crud-ui (Change 5)

**Change**: kanban-crud-ui
**Version**: N/A (delta spec, no semver)
**Mode**: Strict TDD
**Date**: 2026-05-29
**Verifier**: sdd-verify sub-agent

---

## Completeness

| Metric | Value |
|--------|-------|
| Tasks total | 29 |
| Tasks complete | 29 |
| Tasks incomplete | 0 |

All 29 tasks across 5 batches are checked `[x]` in `openspec/changes/kanban-crud-ui/tasks.md`. No incomplete tasks.

---

## Build & Tests Execution

**Build**: ➖ Skipped — per Strict TDD protocol (`pnpm build` is NEVER run in this project)

**Tests**: ✅ 529 passed / ❌ 0 failed / ⚠️ 0 skipped

Real execution via `pnpm test:run` (vitest run), 70 test files. Exit code 0.
Apply claimed 529/529 — **CONFIRMED**.

```
Test Files  70 passed (70)
Tests      529 passed (529)
Duration   36.31s
```

Notable stderr warnings (non-blocking):
- `act(...)` warnings in `hooks.write.test.ts > useReordenarColumnas` (pre-existing, not introduced by Change 5)
- `NaN` warning for `value` attribute in `KanbanPage.test.tsx > (j)` — React warning about numeric input initial state, cosmetic only, test passes

**Type Check**: `pnpm type-check` → **❌ Exit code 2 — ERRORS FOUND**

Pre-existing errors (5 — Change 2, out of scope per brief):
- `contactos/__tests__/ComoNosConocioInput.test.tsx(2,18)`: `screen` unused
- `contactos/__tests__/ContactoForm.test.tsx(93,23)`: possibly undefined
- `contactos/__tests__/ContactosTable.test.tsx(79,21)` + `(83,22)`: unused var + possibly undefined
- `contactos/__tests__/EstadoRelacionSelect.test.tsx(136,11)`: unused var

**NEW errors introduced by Change 5 — 4 errors in kanban test files**:
```
src/features/kanban/__tests__/KanbanColumn.test.tsx(5,32): error TS6133: 'vi' is declared but its value is never read.
src/features/kanban/__tests__/KanbanPage.test.tsx(280,22): error TS2345: Argument of type 'HTMLElement | undefined' is not assignable to parameter of type 'Element'.
src/features/kanban/__tests__/KanbanPage.test.tsx(284,22): error TS2345: Argument of type 'HTMLElement | undefined' is not assignable to parameter of type 'Element'.
src/features/kanban/__tests__/KanbanPage.test.tsx(285,21): error TS2345: Argument of type 'HTMLElement | undefined' is not assignable to parameter of type 'Element'.
```

Detail of new errors:
1. `KanbanColumn.test.tsx:5` — `vi` is imported from vitest but never used (unused import). Trivial but real.
2. `KanbanPage.test.tsx:280,284,285` — In test `(j)`, `screen.getAllByRole('option')[0]` and `dialog.querySelectorAll(...)[0]` return `HTMLElement | undefined`; they are passed directly to `user.click()` which requires `Element` (not `Element | undefined`). Non-null assertion `!` was added for `submitBtn` but not for `options[0]`. The test passes at runtime because the element exists, but TypeScript cannot prove it statically.

**Coverage**: ➖ Not available (no coverage tool configured; `pnpm test:run` does not include `--coverage` by default)

---

## TDD Compliance

| Check | Result | Details |
|-------|--------|---------|
| TDD Evidence reported | ✅ | Full TDD Cycle Evidence table found in apply-progress #277 |
| All tasks have tests | ✅ | 12/12 RED+GREEN task pairs; all test files verified to exist |
| RED confirmed (tests exist) | ✅ | All test files present in `src/features/kanban/__tests__/` |
| GREEN confirmed (tests pass) | ✅ | 529/529 pass on execution — all new tests green |
| Triangulation adequate | ✅ | Most behaviors have 2–6 test cases; see notes on test (i) below |
| Safety Net for modified files | ✅ | Existing tests always ran before modification (batch verification steps) |

**TDD Compliance**: 6/6 checks passed

---

## Test Layer Distribution

| Layer | Tests | Files | Tools |
|-------|-------|-------|-------|
| Unit | ~25 | 2 | vitest |
| Integration | ~44 | 5 | vitest + RTL + MSW |
| E2E | 0 | 0 | not installed |
| **Total (Change 5 new)** | **~44** | **7** | |

- `schemas.test.ts` — unit (schema safeParse, no render, no HTTP)
- `hooks.read.test.ts` / `hooks.write.test.ts` — integration (renderHook + MSW)
- `KanbanCard.test.tsx` / `KanbanColumn.test.tsx` / `KanbanBoard.test.tsx` / `KanbanPage.test.tsx` — integration (RTL render + MSW)

---

## Changed File Coverage

Coverage analysis skipped — no coverage tool detected (no `--coverage` configured in vitest config or package.json test script).

---

## Assertion Quality

### Scan results

**KanbanColumn.test.tsx**
- Test `(d) badge GANADO` (L110–117): collects elements via `getAllByText(/ganado/i)` then finds one with `textContent === 'Ganado'`. Loop-like pattern but the `find()` is on a non-empty array (the column name "Ganados" already triggers the regex match). Not a ghost loop — the array is guaranteed non-empty. ✅ Acceptable.
- Test `(q)` not present in KanbanColumn.test.tsx — it's in KanbanPage context per apply-progress. Correct location is KanbanColumn.test.tsx lines 262–284.

**KanbanPage.test.tsx**
- Test `(i) asignarColumnaSchema rechaza limiteWip=0` (L213–226): This is a **direct schema unit test** embedded in the integration test file. It does NOT render any component; it calls `asignarColumnaSchema.safeParse(...)` directly. The apply-progress acknowledged this deviation: "Radix Dialog focus-trap + userEvent interactions in jsdom made an integration test unreliable. Used direct schema unit test instead." The test is substantive — it validates the exact error message. ⚠️ See Deviation Analysis below.

**KanbanCard.test.tsx test (d) `hasInteractiveRole`** (L100–106):
- Pattern: builds a boolean from multiple `.getAttribute()` / `.hasAttribute()` calls, then `expect(hasInteractiveRole).toBe(true)`. This is a disjunction over implementation attributes — technically an implementation-detail assertion. However it's testing DnD integration behavior that cannot be tested otherwise in jsdom (no drag API). ⚠️ WARNING — implementation detail, but pragmatically unavoidable with dnd-kit in jsdom.

**hooks.write.test.ts `useQuitarColumna` — 409 toast test** (L662–688):
- Spies on `toast.error` and asserts it was called with the specific message. Solid assertion. ✅

**No tautologies found** (no `expect(true).toBe(true)` patterns anywhere in Changed files).

**No ghost loops** (all `forEach`/`find` patterns over collections that are guaranteed non-empty by setup or guarded).

**Assertion quality**: 0 CRITICAL, 2 WARNING (see issues section)

---

## Spec Compliance Matrix

### Requirement: Crear ficha de trato

| Scenario | Test | Result |
|----------|------|--------|
| Dialog abre con columnaId precargado | `KanbanCard.test.tsx > FichaCreateDialog — columnaId precargado > (a)` | ✅ COMPLIANT |
| Selector de trato solo muestra tratos sin ficha | `KanbanCard.test.tsx > FichaForm — selector de tratos > (a)` | ✅ COMPLIANT |
| Creación exitosa envía creadoPor UUID válido | `KanbanCard.test.tsx > FichaCreateDialog — envío > (b)` | ✅ COMPLIANT |
| Error 422 muestra serverError en campo | `KanbanCard.test.tsx > FichaCreateDialog — error 422 > (d)` | ✅ COMPLIANT |
| tratoId requerido para ficha TRATO | `KanbanCard.test.tsx > FichaForm — validación > (c)` | ✅ COMPLIANT |

**5/5 scenarios compliant.**

Verified contract details:
- `creadoPor` sends `'00000000-0000-0000-0000-000000000001'` (UUID, not `'MOCK_USER'`): ✅ confirmed by test (b) capturing POST body
- `tipoFicha: 'TRATO'` included: ✅
- `columnaId` precargado + non-editable: ✅ shown as read-only `<p>` element
- 422 `serverErrors` map to field: ✅ `tratoId` field shows error text

---

### Requirement: Eliminar ficha de trato

| Scenario | Test | Result |
|----------|------|--------|
| Eliminación exitosa desde KanbanCard | `KanbanCard.test.tsx > KanbanCard — dropdown Eliminar > (e)` | ✅ COMPLIANT |
| Cancelar no invoca DELETE | `KanbanCard.test.tsx > KanbanCard — dropdown Eliminar > (f)` | ✅ COMPLIANT |

**2/2 scenarios compliant.**

Note: The spec mentions the `['fichas']` query must invalidate on success. This is tested in `hooks.write.test.ts > useDeleteFicha > invalida queryKey ["fichas"]`. ✅

---

### Requirement: Gestionar columnas del tablero

| Scenario | Test | Result |
|----------|------|--------|
| Asignar columna valida limiteWip >= 1 | `schemas.test.ts > asignarColumnaSchema > rechaza limiteWip: 0/-1` + `KanbanPage.test.tsx > (i)` | ✅ COMPLIANT |
| Asignar columna exitosa invoca asignar-columna | `KanbanPage.test.tsx > Batch 5 > (j)` | ✅ COMPLIANT |
| Quitar columna con fichas muestra error 409 | `hooks.write.test.ts > useQuitarColumna > 409 produce toast específico` + `KanbanColumn.test.tsx > (q)` | ⚠️ PARTIAL |
| Quitar columna vacía exitosa | `hooks.write.test.ts > useQuitarColumna > invalida queryKey tras 204` + `KanbanColumn.test.tsx > (p)` | ✅ COMPLIANT |

**3/4 scenarios fully compliant; 1 partial.**

Partial on "Quitar columna con fichas muestra error 409":
- The hook behavior (distinct toast message) IS tested in `hooks.write.test.ts` (integration hook test, passes).
- The component-level test `KanbanColumn.test.tsx > (q)` only verifies that the button re-enables after the error — it does NOT verify the toast message content at the component level.
- The spec says "se muestra mensaje que indica que la columna tiene fichas (distinto del mensaje 422 genérico)". The UI message behavior IS covered by the hook-layer test. The component test is weaker than what the spec requires at that layer.
- This is a WARNING, not CRITICAL, because the hook test does validate the actual 409 toast message correctly.

---

**Total compliance: 10/11 scenarios compliant, 1 partial.**

---

## Correctness (Static — Structural Evidence)

| Requirement | Status | Notes |
|------------|--------|-------|
| `MOCK_USER_ID` = valid UUID in `mockUser.ts` | ✅ Implemented | `'00000000-0000-0000-0000-000000000001'` — 36 chars, UUID format |
| `asignarColumnaSchema` with `limiteWip.min(1)` | ✅ Implemented | `columna.schema.ts:30` — `z.number().int().min(1, ...)` |
| `useTratosSinFicha` hook | ✅ Implemented | `kanban/lib/useTratosSinFicha.ts` — correct filter logic |
| `useQuitarColumna` hook with 409 vs 422 distinct | ✅ Implemented | `useQuitarColumna.ts:29-35` — 409 before 422 check, correct |
| `FichaForm` presentational with rhf+zod | ✅ Implemented | `FichaForm.tsx` — zodResolver, serverErrors via useEffect |
| `FichaCreateDialog` injects `creadoPor: MOCK_USER_ID` | ✅ Implemented | `FichaCreateDialog.tsx:47` |
| `FichaDeleteDialog` presentational AlertDialog | ✅ Implemented | `FichaDeleteDialog.tsx` — props open/onConfirm/onCancel/isDeleting |
| `KanbanColumn` with `tableroId` prop + "+" + "Quitar" buttons | ✅ Implemented | `KanbanColumn.tsx` — both buttons, FichaCreateDialog wired |
| `KanbanBoard` threads `tableroId` | ✅ Implemented | `KanbanBoard.tsx` — prop passed to each KanbanColumn |
| `KanbanCard` dropdown with `trato.nombre` resolution | ✅ Implemented | `KanbanCard.tsx:45` — `useTratos()` for name lookup, React Query deduplication |
| `KanbanPage` "Asignar columna" with `asignarColumnaSchema` | ✅ Implemented | `KanbanPage.tsx` — zodResolver wired, Dialog + useAsignarColumna |
| `['fichas']` invalidated on create/delete ficha | ✅ Implemented | `useCreateFicha` + `useDeleteFicha` onSuccess |
| `['tableros', tableroId]` invalidated on asignar/quitar columna | ✅ Implemented | `useAsignarColumna` + `useQuitarColumna` onSuccess |
| `nombre`/`color` nullable in `columnaSchema` | ✅ Verified | Pre-existing `columnaTableroSchema` already had nullable fields |

---

## Coherence (Design)

| Decision | Followed? | Notes |
|----------|-----------|-------|
| `MOCK_USER_ID` in `kanban/lib/mockUser.ts` | ✅ Yes | Exact location and value as designed |
| `FichaCreateDialog` + `FichaForm` split (homologa TratoCreateDialog) | ✅ Yes | Dialog injects columnaId/tipoFicha/creadoPor; form exposes tratoId/responsableId only |
| `useTratosSinFicha` as derived hook in `kanban/lib` | ✅ Yes | Correct location and filter logic |
| `useQuitarColumna` invalidates `tablerosKeys.detail(tableroId)` | ✅ Yes | Mirror of `useAsignarColumna` |
| `asignarColumnaSchema` separate from `columnaSchema` (catalog) | ✅ Yes | Two distinct schemas, catalog untouched |
| "+" and "Quitar columna" in KanbanColumn header | ✅ Yes | Correct location per design D6 |
| "Eliminar" in KanbanCard dropdown | ✅ Yes | DropdownMenu with DropdownMenuItem |
| "Asignar columna" at KanbanPage level | ✅ Yes | Dialog in KanbanPage.tsx |
| KanbanCard uses `useTratos()` internally (React Query deduplication) | ✅ Acceptable deviation | Design said "filter from useTratos()+useFichas()" but KanbanCard only needs trato.nombre — using only `useTratos()` is sufficient and correct. No N+1 due to deduplication. |
| `useTratosSinFicha` returns custom shape vs `UseQueryResult` | ✅ Acceptable deviation | Necessary because it composes two queries. Shape `{data, isSuccess, isLoading, isError, error}` covers all consumer needs. |

---

## Deviation Analysis (Apply-Reported Deviations)

| Deviation | Judgment | Severity |
|-----------|----------|----------|
| Test (i) uses `asignarColumnaSchema.safeParse` instead of DOM assertion for `limiteWip` validation | **Acceptable** — Schema is wired via `zodResolver` in `KanbanPage`. The schema unit test verifies the constraint; the component integration would add minimal value given jsdom focus-trap limitations with Radix Dialog. The existing KanbanPage test (j) confirms the full mutation path works. | SUGGESTION (see below) |
| Test (q) verifies button re-enables, not toast content | **Acceptable but weaker** — Toast content is covered by `hooks.write.test.ts` at the hook layer. The component test confirms the hook is wired. Missing the exact toast message at the component layer is a gap, but not critical. | WARNING |
| `useTratosSinFicha` returns custom shape `{data, isSuccess, isLoading, isError, error}` | **Acceptable** — Cannot directly return `UseQueryResult` when composing two queries. Shape is consistent and complete. | None |
| `KanbanCard` uses `useTratos()` internally | **Acceptable** — React Query deduplication prevents N+1. Name resolution is correct (`find` by id). Fallback chain (`tratoNombre ?? ficha.tratoId ?? 'Sin trato'`) is solid. | None |

---

## Regression Check — 485 Baseline Tests

The 485 baseline tests (before Change 5) must still pass. Total is 529 (485 + 44 new). Since ALL 529 pass, the 485 baseline tests are intact. ✅ No regressions.

---

## Issues Found

### CRITICAL (must fix before archive)
None.

### WARNING (should fix)

**W1**: `KanbanPage.test.tsx` introduces 3 new TypeScript errors (lines 280, 284, 285) — `HTMLElement | undefined` passed to `user.click()` which expects `Element`. The tests pass at runtime because the elements exist, but TypeScript cannot statically verify this. Fix: add non-null assertions (`options[0]!`, `submitBtn!` — already done for submitBtn but not options) or use `expect(options[0]).toBeDefined()` before using it.
- File: `src/features/kanban/__tests__/KanbanPage.test.tsx:280,284,285`
- Fix: `await user.click(options[0]!)` and `await user.clear(limiteWipInputs[0]!)`

**W2**: `KanbanColumn.test.tsx:5` — `vi` imported but never used. Unused import that TypeScript flags as error TS6133.
- File: `src/features/kanban/__tests__/KanbanColumn.test.tsx:5`
- Fix: Remove `vi` from the import: `import { describe, it, expect } from 'vitest';`

**W3**: Spec scenario "Quitar columna con fichas muestra error 409" (component-level toast message) is only verified at the hook layer, not at the component/column render layer. The `KanbanColumn.test.tsx > (q)` test only checks button state, not the toast message. This is acceptable given the hook test covers it, but it's a gap in the component test layer.
- File: `src/features/kanban/__tests__/KanbanColumn.test.tsx` — test (q)
- Fix (optional): Mock `toast` in KanbanColumn test and verify `toast.error` is called with the 409 message.

**W4**: `KanbanCard.test.tsx > (d)` uses implementation-detail attribute assertions (`card.getAttribute('role') === 'button' || card.hasAttribute('aria-grabbed')...`). This is a disjunction over internal dnd-kit attributes, not behavioral. The test intent is correct (verify draggability) but the assertion method is fragile — it will break if dnd-kit changes its internal attributes.
- File: `src/features/kanban/__tests__/KanbanCard.test.tsx:100-105`
- Fix (optional): If draggability cannot be tested behaviorally in jsdom, consider removing this test or replacing with an aria-based assertion that documents the expected user-facing role.

### SUGGESTION (nice to have)

**S1**: Test `(i)` in `KanbanPage.test.tsx` uses `asignarColumnaSchema.safeParse` directly instead of triggering the form UI. This is acceptable, but it means there's no test proving the `zodResolver` wiring in `KanbanPage` actually rejects invalid `limiteWip` at the UI level. Consider adding a UI-level test that types `0` in the limiteWip field, submits, and verifies the error message renders — this would be more rigorous than the schema unit test alone.

**S2**: `KanbanCard.test.tsx` has no test for the fallback case where `useTratos()` is loading and `tratoId` is non-null. Test (b) covers the sync case (QueryClient with no data yet), but a test with explicit loading state would be more explicit about intent.

---

## Verdict

**APPROVED WITH OBSERVATIONS**

- 529/529 tests pass (CONFIRMED — matches apply claim)
- 10/11 spec scenarios COMPLIANT; 1 PARTIAL (409 toast at component layer, covered at hook layer)
- Zero CRITICAL issues
- 4 new TypeScript errors introduced in test files (W1: 3 type errors in KanbanPage.test.tsx, W2: 1 unused import in KanbanColumn.test.tsx) — these are in test files only, do not affect production code, but they are regressions in type safety
- All design decisions followed; all 29 tasks complete
- No regressions in the 485 baseline tests
- Implementation correctly honors the Java contract: UUID creadoPor, limiteWip @Min(1), 409 vs 422 distinct, nombre/color nullable

**Recommended before archive**: Fix W1 and W2 (trivial — 2 lines of change in test files). W3 and W4 are optional improvements.
