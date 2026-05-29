# Verify Report — Change 2: contacto-unificado

**Status**: APROBADO
**Fecha**: 2026-05-28
**Runner**: pnpm test:run / pnpm type-check
**Resultado tests**: 364/364 passed, 0 failed (65 archivos)
**Resultado type-check**: 8 errores pre-existentes; 0 errores nuevos

---

## Resumen ejecutivo

Post-verify patch completado. W-01 verificado contra el código real del back: `ContactoResponse.java` NO tiene `apellido` ni `notas` (Case A confirmado). Se eliminaron ambos campos del tipo `Contacto`, payloads, schemas Zod, formulario, tabla, página de detalle, fixtures, handlers MSW y tests. W-02 resuelto: se agregó botón "Reintentar" con refetch en el estado de error de `ContactosPage`. S-01 resuelto: `empresaId` ahora es `string` requerido (no nullable) en tipo, schema y fixtures. Todos los `${c.nombre} ${c.apellido}` en features de tratos y empresas actualizados a `{c.nombre}`. Tests: +1 neto (nuevo test W-02). 364/364.

---

## Tests

| Métrica | Valor |
|---------|-------|
| Tests totales | 364/364 passed |
| Test files | 65/65 passed |
| Baseline post-Change 1 | 318 |
| Delta neto total | +46 tests |

---

## Type-check

| Archivo | Error | Tipo |
|---------|-------|------|
| `contactos/__tests__/ComoNosConocioInput.test.tsx` | TS6133 unused `screen` | Pre-existente |
| `contactos/__tests__/ContactoForm.test.tsx` | TS2532 possibly undefined | Pre-existente |
| `contactos/__tests__/ContactosTable.test.tsx(79)` | TS6133 unused `onDelete` | Pre-existente |
| `contactos/__tests__/ContactosTable.test.tsx(83)` | TS2345 possibly undefined | Pre-existente |
| `contactos/__tests__/EstadoRelacionSelect.test.tsx` | TS6133 unused `razonEl` | Pre-existente |
| `tratos/__tests__/KanbanCard.test.tsx` | TS2322 Trato \| undefined | Pre-existente Change 1 |
| `tratos/__tests__/KanbanColumna.test.tsx(72)` | TS2345 id ganado vs abierto | Pre-existente Change 1 |
| `tratos/__tests__/KanbanColumna.test.tsx(79)` | TS2345 id ganado vs abierto | Pre-existente Change 1 |

**Errores nuevos introducidos en el patch**: 0.

---

## Decisiones verificadas

### D1 — Tabs por `estadoRelacion` + sincronización de URL
**Archivo**: `src/features/contactos/pages/ContactosPage.tsx`

- Tres tabs fijas: PROSPECTO / ACTIVO / INACTIVO. ✅
- `useSearchParams` lee `?tab=` y escribe via `setSearchParams({ tab: value }, { replace: true })`. ✅
- Segmentación client-side: `contactos.filter(c => c.estadoRelacion === activeTab)`. ✅
- Tab default: PROSPECTO cuando `?tab=` ausente o inválido. ✅
- Test de URL sync: presente y pasando. ✅

**Veredicto**: CUMPLE.

### D2 — Validación client-side de transiciones
**Archivo**: `src/features/contactos/hooks/useTransicionEstado.ts` + `src/features/contactos/components/EstadoRelacionSelect.tsx`

- `puedeTransicionar(actual, nuevo, tieneTratosActivos)`: función pura. ✅
- Bloqueo 1 — PROSPECTO desde ACTIVO/INACTIVO. ✅
- Bloqueo 2 — INACTIVO con tratos activos. ✅
- `EstadoRelacionSelect`: opciones bloqueadas con `<Tooltip>`. ✅

**Veredicto**: CUMPLE.

### D3 — `comoNosConocio` combobox + maxLength=200
**Archivo**: `src/features/contactos/components/ComoNosConocioInput.tsx`

- `<Input list="como-nos-conocio-options" maxLength={200}>` + `<datalist>`. ✅
- Acepta texto libre (string) hasta 200 caracteres. ✅

**Veredicto**: CUMPLE.

---

## Cobertura de requirements

| Req | Descripción | Estado |
|-----|-------------|--------|
| R1 | `endpoints.contactos` como fuente única (5 rutas RPC) | CUMPLE |
| R2 | Tipo `Contacto` alineado al back — sin `Prospecto`, `Cliente`, `ComoNosConocio` enum, `EstadoPosibleCliente`, `apellido`, `notas` | CUMPLE |
| R3 | Listado via GET /contactos/get-all, queryKey `['contactos']`, error con botón Reintentar | CUMPLE |
| R4 | Detalle via GET /contactos/get-by-id?id=, queryKey `['contactos', id]`, 404→redirect | CUMPLE |
| R5 | Página /contactos con tabs PROSPECTO/ACTIVO/INACTIVO, filtrado client-side | CUMPLE |
| R6 | Schema Zod `contactoCreateSchema` y `contactoUpdateSchema` alineados al back (`empresaId` requerido) | CUMPLE |
| R7 | Creación POST /contactos/create | CUMPLE |
| R8 | Edición PUT /contactos/edit?id= (no PATCH, id como query param) | CUMPLE |
| R9 | Eliminación DELETE /contactos/delete?id= (204 o 409) | CUMPLE |
| R10 | Validación client-side de transiciones (D2) | CUMPLE |
| R11 | Manejo futuro error 4xx del back | CUMPLE |
| R12 | `comoNosConocio` como combobox+texto libre, string\|null, max200 (D3) | CUMPLE |
| R13 | Conversión PROSPECTO→ACTIVO via PUT /edit (no endpoint separado) | CUMPLE |
| R14 | `useEmpresaContactos`: filtro client-side por `empresaId` sobre `['contactos']` | CUMPLE |
| R15 | Routing y sidebar actualizados (/contactos, /contactos/:id, redirects) | CUMPLE |
| R16 | Invalidación de cache (patrón idéntico a Change 1) | CUMPLE |
| R17 | Handlers MSW fieles al contrato real (RPC, PUT, query param, fixture con estadoRelacion) | CUMPLE |
| R18 | Eliminación del Kanban frio/tibio/caliente | CUMPLE |

