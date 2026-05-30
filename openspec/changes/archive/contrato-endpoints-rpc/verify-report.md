# Verify Report — Change 1: contrato-endpoints-rpc

**Status**: OBSERVACIONES
**Fecha**: 2026-05-28
**Runner**: pnpm test:run / pnpm type-check
**Resultado tests**: 306/306 passed, 0 failed (64 archivos)
**Resultado type-check**: 3 errores pre-existentes (tratos, fuera de alcance); 0 errores nuevos

---

## Resumen ejecutivo

La implementación cubre correctamente la infraestructura F1, los handlers MSW F2, los hooks de empresas F3, el estado client-only F5, y la limpieza F6. Sin embargo, se detectaron **2 WARNING** y **1 SUGGESTION** relacionados con el cambio de diseño en `useTareas` (filtros que quedaron como query params en lugar de 100% client-side) y el schema de tarea (que mantiene los valores de formulario, no los del back). Ningún hallazgo es CRITICAL dado que el back ignora los query params y los tests pasan en verde.

---

## CRITICAL (0)

Ninguno.

---

## WARNING (2)

### W-01 — `useTareas` embebe filtros en queryKey y los pasa como query params al back

**Archivo**: `src/features/tareas/hooks/useTareas.ts`

**Spec**: `tareas-management` Requirement 5 — "La queryKey MUST ser `['tareas']` (sin filtros en la key). MUST NOT enviar query params de filtro al back."

**Implementación real**: `tareasKeys.list(filters)` produce `['tareas', filters ?? {}]`, no `['tareas']`. El `queryFn` construye `URLSearchParams` y agrega `trato_id`, `responsable_id`, `estado`, `prioridad`, `vencimiento`, `tipo` como query params.

**Tests afectados**: `TareasListPage.test.tsx` tests `(c)`, `(d)`, `(e)` verifican EXPLÍCITAMENTE que los query params se pasan al back (e.g., `expect(capturedUrl).toContain('estado=completada')`). Estos tests confirman y validan el comportamiento divergente.

**Impacto**: El back ignora los query params (retorna siempre todo), por lo que la funcionalidad opera correctamente en runtime. Sin embargo:
1. La queryKey embebida genera múltiples entradas en cache por combinación de filtros — el `useTareas({ trato_id: 'x' })` y `useTareas()` tienen keys distintas, causando doble fetch innecesario.
2. Si en el futuro el back implementa filtros server-side, la implementación ya está lista; pero actualmente viola la spec.
3. Decisión documentada en `apply-progress` (punto 2): "useTareas mantiene UseTareasFilters aunque el handler no filtre server-side".

**Clasificación**: WARNING (no es CRITICAL porque el back ignora los params y los 306 tests pasan; es una decisión arquitectural tomada conscientemente durante el apply, pero diverge de la spec).

---

### W-02 — Schema Zod de tarea no usa los enums del back

**Archivo**: `src/features/tareas/schemas/tarea.schema.ts`

**Spec**: `tareas-management` Requirement 2 — "TipoTarea MUST ser `GENERAL|SEGUIMIENTO|NEGOCIACION|CIERRE`"; Requirement 3 — "PrioridadTarea MUST ser `BAJA|MEDIA|ALTA|URGENTE`"; Requirement 4 — "`tareaCreateSchema` MUST validar... `tipo` enum..., `prioridad` enum... MUST NOT incluir campo `estado`."

**Implementación real**:
```ts
tipo: z.enum(['llamada', 'reunion', 'email', 'demo', 'seguimiento']),  // valores OLD del form
prioridad: z.union([z.literal(1), z.literal(2), z.literal(3)]),       // valores OLD numéricos
fecha_limite: z.string().nullable().optional(),  // nullable+opcional — spec dice requerido
estado: z.enum(['pendiente', 'en_progreso', 'completada']).optional(), // en tareaUpdateSchema — spec dice MUST NOT
```

