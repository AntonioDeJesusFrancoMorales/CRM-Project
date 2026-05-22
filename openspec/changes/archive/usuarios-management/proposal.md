# Proposal: Usuarios Management (Change 3)

**Change**: usuarios-management
**Fecha**: 2026-05-21
**Autor**: orchestrator + sub-agent
**Persistencia**: hybrid
**Strict TDD**: enabled

## Intent

Reemplazar el placeholder de `/usuarios` por la **vista admin-only de Usuarios funcional**: lista con búsqueda y filtro por rol, crear/editar/eliminar y desactivar usuarios, con bloqueo parcial para que el admin en sesión no pueda comprometer su propia cuenta.

## Scope

### In Scope

- Instalación de primitivos shadcn faltantes: `select`, `badge`, `tooltip`
- Feature completa `src/features/usuarios/` con 5 carpetas (`schemas/`, `hooks/`, `components/`, `pages/`, `__tests__/`)
- Schema Zod `usuario.schema.ts` con tipo `UsuarioInput` (mode-aware create/edit)
- 5 hooks TanStack Query: `useUsuarios`, `useCreateUsuario`, `useUpdateUsuario`, `useDeleteUsuario`, `useDesactivarUsuario`
- 4 componentes UI: `UsuariosTable`, `UsuarioForm` (reutilizable con prop `mode`), `UsuarioFormDialog`, `UsuarioDeleteDialog`
- Página `UsuariosListPage` (sin página de detalle dedicada — divergencia consciente respecto a Empresas)
- Tabla con búsqueda client-side por nombre/correo + filtro client-side por `rol_sistema` (admin/usuario/todos)
- Dialog modal para crear y editar usuario (form RHF+Zod)
- AlertDialog para confirmar eliminación
- Acción de **desactivar** vía endpoint dedicado `PATCH /usuarios/:id/desactivar`
- Acción de **reactivar** vía PATCH genérico (`useUpdateUsuario` con `{ activo: true }`)
- Badge visual para `rol_sistema` y estado `activo` en la tabla
- Bloqueo parcial del admin en sesión: puede editar su nombre/correo, NO puede cambiar su propio `rol_sistema`, desactivarse ni eliminarse — botones deshabilitados con `Tooltip` shadcn explicativo
- 5 tests Vitest strict-TDD (RED→GREEN): `useUsuarios`, `useCreateUsuario`, `useDeleteUsuario`, `useDesactivarUsuario`, `UsuariosListPage`
- Reemplazo de `UsuariosPlaceholder` por `UsuariosListPage` en el router

### Out of Scope

- Página de detalle de usuario (no aplica para este Change — no hay subrelaciones que mostrar)
- Cambio de contraseña (diferido — backend real lo resolverá, mock no maneja credenciales)
- Filtro por `activo` en la lista (decisión Q2: solo búsqueda + filtro por `rol_sistema` en esta iteración)
- Endpoint `PATCH /usuarios/:id/activar` (asimetría intencional — reactivación va por PATCH genérico)
- Modificaciones al modelo `Usuario` en `src/api/types.ts` (contrato congelado)
- Cambios al `RoleGuard` ni al router más allá del reemplazo de placeholder (la protección admin-only ya existe en Change 1)
- Cambios al `useAuthStore` (solo lectura del `usuario.id` para el bloqueo parcial)
- Cambios a Empresas, Login o cualquier otra feature
- Optimistic updates, paginación o ordenamiento server-side
- Dark mode toggle, responsive mobile

## Rationale

