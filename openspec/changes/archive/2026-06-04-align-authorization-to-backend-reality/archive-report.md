# Archive Report — align-authorization-to-backend-reality

**Fecha de archivo**: 2026-06-04
**Estado**: completed
**Decisión**: Opción B (eliminar el RoleGuard) — elegida por el usuario.

## Resumen

Se alineó el modelo de autorización del front a lo que el back realmente enforza
(solo autenticación). Se eliminó el gate de rol cosmético que daba falsa sensación de
seguridad.

## Cambios de código

| Archivo | Cambio |
|---|---|
| `src/components/layout/RoleGuard.tsx` | Eliminado |
| `src/components/layout/__tests__/RoleGuard.test.tsx` | Eliminado |
| `src/routes/router.tsx` | `/usuarios` y `/configuracion` sin wrapper de guard |
| `src/components/layout/Sidebar.tsx` | Sin `adminOnly`/`isAdmin`; ítems visibles a todo autenticado |
| `src/components/layout/__tests__/Sidebar.test.tsx` | Casos "NO ve" → "SÍ ve" |
| `src/api/client.ts` | Manejo honesto de 403 + normalización del `{error}` del back a `message` |

Commits: `9cc1276` (refactor auth), `5305a73` (feat api), `3c63646` (docs openspec).

## Sincronización de specs maestras

- **CREADA** `openspec/specs/frontend-authorization/spec.md` — capability nueva: el front no gatea por rol; manejo honesto de 401/403.
- **MODIFICADA** `openspec/specs/roles-management/spec.md` — derogado el requirement "Area de Configuracion admin-only en Sidebar y router"; ajustadas las menciones de contexto/contract.

## Verificación

- Sin referencias colgadas a `RoleGuard` en `src/`.
- `/usuarios` y `/configuracion` accesibles a cualquier autenticado; `ProtectedRoute` sigue protegiendo la frontera autenticado/no-autenticado.
- Build/tests NO ejecutados automáticamente (regla del proyecto). Validación funcional a cargo del usuario (checklist entregada).

## Deuda / siguiente

- Autorización de negocio real es responsabilidad del **back** (cuando exista, será otro change). Ver memoria `back-modelo-permisos-real` y `front-sin-gate-de-rol`.