**Divergencias concretas**:
1. `tipo` acepta `'llamada'` pero debería aceptar `'GENERAL'`; rechaza `'GENERAL'` como inválido.
2. `prioridad` acepta `1|2|3` pero debería aceptar `'BAJA'|'MEDIA'|'ALTA'|'URGENTE'`.
3. `fecha_limite` es nullable/opcional — la spec dice requerido (el back tiene `@NotNull`).
4. `tareaUpdateSchema` incluye `estado` — la spec dice MUST NOT.

**Nota crítica**: La tarea F4.3 documenta como decisión de implementación: "El schema de tarea.schema.ts se mantuvo con los valores del form (lowercase tipo, numeric prioridad). La traducción a valores del back ocurre en el hook `useCreateTarea`." Sin embargo, `useCreateTarea` envía el body SIN traducir los valores (envía `tipo: 'llamada'` al back, no `'GENERAL'`), lo que en runtime el back rechazaría si no tolerara esos valores.

**Impacto en tests**: `tarea.schema.test.ts` tests `(a)` usa `tipo: 'llamada'` y espera `success === true` — este test existe y pasa pero CONTRADICE la spec. La spec Requirement 2 Scenario dice: `tipo: 'llamada'` → `success === false`.

**Clasificación**: WARNING (los tests pasan porque testean la implementación real, no la spec; pero hay divergencia verificable entre spec y código).

---

## SUGGESTION (1)

### S-01 — `useEmpresaProspectos` y `useEmpresaClientes` usan rutas con id en el path

**Archivos**: `src/features/empresas/hooks/useEmpresaProspectos.ts`, `src/features/empresas/hooks/useEmpresaClientes.ts`

**Contexto**: Ambos hooks usan rutas literales `/empresas/${id}/prospectos` y `/empresas/${id}/clientes` con id en el path. Las tareas de F6.1 (limpieza de rutas literales) excluyen explícitamente estos hooks como "out-of-scope: deuda de Change 2". Los handlers MSW correspondientes también usan el mismo patrón (`/api/empresas/:id/prospectos`).

**Clasificación**: SUGGESTION — documentar en tasks de Change 2 que estas rutas deben migrarse a RPC cuando se reconcilien los endpoints de prospectos/clientes (actualmente el back no tiene esos endpoints verificados).

---

## Conformidad por requirement

### empresas-management (10 requirements)

| Req | Escenarios clave | Estado |
|-----|-----------------|--------|
| endpoints.ts como fuente única | `endpoints.empresas` sin `getById`, rutas correctas | CUMPLE |
| apiClient.put + BASE_URL /api | `apiClient.put` existe, `BASE_URL=/api` | CUMPLE |
| Listado con ruta RPC GET /empresas/get-all | queryKey `['empresas']`, tipo `Empresa[]` | CUMPLE |
| Filtros client-side | `useEmpresas` no embebe filtros en queryKey | CUMPLE |
| Detalle client-side desde get-all | `useEmpresa` lee cache `['empresas']`, NO emite get-by-id | CUMPLE |
| Payload create camelCase | `paginaWeb`, `estadoRelacion`, sin `pagina_web` | CUMPLE |
| Edición con PUT y ruta RPC | `apiClient.put(endpoints.empresas.edit(id), ...)` | CUMPLE |
| Eliminación con ruta RPC | `endpoints.empresas.delete(id)`, id en query param | CUMPLE |
| Invalidación de cache | `invalidateQueries(['empresas'])`, `removeQueries(['empresas', id])` | CUMPLE |
| Handlers MSW fieles al back | rutas RPC, PUT, query param, camelCase, sin filtros server-side | CUMPLE |

**Requisitos no cubiertos por tests**: 0 de 10 (todos cubiertos).

---

### tareas-management (12 requirements)

