# Proposal: alinear-contrato-mapeos (Change 2)

## Intent

Reconciliar el contrato front↔back contra el OpenAPI EN VIVO del back
(`GET http://localhost:8080/v3/api-docs`, fuente de verdad accesible). El back
siguió en desarrollo y agregó endpoints/campos que el front no consume, además
de un bug activo: el cambio de `estadoRelacion` de un contacto rompe con
`400 — nombre is required`.

Este es el Change 2 que `alinear-contrato-fixes` (Change 1) difirió
explícitamente a futuro (ver su Out of Scope). Scope acordado con el usuario:
**solo reconciliación** — nada de features nuevas (agendas, password, superusuarios).

## Scope

### In Scope

| # | ID | Riesgo | Descripcion |
|---|-----|--------|-------------|
| 1 | contactos/cambiar-estado | 🔴 CRITICO | El front cambia `estadoRelacion` con `PUT /contactos/edit` (reemplazo total → `nombre` null → 400). El back tiene `PUT /contactos/cambiar-estado?id={id}` body `{nuevoEstado}`. Migrar al endpoint dedicado. |
| 2 | empresa estadoRelacion editable | 🟡 ALTA | La empresa cambia su estado vía el form de edición (`PUT /empresas/edit`), NO por `cambiar-estado`. Se agrega `estadoRelacion` editable al form. (Decisión: a diferencia de contactos, no hay control inline de estado para empresa.) |
| 3 | ContactoUpdatePayload | 🔴 CRITICO | `nombre` y `estadoRelacion` son `optional()` en el tipo/schema; `EditContactoRequest` los marca `@NotBlank`/`@NotNull`. El tipo laxo es la raíz del bug #1 en cualquier caller de `edit`. Endurecer. |
| 4 | empresa campos nuevos | 🟡 MEDIA | `Create/EditEmpresaRequest` aceptan `estadoRelacion` y `notas`; el form no los manda. Agregar (campos de datos simples). |
| 5 | contacto campo cargo | 🟡 BAJA | `Create/EditContactoRequest` aceptan `cargo` (opt); el front lo ignora. Agregar al tipo/schema/form. |

**Cross-cutting obligatorio:** Los handlers MSW deben simular `cambiar-estado`
(hoy no existen) y la semántica de reemplazo total de `edit` (validar `nombre`),
para que los tests dejen de enmascarar bugs como hizo el de `nombre` null.

### Out of Scope

- `empresas` `responsableId` — requiere selector de usuarios (UI nueva, no contrato). Follow-up.
- `usuarios` `keycloakId` en edit — opcional en back, sin necesidad de UI.
- `/api/agendas/*` — recurso/feature nueva entera (Change futuro).
- `/api/superusuarios/*` — gestión técnica (Change futuro).
- `/api/usuarios/forgot-password` + `request-password-change` — flujo de password (Change futuro).
- `GET /api/fichas/get-by-id` — innecesario (se deriva de get-all).

## Capabilities afectadas

| Capability | Cambio |
|------------|--------|
| `contactos-management` | cambiar-estado endpoint+hook, ContactoUpdatePayload endurecido, campo `cargo` |
| `empresas-management` | cambiar-estado endpoint+hook, campos `estadoRelacion`/`notas` |

## Endpoints referenciados (verificados en OpenAPI en vivo)

| Metodo | Path | Item |
|--------|------|------|
| PUT | `/api/contactos/cambiar-estado?id={id}` body `{nuevoEstado}` | 1 |
| PUT | `/api/contactos/edit?id={id}` (EditContactoRequest) | 3, 5 |
| POST/PUT | `/api/empresas/create`, `/api/empresas/edit?id={id}` (incluye estadoRelacion) | 2, 4 |

## Risks

| Riesgo | Probabilidad | Mitigacion |
|--------|-------------|------------|
| El workaround actual en ContactoDetailPage (reenvía payload completo) queda muerto | Alta | Se reemplaza por useCambiarEstadoContacto; se revierte el workaround |
| Mocks no simulan cambiar-estado → tests verdes falsos | Alta | Agregar handlers cambiar-estado + validación @NotBlank en edit |

## Plan de rollback

Cambios en-archivo, sin migraciones. Rollback = `git revert`. Riesgo: BAJO.

## Success Criteria

- [x] `PUT /contactos/cambiar-estado` usado por ContactoDetailPage (no más edit completo para el estado).
- [x] `useCambiarEstadoContacto` existe con su test.
- [x] La empresa cambia estado vía `PUT /empresas/edit` (NO hay cambiar-estado de empresa).
- [x] `ContactoUpdatePayload` y `contactoUpdateSchema` requieren `nombre` + `estadoRelacion`.
- [x] empresa schema/form soportan `estadoRelacion` y `notas`; `EmpresaInfoTab` muestra `notas`.
- [x] contacto tipo/schema/form soportan `cargo`.
- [x] Handler MSW de contactos/cambiar-estado existe; `edit` valida `nombre`+`estadoRelacion`.
- [x] `pnpm test:run` verde, `pnpm type-check` 0 errores.
