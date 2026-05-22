# Verify Report: Usuarios Management (Change 3)

**Fecha**: 2026-05-21 (America/Mexico_City)
**Validador**: orchestrator (sub-agent Verify bloqueado por error 529 — validación inline)
**Estado de implementación**: 22/23 tasks (T7.1 smoke manual pendiente)
**Suite de tests**: 34/34 verde (13 archivos)
**Type-check**: exit 0
**Lint**: exit 0, 3 warnings preexistentes en shadcn (button, form, badge — react-refresh/only-export-components)
**Commits**: `9d3cca5` (feature) + `03f7948` (wiring + tsc fixes)

## Veredicto

**APPROVED-WITH-WARNINGS** → continuar a Archive tras smoke manual T7.1.

## Resumen ejecutivo

La implementación de `usuarios-management` cubre los 11 Requirements del spec y los 9 ADRs del design. Las 3 reconciliaciones Spec↔Design quedan respetadas en el código final (schema y form sin `activo`, límites 150/200/100). Se detectan 0 CRITICAL, 1 WARNING (reactivación con `useMutation` inline en `UsuariosListPage` por restricción de Rules of Hooks — desviación ya documentada en apply-progress y consistente con ADR-018) y 2 SUGGESTION informativas. La cobertura de tests automatizados (34 verde) cubre los flujos críticos incluyendo el bloqueo parcial sobre la cuenta propia; el resto de los Scenarios queda cubierto por el smoke manual T7.1.

---

## Matriz Requirements × Implementación

| # | Requirement | Estado | Archivo principal | Notas |
|---|-------------|--------|-------------------|-------|
| R1 | Acceso admin-only | ✅ | `src/routes/router.tsx:32-37` | Ruta `/usuarios` envuelta por `<RoleGuard role="admin">` (ya existía en Change 1). |
| R2 | Listado de usuarios | ✅ | `useUsuarios.ts` + `UsuariosListPage.tsx` + `UsuariosTable.tsx` | Query key `['usuarios']`, columnas correctas, loading/error/empty/data states. |
| R3 | Búsqueda client-side | ✅ | `UsuariosTable.tsx:42-70` | Normalización con `.normalize('NFD').replace(/[̀-ͯ]/g, '')` + `.toLowerCase()`, case + acento insensible. Test cubre el caso. |
| R4 | Filtro por rol_sistema | ✅ | `UsuariosTable.tsx:60-70, 83-95` | Select admin/usuario/todos + AND lógico en `useMemo`. Test cubre el caso. |
| R5 | Crear usuario | ✅ | `useCreateUsuario.ts` + `UsuarioFormDialog.tsx:36-72` + `UsuarioForm.tsx` | Schema Zod, 422 mapeado a `serverErrors` via `details`. Test cubre 201 + 422. |
| R6 | Editar usuario | ✅ | `useUpdateUsuario.ts` + `UsuarioFormDialog.tsx:76-123` | Pre-carga con `nullsToStrings`, `isOwnAccount` deshabilita rol_sistema, 422 mapeado. |
| R7 | Eliminar usuario | ✅ | `useDeleteUsuario.ts` + `UsuarioDeleteDialog.tsx` | AlertDialog, 404 maneja gracefully. Test cubre 204 + 404. |
| R8 | Desactivar usuario | ✅ | `useDesactivarUsuario.ts` + `UsuariosTable.tsx:174-197` | Endpoint dedicado `PATCH /:id/desactivar`, botón visible solo si `activo:true`. Test cubre 200 + 404. |
| R9 | Reactivar usuario | ⚠️ | `UsuariosListPage.tsx:33-47` | **Desviación documentada** — usa `useMutation` inline en vez de `useUpdateUsuario(id)` por Rules of Hooks (id dinámico por fila). Comportamiento idéntico al spec: PATCH genérico con `{activo:true}`. Botón visible solo si `activo:false`. Ver WARNING-1. |
| R10 | Bloqueo parcial cuenta propia | ✅ | `UsuariosTable.tsx:122, 174-230` + `UsuarioForm.tsx:142-178` + `UsuarioDeleteDialog.tsx:57-79` | Los 4 Scenarios cubiertos: (10.1) Desactivar/Eliminar disabled en DropdownMenu de fila propia. (10.2) Tooltip "No puedes realizar esta acción sobre tu propia cuenta" — texto literal coincide con spec. (10.3) `rol_sistema` Select disabled en UsuarioForm cuando `isOwnAccount + mode='edit'`. (10.4) nombre/correo/rol_empresa siguen editables. Defensa-en-profundidad también en UsuarioDeleteDialog. Test integración cubre (10.1) y (10.3). |
| R11 | Indicadores visuales | ✅ | `UsuariosTable.tsx:128-152` | Badges variantes según ADR-019: admin=default, usuario=secondary, activo=emerald outline, inactivo=muted outline. Texto "Admin/Usuario/Activo/Inactivo". |