| Req | Escenarios clave | Estado |
|-----|-----------------|--------|
| endpoints.ts como fuente única de rutas | `endpoints.tareas` con `getById`, rutas correctas | CUMPLE |
| Enums del back TipoTarea/PrioridadTarea | Definidos en `types.ts`; schema los acepta en UI pero NO los valida en schema Zod (ver W-02) | DIVERGE |
| fechaLimite obligatorio como LocalDateTime | nullable/opcional en schema (ver W-02) | DIVERGE |
| Schema Zod alineado al back | `tipo`, `prioridad`, `fechaLimite` divergen (ver W-02); `estado` en updateSchema | DIVERGE |
| Listado con ruta RPC y filtros client-side | `useTareas` llama `get-all` pero pasa query params (ver W-01) | DIVERGE (parcial) |
| Crear con tratoId en el body | `POST /tareas/create` con `tratoId` en body | CUMPLE |
| Editar con PUT y ruta RPC | `apiClient.put(endpoints.tareas.edit(id), ...)`, sin `estado` | CUMPLE |
| Eliminar con ruta RPC | `endpoints.tareas.delete(id)`, id en query param | CUMPLE |
| Detalle con ruta get-by-id | `useTarea` → `endpoints.tareas.getById(id)` | CUMPLE |
| Estado client-only en localStorage | `useTareaEstado.ts`, clave `tarea-estado-${id}`, `useDeleteTarea` limpia en `onSuccess` | CUMPLE |
| Invalidación de cache | `invalidateQueries(tareasKeys.all)`, `removeQueries(tareasKeys.detail(id))` | CUMPLE |
| Handlers MSW fieles al back | rutas RPC, PUT, query param, sin `estado`, enums del back, `fechaLimite` datetime | CUMPLE |

**Requisitos con divergencias**: 4 de 12 (requirements 2, 3, 4, 5 — todos relacionados con W-01 y W-02).

---

## Verificación de alcance respetado

- **Tratos**: Solo cambios mecánicos de prefijo en `TratoDetailPage.tsx` (usa `useTareas` con `trato_id` y `getTareaEstado` — adaptación a nuevo contrato). Los hooks de tratos (usePerderTrato, useGanarTrato, useUpdateTrato, useDeleteTrato, useTrato) NO fueron modificados. KanbanBoard y KanbanCard intactos. CUMPLE.
- **Auth**: Sin cambios. CUMPLE.
- **Clientes/Prospectos**: Sin cambios a la lógica de dominio; solo el prefijo en handlers MSW actualizó de `/api/v1/` a `/api/`. CUMPLE.
- **Usuarios**: Sin cambios. CUMPLE.
- **useCompletarTarea eliminado**: confirmado — archivo y test no existen. CUMPLE.

---

## Errores type-check pre-existentes documentados

```
src/features/tratos/__tests__/KanbanCard.test.tsx(29,29):     TS2322 — Type 'Trato | undefined'
src/features/tratos/__tests__/KanbanColumna.test.tsx(72,19):  TS2345 — 'ganado' not assignable to 'abierto'
src/features/tratos/__tests__/KanbanColumna.test.tsx(79,19):  TS2345 — 'ganado' not assignable to 'abierto'
```

Estos 3 errores son pre-existentes, en archivos de tratos fuera del alcance de este change. Confirmados como el único output de `pnpm type-check`.

---

## Conteo final

| Métrica | Valor |
|---------|-------|
| Tests totales | 306/306 passed |
| Test files | 64/64 passed |
| Type errors nuevos | 0 |
| Type errors pre-existentes | 3 (en tratos, fuera de alcance) |
| CRITICAL | 0 |
| WARNING | 2 |
| SUGGESTION | 1 |

---

## Recomendación

El change puede **avanzar a sdd-archive** con los 2 WARNING documentados como deuda técnica aceptada (la decisión fue tomada conscientemente durante el apply y está documentada en `apply-progress`). Se recomienda registrar W-01 y W-02 como tareas de un Change 1.1 o Change 2 antes de la integración con el back real.

**next_recommended**: `sdd-archive` (con deuda documentada) o `sdd-apply` de un patch para W-01/W-02 si se decide resolver antes de cerrar el change.

---

## Re-verificación post-patch (2026-05-28)

**Status**: APROBADO
**Resultado tests**: 318/318 passed (12 tests nuevos respecto al verify anterior)
**Resultado type-check**: 3 errores pre-existentes (tratos, fuera de alcance); 0 errores nuevos
**CRITICAL**: 0 | **WARNING**: 0 | **SUGGESTION**: 1 (sin cambios — S-01 sigue out-of-scope)