| Decisión | Rationale |
|----------|-----------|
| Bloqueo **parcial** (no duro) del admin en sesión | Permitir editar nombre/correo propios es razonable (caso real: corregir tipo en el correo). Bloquear lo crítico (rol, activo, delete) evita el escenario fatal de un admin que se autodegrada o se borra y deja el sistema sin administradores. Es el balance entre seguridad y usabilidad. |
| Filtro solo por `rol_sistema`, **no** por `activo` | El usuario decidió priorizar la dimensión más útil para el admin (segmentar staff vs. vendedores). El filtro por `activo` se puede agregar en un Change futuro si surge la necesidad — YAGNI. |
| Asimetría desactivar (endpoint dedicado) vs activar (PATCH genérico) | Es la realidad del contrato MSW actual. Documentarla como decisión de diseño (no como deuda) evita ruido en hooks y mantiene el contrato intacto. Si el backend real ofrece endpoint dedicado de activar en el futuro, refactor menor. |
| Diferir cambio de contraseña | El mock no maneja credenciales y el endpoint real probablemente requiera un flujo separado (validación de password anterior, recuperación por correo, etc.). Forzarlo aquí inflaría el scope sin valor entregable. |
| Sin cambios al modelo `Usuario` | El contrato ya cubre todos los campos necesarios (id, nombre, correo, rol_sistema, rol_empresa, activo, creado_en). Agregar campos especulativos viola el contrato y obliga a sincronizar con backend. |
| Instalar `tooltip` shadcn en vez de `title` HTML nativo | `title` se ve pobre, tarda en aparecer, no es accesible vía teclado y rompe la consistencia visual con el resto de la app (que ya usa shadcn). `Tooltip` shadcn es accesible y consistente. |
| Instalar `select` shadcn | Obligatorio para el campo `rol_sistema` en el form. El `<select>` nativo no encaja con el design system. |
| Instalar `badge` shadcn | Visual claro en tabla para `rol_sistema` (admin/usuario) y estado (`activo`/`inactivo`). Patrón ya usado en otras feature de la industria. |
| Sin página de detalle | A diferencia de Empresas, Usuarios no tiene subrelaciones que listar (no hay "prospectos del usuario", "clientes del usuario", etc.). Toda la info cabe en la fila + el modal de edición. Crear una página de detalle sería over-engineering. |
| Reutilizar `UsuarioForm` con prop `mode: 'create' \| 'edit'` | Patrón probado en Change 2 (`EmpresaForm`, ADR-007). Reduce duplicación y mantiene consistencia visual. |

## Affected Components

### Archivos a CREAR (15)

**Schemas (1)**
- `src/features/usuarios/schemas/usuario.schema.ts`

**Hooks (5)**
- `src/features/usuarios/hooks/useUsuarios.ts`
- `src/features/usuarios/hooks/useCreateUsuario.ts`
- `src/features/usuarios/hooks/useUpdateUsuario.ts`
- `src/features/usuarios/hooks/useDeleteUsuario.ts`
- `src/features/usuarios/hooks/useDesactivarUsuario.ts`

**Components (4)**
- `src/features/usuarios/components/UsuariosTable.tsx`
- `src/features/usuarios/components/UsuarioForm.tsx`
- `src/features/usuarios/components/UsuarioFormDialog.tsx`
- `src/features/usuarios/components/UsuarioDeleteDialog.tsx`

**Pages (1)**
- `src/features/usuarios/pages/UsuariosListPage.tsx`

**Tests (5)**
- `src/features/usuarios/__tests__/useUsuarios.test.tsx`
- `src/features/usuarios/__tests__/useCreateUsuario.test.tsx`
- `src/features/usuarios/__tests__/useDeleteUsuario.test.tsx`
- `src/features/usuarios/__tests__/useDesactivarUsuario.test.tsx`
- `src/features/usuarios/__tests__/UsuariosListPage.test.tsx`

### Archivos a MODIFICAR (2)

- `src/routes/router.tsx` — reemplazar `<UsuariosPlaceholder />` por `<UsuariosListPage />` en la ruta `/usuarios`
- `src/routes/placeholders.tsx` — eliminar el export de `UsuariosPlaceholder`

### Archivos a INSTALAR (3 shadcn primitives)

- `src/components/ui/select.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/tooltip.tsx`

Comando paso 0 de Apply: `pnpm dlx shadcn@latest add select badge tooltip --yes --overwrite`

### Archivos NO tocados (contrato congelado)

- `src/api/types.ts` — modelo `Usuario` y `RolSistema` intactos
- `src/api/usuarios.ts` (cliente HTTP) — endpoints existentes, sin cambios
- `src/mocks/handlers/usuarios.ts` — handler MSW intacto (asimetría activar/desactivar es la fuente de verdad)
- `src/mocks/fixtures/usuarios.ts` — fixture de 2 usuarios intacto
- `src/store/authStore.ts` — solo lectura del `usuario.id`
- `src/components/RoleGuard.tsx` — protección admin-only ya implementada en Change 1
- Empresas, Login o cualquier otra feature

## Entregables defensibles (qué puede mostrar el alumno al revisor)