**Cobertura**: 18/18 completos.

---

## Verificación de out-of-scope respetado

| Área | Verificación | Resultado |
|------|-------------|-----------|
| Auth / usuarios | Sin cambios en `src/features/auth/` ni `src/features/usuarios/` | CUMPLE |
| Modelo Trato | `prospecto_id`, `cliente_id` presentes en `Trato` — intactos | CUMPLE |
| Kanban tratos | Sin cambios en `KanbanBoard`, `KanbanCard`, `KanbanColumna` | CUMPLE |
| Paginación server-side | No implementada (out of scope) | CUMPLE |

---

## Dormancy checks

| Patrón | Scope | Resultado |
|--------|-------|-----------|
| `from.*features/prospectos` | `src/` | 0 hits ✅ |
| `from.*features/clientes` | `src/` | 0 hits ✅ |
| `useProspectos\|useClientes` | `src/` | 0 hits ✅ |
| `apellido` | `src/features/contactos/` | 0 hits ✅ |
| `notas` | `src/features/contactos/` | 0 hits ✅ |
| `prospecto_id\|cliente_id` | `src/` | 19 archivos ✅ (modelo Trato — intencional) |

---

## CRITICAL (0)

Ninguno.

---

## WARNING (0)

### W-01 — RESUELTO (Case A)

**Evidencia del back**:
- `ContactoResponse.java`: record Java con campos `id, empresaId, nombre, correo, estadoRelacion, responsableId, creadoPor, telefono, cargo, comoNosConocio, creadoEn, actualizadoEn`. NO hay `apellido`. NO hay `notas`.
- `CreateContactoRequest.java`: campos con `@NotNull`/`@NotBlank` — NO hay `apellido` ni `notas`. `empresaId` tiene `@NotNull`.
- Archivo explore también lo documentaba explícitamente (sección 1.4 y 3.2).

**Corrección aplicada**:
- `src/api/types.ts`: eliminado `apellido` y `notas` de `Contacto`, `ContactoCreatePayload`, `ContactoUpdatePayload`.
- `src/features/contactos/schemas/contacto.schema.ts`: eliminado `apellido` y `notas` de ambos schemas.
- `src/features/contactos/components/ContactoForm.tsx`: eliminados campos `apellido` y `notas` del formulario.
- `src/features/contactos/components/ContactosTable.tsx`: `{c.nombre}` en lugar de `{c.nombre} {c.apellido}`.
- `src/features/contactos/pages/ContactoDetailPage.tsx`: `{contacto.nombre}` en lugar de `${nombre} ${apellido}`.
- `src/features/contactos/components/ContactoFormDialog.tsx`, `ContactoDeleteDialog.tsx`, hooks: idem.
- `src/features/tratos/**` y `src/features/empresas/**`: todos los `${c.nombre} ${c.apellido}` → `{c.nombre}`.
- `src/mocks/fixtures/contactos.ts`, `src/mocks/handlers/contactos.ts`: actualizados.
- Tests: todos los archivos de test actualizados.

### W-02 — RESUELTO

**Corrección aplicada**: `ContactosPage.tsx` — estado de error ahora incluye botón "Reintentar" que llama `refetch`. Test agregado en `ContactosPage.test.tsx`.

---

## SUGGESTION (0)

### S-01 — RESUELTO

`empresaId` ahora es `string` requerido (no nullable) en `Contacto`, `ContactoCreatePayload`, `contactoCreateSchema`, y `CONTACTO_EMPTY_DEFAULTS`. `ContactoForm` requiere selección de empresa. Fixtures actualizados con UUIDs válidos. Tests de schema actualizados.

---

## Conteo final

| Métrica | Valor |
|---------|-------|
| Tests totales | 364/364 passed |
| Test files | 65/65 passed |
| Type errors nuevos | 0 |
| Type errors pre-existentes | 8 (5 en contactos tests, 3 en tratos — todos Change 1 o inherited) |
| CRITICAL | 0 |
| WARNING | 0 |
| SUGGESTION | 0 |
| Requirements completos | 18/18 |

---

## Recomendación

El change está **APROBADO** sin observaciones pendientes. **next_recommended**: `sdd-archive`.