### W-01 — CERRADO

**Cierre verificado en código**:
- `src/features/tareas/hooks/useTareas.ts`: `tareasKeys.all = ['tareas']`, `tareasKeys.list() = ['tareas']`, `tareasKeys.byTrato(_id) = ['tareas']`. `useTareas()` sin parámetros, `queryFn` llama `endpoints.tareas.getAll()` sin query params.
- `src/features/tareas/pages/TareasListPage.tsx`: filtros client-side con `useMemo` sobre `todasLasTareas`. `useTareas()` sin argumentos.
- `src/features/tratos/components/TratoTareasTab.tsx`: `useTareas()` sin argumentos + `useMemo` filtra por `tratoId`.
- `src/features/tratos/pages/TratoDetailPage.tsx`: `useTareas()` sin argumentos + `filter()` client-side por `tratoId`.
- Tests `(c)(d)(e)` en `TareasListPage.test.tsx`: verifican que la URL es exactamente `/api/tareas/get-all` con `url.search === ''`, y que cambiar un filtro NO genera un nuevo request al back.

### W-02 — CERRADO

**Cierre verificado en código**:
- `src/features/tareas/schemas/tarea.schema.ts`: `tipo: z.enum(['GENERAL', 'SEGUIMIENTO', 'NEGOCIACION', 'CIERRE'])`, `prioridad: z.enum(['BAJA', 'MEDIA', 'ALTA', 'URGENTE'])`, `fechaLimite: z.string().min(1)` (requerido). `tareaUpdateSchema` = `.omit({ tratoId, responsableId }).partial()` — sin campo `estado`. `TAREA_EMPTY_DEFAULTS.tipo = 'GENERAL'`, `.prioridad = 'MEDIA'`.
- `src/features/tareas/hooks/useCreateTarea.ts`: pasa body directo (camelCase con enums del back, sin traducción).
- Búsqueda de residuos `'llamada'|'reunion'|'demo'` en `src/features/tareas/`: solo aparecen en tests como casos negativos (verifican que el schema RECHAZA esos valores). CONFIRMADO.
- Búsqueda `prioridad.*[123]` en `src/features/tareas/`: solo aparecen en tests como casos negativos. CONFIRMADO.
- `src/features/tareas/__tests__/tarea.schema.test.ts` tests `(d)(e)(n)(o)`: verifican que valores front-style (`'llamada'`, `'demo'`, `2`, `1`) son rechazados por el schema.

### Conformidad final por requirement (tareas-management)

| Req | Estado anterior | Estado post-patch |
|-----|-----------------|-------------------|
| 1 — endpoints.ts fuente única | CUMPLE | CUMPLE (sin cambios) |
| 2 — Enums TipoTarea del back | DIVERGE (W-02) | CUMPLE |
| 3 — Enums PrioridadTarea del back | DIVERGE (W-02) | CUMPLE |
| 4 — Schema Zod alineado al back | DIVERGE (W-02) | CUMPLE |
| 5 — Filtros client-side sin query params | DIVERGE (W-01) | CUMPLE |
| 6–12 | CUMPLE | CUMPLE (sin cambios) |

**Cobertura final**: 12/12 (100%)

### Sanity general confirmado

- `pnpm type-check`: solo los 3 errores pre-existentes en `tratos/__tests__/` (KanbanCard.test.tsx, KanbanColumna.test.tsx). 0 errores nuevos.
- `pnpm test:run`: 318/318 tests verdes, 64/64 archivos (+12 respecto al verify anterior).
- Scope: cambios en auth/usuarios/clientes/prospectos son exclusivamente el cambio mecánico de prefijo `/api/v1/` → `/api/` en tests — confirmado como alcance de F1. Sin scope creep.
- S-01 (`useEmpresaProspectos`/`useEmpresaClientes`): no tocado — correcto, es deuda de Change 2.

**next_recommended**: `sdd-archive`