- Vista `/usuarios` accesible solo para admin (RoleGuard ya activo) con tabla de los 2 usuarios del fixture
- Búsqueda en vivo por nombre o correo
- Filtro por `rol_sistema` (admin / usuario / todos) funcional
- Dialog "Nuevo usuario" con validación Zod (correo válido, rol obligatorio)
- Edición de usuario con campos pre-cargados desde la fila
- Eliminación con confirmación AlertDialog y manejo del 404
- Botón "Desactivar" llamando al endpoint dedicado + botón "Reactivar" llamando al PATCH genérico
- Bloqueo visual para la cuenta del admin en sesión: botones de eliminar/desactivar/cambiar rol deshabilitados con `Tooltip` shadcn explicando por qué
- Badge de rol y estado en cada fila
- Tests Vitest pasando: 5 nuevos + los existentes de Empresas y Login (todos verdes)
- `pnpm lint`, `type-check`, `test:run` con exit 0

## Dependencias y orden

- **Depende de**: Change 1 (foundation: bootstrap, MSW, layout, auth, `RoleGuard`), Change 2 (empresas-crud: establece el patrón a replicar). Ambos completados.
- **Bloquea**: nada. Changes 4-8 son independientes de Usuarios.
- **Patrón**: réplica exacta de `src/features/empresas/` (ADR-007 a ADR-012 aplican con adaptaciones — sin página de detalle, con 5 hooks en vez de 7, con bloqueo parcial nuevo).

## Riesgos y mitigaciones

| Riesgo | Probabilidad | Mitigación |
|--------|--------------|------------|
| Strict TDD ralentiza el ritmo | Media | Cubrir solo hooks críticos + página de lista. NO escribir tests para componentes presentacionales (`UsuariosTable`, `UsuarioForm`). |
| `useUpdateUsuario` queda sin test directo | Baja | Se ejercita indirectamente desde `UsuariosListPage.test.tsx` (flujo de editar) y desde `useDesactivarUsuario.test.tsx` (flujo de reactivar). Si surge bug, agregar test puntual. |
| Bloqueo parcial mal aplicado podría dejar al admin sin acceso | Baja | Bloqueo es **client-side** (deshabilitar botones) — el backend mock NO valida. Si el bug aparece, el peor caso es deshabilitar acciones de más, no de menos. Test específico en `UsuariosListPage.test.tsx` cubre el caso. |
| `Select` shadcn rompe `react-hook-form` por integración manual | Media | Usar el patrón `Controller` de RHF (ya documentado en shadcn docs). Si falla, fallback a `<select>` nativo estilado con Tailwind. |
| Tooltip de shadcn requiere `<TooltipProvider>` global | Baja | Envolver `UsuariosListPage` (o el app shell) con `<TooltipProvider>`. Documentar en el task. |
| Asimetría activar/desactivar confunde a futuros mantenedores | Baja | Documentar explícitamente en JSDoc de `useDesactivarUsuario` y en el spec. |
| Re-renders excesivos por filtro client-side con muchos usuarios | Muy baja | Solo 2 usuarios en el fixture. Si crece, memoizar con `useMemo`. YAGNI por ahora. |

## Cronograma macro de fases

| Fase | Estado |
|------|--------|
| Explore | completado |
| Propose | en curso |
| Spec | pendiente |
| Design | pendiente |
| Tasks | pendiente |
| Apply (Strict TDD) | pendiente |
| Verify | pendiente |
| Archive | pendiente |

## Rollback Plan

`rm -rf src/features/usuarios/`. Restaurar export de `UsuariosPlaceholder` en `placeholders.tsx` y referencia en `router.tsx`. Los 3 primitivos shadcn (`select`, `badge`, `tooltip`) pueden quedarse instalados (no estorban) o eliminarse si se quiere limpieza total. Reversible 100%.

## Success Criteria

- [ ] Login como admin → `/usuarios` muestra tabla con 2 fixtures
- [ ] Login como usuario no-admin → `/usuarios` redirige (RoleGuard ya activo)
- [ ] Crear usuario abre Dialog, submit éxito refresca lista
- [ ] Editar usuario carga datos en Dialog, submit éxito actualiza fila
- [ ] Eliminar abre AlertDialog, confirma → fila desaparece + toast
- [ ] Desactivar usuario llama al endpoint dedicado, fila refleja estado inactivo
- [ ] Reactivar usuario inactivo funciona vía PATCH genérico
- [ ] Búsqueda filtra por nombre+correo en tiempo real
- [ ] Filtro por `rol_sistema` (admin/usuario/todos) funciona
- [ ] Admin en sesión: botones de eliminar/desactivar/cambiar-rol propios deshabilitados con Tooltip
- [ ] 5 tests nuevos + suite existente verde
- [ ] `pnpm lint`, `type-check`, `test:run` exit 0