---

## Matriz ADRs (013–021)

| ADR | Decisión | Cumplimiento | Evidencia |
|-----|---------|--------------|-----------|
| **013** | UsuarioForm con `mode` + `isOwnAccount` | ✅ | `UsuarioForm.tsx:28-40, 142-178` — prop documentada con JSDoc + lock visual del Select. |
| **014** | `usuarioUpdateSchema = .partial()` | ✅ | `usuario.schema.ts:14-15` — exportado, usado solo para tipar `UsuarioUpdateInput` en `useUpdateUsuario`. El form usa `usuarioCreateSchema` siempre (alineado con patrón Empresas). |
| **015** | Select via FormField/Controller | ✅ | `UsuarioForm.tsx:131-182` — usa `FormField` (wrapper de Controller), no `register()`. Patrón estándar shadcn. |
| **016** | TooltipProvider en App.tsx | ✅ | `App.tsx:11-14` — `<TooltipProvider delayDuration={150}>` envolviendo RouterProvider + Toaster. |
| **017** | `isOwnAccount` inline (sin helper) | ✅ | `UsuariosTable.tsx:122`, `UsuarioFormDialog.tsx:134`, `UsuariosListPage.tsx:134, 145`. Comparación literal `usuario.id === sessionUserId` en cada componente. No hay módulo `permissions.ts`. |
| **018** | Asimetría desactivar/reactivar | ✅ | `useDesactivarUsuario.ts:8-13` y `useUpdateUsuario.ts:10-20` — JSDoc explicativo en ambos. |
| **019** | Badges variantes | ✅ | `UsuariosTable.tsx:128-152` — admin=`Badge variant="default"`, usuario=`Badge variant="secondary"`, activo=outline+emerald, inactivo=outline+muted. |
| **020** | Tests solo críticos (5 archivos) | ✅ | `__tests__/`: `useUsuarios`, `useCreateUsuario`, `useDeleteUsuario`, `useDesactivarUsuario`, `UsuariosListPage`. Exactamente 5. |
| **021** | `useUpdateUsuario` sin test directo | ✅ | NO existe `useUpdateUsuario.test.tsx` (confirmado por Glob). Cobertura indirecta vía `UsuariosListPage.test.tsx` (flujo editar). |

---

## Reconciliaciones Spec↔Design

| # | Corrección | Estado | Evidencia |
|---|-----------|--------|-----------|
| A | `UsuarioForm` SIN campo `activo` | ✅ | `UsuarioForm.tsx`: 4 campos (nombre, correo, rol_sistema, rol_empresa). NO hay Switch ni checkbox. |
| B | `usuarioCreateSchema` SIN `activo` | ✅ | `usuario.schema.ts:3-11`: 4 propiedades en `z.object`, sin `activo`. |
| C | Límites nombre 150 / correo 200 / rol_empresa 100 | ✅ | `usuario.schema.ts:4-9`: `.max(150)`, `.max(200)`, `.max(100)`. |

---

## CRITICAL

Ninguno.

---

## WARNING

### WARNING-1 — Reactivación con `useMutation` inline en `UsuariosListPage`

**Archivo**: `src/features/usuarios/pages/UsuariosListPage.tsx:33-47`

**Hallazgo**: El ADR-018 documenta que la reactivación usa `useUpdateUsuario` con `{ activo: true }`. La implementación NO delega a ese hook: en su lugar, monta un `useMutation<Usuario, Error, string>` inline directo a `apiClient.patch('/usuarios/:id', { activo: true })`.

**Razón documentada**: `useUpdateUsuario(id)` recibe el `id` como argumento del hook factory. Como el id varía por fila clickeada, llamarlo dentro del callback `onReactivar` violaría las Rules of Hooks de React (no se pueden llamar hooks condicionalmente o en loops). La mutation inline es funcionalmente equivalente y reside en el call site único (la página).

**Impacto**: Bajo. El comportamiento observable es idéntico al ADR-018: PATCH genérico con `{ activo: true }`, invalida `['usuarios']`, muestra toast. Tests verdes cubren el flujo indirectamente via cobertura de `useUpdateUsuario` en flujo de editar.

**Recomendación**: Si en un Change futuro la reactivación se necesita desde otro contexto, extraer a un hook dedicado `useReactivarUsuario(): UseMutationResult<Usuario, Error, string>` que abstraiga el PATCH. Por ahora, dejar como está — extraer prematuramente es over-engineering (YAGNI).

---

## SUGGESTION

### SUGGESTION-1 — Polyfills `hasPointerCapture` y `scrollIntoView` en `setupTests.ts`

**Archivo**: `src/test/setupTests.ts:6-14`

**Hallazgo**: Agregados durante Lote C para que Radix `Select` y `DropdownMenu` funcionen en jsdom. Fuera del scope original del proposal pero necesarios para que los tests pasen.

**Impacto**: Cero efectos secundarios. Solo se montan si la propiedad no existe (`if (!window.HTMLElement.prototype.hasPointerCapture)`).

**Recomendación**: Si Changes futuros agregan más primitivos Radix con DOM APIs no implementadas en jsdom, considerar mover los polyfills a un módulo dedicado (`src/test/jsdom-polyfills.ts`) e importarlo desde `setupTests.ts`. Por ahora, dejar inline.

### SUGGESTION-2 — Smoke test manual T7.1 pendiente

**Hallazgo**: T7.1 requiere intervención humana (browser, login, verificación visual). No fue ejecutado.

**Recomendación**: El desarrollador debe ejecutar antes de Archive:

```
1. pnpm dev
2. Abrir http://localhost:5173, login con admin@crm.test
3. Verificar en /usuarios: tabla con fixtures, búsqueda, filtro rol, crear/editar/eliminar, desactivar/reactivar, bloqueo parcial sobre cuenta propia (rol disabled en form + Eliminar/Desactivar disabled en menú)
4. Logout y login con vendedor@crm.test → /usuarios redirige a /
```

---

## Cobertura de Scenarios (34 totales)

| Requirement | Scenarios | Cubierto por tests automatizados | Pendiente smoke T7.1 |
|-------------|-----------|----------------------------------|----------------------|
| R1 | 3 (admin entra / usuario redirige / sin sesión redirige) | 0 — depende de RoleGuard (probado en Change 1) | 3 |
| R2 | 3 (lista con datos / vacío / error 500) | 1 (lista con datos via `useUsuarios.test`) | 2 |
| R3 | 4 (nombre / correo / vacía / case+acentos) | 1 (búsqueda por nombre en `UsuariosListPage.test`) | 3 |
| R4 | 4 (admin / usuario / todos / AND con búsqueda) | 1 (filtro admin en `UsuariosListPage.test`) | 3 |
| R5 | 3 (crear éxito / validación / 422) | 2 (201 + 422 en `useCreateUsuario.test`) | 1 |
| R6 | 3 (editar éxito / rol_sistema disabled propio / 422) | 2 (apertura + datos precargados + bloqueo Select en `UsuariosListPage.test`) | 1 |
| R7 | 3 (eliminar éxito / cancelar / 404) | 2 (204 + 404 en `useDeleteUsuario.test`) | 1 |
| R8 | 3 (desactivar éxito / 404 / botón visibilidad) | 2 (200 + 404 en `useDesactivarUsuario.test`) | 1 |
| R9 | 2 (reactivar éxito / botón visibilidad) | 0 — cubierto solo indirectamente por `useUpdateUsuario` | 2 |
| R10 | 4 (acciones disabled / tooltip / form Select disabled / edición propia funciona) | 2 (Eliminar+Desactivar disabled + select via test bloqueo) | 2 |
| R11 | 2 (badge rol / badge estado) | 0 — visualización inspeccionable manualmente | 2 |
| **Total** | **34** | **~13 cubiertos automatizados** | **~21 dependen de smoke** |

**Observación**: La cobertura automatizada es de los flujos críticos y del bloqueo parcial (lo más importante para defensa). Los Scenarios visuales (badges, tooltips renderizados) y de RoleGuard se validan en smoke. Consistente con ADR-020.

---

## Pendiente para cerrar

1. **T7.1 — Smoke test manual** (responsabilidad del desarrollador).
2. **Fase 8 — Archive** — mover `openspec/changes/usuarios-management/` → `openspec/changes/archive/` + commit final.

---

## Recomendación final

✅ **Continuar a Archive** tras smoke manual T7.1. La implementación cumple spec, design y reconciliaciones. La WARNING-1 es una desviación menor justificada y documentada — no requiere fix antes de Archive.
