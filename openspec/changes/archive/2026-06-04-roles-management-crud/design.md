# Design: roles-management-crud (Change 9)

## Technical Approach

El Change 7 (`usuarios-contrato-rpc`) anticipó que si apareciera el CRUD de roles, se promoveria a `src/features/roles/` con un refactor barato de 2-3 archivos. Este change ejecuta exactamente esa promocion. El patron RPC ya está resuelto por los Changes 1-8; `roles` lo espeja. Este design documenta las tres decisiones que el patron existente NO cubre: (1) centralizar `useRoles` con un factory de keys para evitar el bug de caché doble, (2) manejo del 409 al eliminar un rol con usuarios asignados, y (3) el gate admin-only en el front con la deuda de autorización en el back.

## Decisión 1 — Centralización de `useRoles` con factory `rolesKeys`

**Choice**: `useRoles` vive en `src/features/roles/hooks/useRoles.ts` con un factory `rolesKeys`:

```ts
export const rolesKeys = {
  all: ['roles'] as const,
  list: () => ['roles'] as const,
  detail: (id: string) => ['roles', id] as const,
}
```

`src/features/usuarios/hooks/useRoles.ts` se **elimina**. Todos los imports en `features/usuarios/` (UsuarioForm, UsuariosListPage, UsuariosTable) se actualizan a `@/features/roles/hooks/useRoles`.

| Alternativa | Tradeoff | Veredicto |
|-------------|----------|-----------|
| Mantener dos `useRoles` en paralelo (uno en usuarios, otro en roles) | Cache doble: invalidar `['roles']` desde `RolesListPage` no refresca el selector de `UsuarioFormDialog` si usan queryKeys distintas. Bug garantizado. | Rechazada |
| Un `useRoles` en `features/usuarios/` (sin promocion) | El feature roles no podria importar desde `features/usuarios/` sin crear una dependencia inversa antinatural | Rechazada |
| Factory `rolesKeys` en `features/roles/hooks/useRoles.ts` | Un solo `['roles']` compartido; cualquier mutacion de roles (create/edit/delete) invalida la lista y el selector del `UsuarioFormDialog` se refresca automaticamente. Cero dependencia cruzada. | **Elegida** |

**Razon clave**: `rolesKeys.list() === ['roles']` (same reference) significa que `queryClient.invalidateQueries({ queryKey: rolesKeys.list() })` en los hooks de mutacion de roles impacta al `useRoles` del `UsuarioFormDialog`, evitando que el selector de roles muestre datos stale tras crear/editar un rol.

## Decisión 2 — Manejo de 409 en delete

**Choice**: El back retorna 409 Conflict cuando se intenta eliminar un rol con usuarios asignados. El `RolDeleteDialog` diferencia el 409 de cualquier otro error:

```ts
const ROL_CON_USUARIOS_MSG = 'Este rol tiene usuarios asignados y no puede eliminarse'

onError: (error) => {
  if (error.status === 409) {
    toast.error(ROL_CON_USUARIOS_MSG)
    // NO se cierra el dialog — el usuario puede cancelar manualmente
  } else {
    toast.error('No se pudo eliminar el rol')
    onOpenChange(false)
  }
}
```

| Alternativa | Tradeoff | Veredicto |
|-------------|----------|-----------|
| Cerrar el dialog siempre, toast informativo | El usuario pierde el contexto y puede no entender por qué falló | Rechazada |
| Mostrar el error inline en el dialog sin cerrar | El usuario ve el error en contexto y puede cancelar explícitamente | **Elegida** (via toast visible + dialog abierto) |

**Handler MSW**: implementa la regla 409 verificando si el `rolId` a eliminar aparece como `rolId` en el fixture de usuarios mock. Esto permite testear el flujo 409 sin depender del back real.

## Decisión 3 — Gate admin-only en el front (deuda back conocida)

**Choice**: El back NO gatea `/api/roles/**` por rol — cualquier JWT válido puede hacer CRUD de roles. El gate es responsabilidad del front vía `RoleGuard role="admin"`:

- Ruta `/configuracion` envuelta en `RoleGuard role="admin"` en `router.tsx`.
- Ítem "Configuración" en `Sidebar.tsx` con `adminOnly: true` — solo visible para usuarios con `rol_sistema === 'admin'`.
- Si un usuario no-admin accede directamente a `/configuracion`, el `RoleGuard` lo redirige (al igual que otras rutas protegidas del repo).

| Aspecto | Implementacion |
|---------|---------------|
| Visibilidad Sidebar | `adminOnly: true` en la definicion del item |
| Proteccion de ruta | `<RoleGuard role="admin">` envuelve `<RolesListPage />` |
| Deuda back | Registrada: el back deberia gatear `/api/roles/**` con `@PreAuthorize("hasRole('ADMIN')")`. No bloqueante para el front. |

## Decisión 4 — `activo` display-only, sin toggle

**Choice**: `activo` en `Rol` siempre es `true` al crear (el back no expone endpoint de toggle). Se muestra como badge informativo en `RolesTable` pero no hay acción de cambio.

Razon: coherente con D1 de `usuarios-contrato-rpc` (`activo` en Usuario también es READ-ONLY). El patron es uniforme en el repo.

## File Changes (solo lo no-trivial del patron)

| File | Action | Description |
|------|--------|-------------|
| `src/api/endpoints.ts` | Modify | roles.getById, create, edit, delete (getAll ya existia) |
| `src/features/roles/hooks/useRoles.ts` | Create | useRoles con factory rolesKeys |
| `src/features/roles/hooks/useCreateRol.ts` | Create | POST /roles/create; invalida rolesKeys.list() |
| `src/features/roles/hooks/useEditRol.ts` | Create | PUT /roles/edit?id=; invalida list + detail |
| `src/features/roles/hooks/useDeleteRol.ts` | Create | DELETE /roles/delete?id=; invalida list; maneja 409 |
| `src/features/roles/schemas/rol.schema.ts` | Create | rolCreateSchema + rolUpdateSchema |
| `src/features/roles/components/RolesTable.tsx` | Create | tabla con activo badge read-only |
| `src/features/roles/components/RolFormDialog.tsx` | Create | create + edit en un solo dialog |
| `src/features/roles/components/RolDeleteDialog.tsx` | Create | 204 → cierra; 409 → toast ROL_CON_USUARIOS_MSG sin cerrar |
| `src/features/roles/pages/RolesListPage.tsx` | Create | container page |
| `src/features/usuarios/hooks/useRoles.ts` | Delete | migrado a features/roles |
| `src/features/usuarios/` (imports) | Modify | actualizar a @/features/roles/hooks/useRoles |
| `src/mocks/handlers/roles.ts` | Modify | store mutable + CRUD + 409 |
| `src/components/layout/Sidebar.tsx` | Modify | ítem Configuración adminOnly |
| `src/routes/router.tsx` | Modify | ruta /configuracion bajo RoleGuard |

## Interfaces / Contracts

```ts
// endpoints.ts
roles: {
  getAll: () => '/roles/get-all',
  getById: (id: string) => `/roles/get-by-id?id=${id}`,
  create: () => '/roles/create',
  edit: (id: string) => `/roles/edit?id=${id}`,
  delete: (id: string) => `/roles/delete?id=${id}`,
}

// rol.schema.ts
const rolCreateSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(80, 'Máximo 80 caracteres'),
  descripcion: z.string().max(80).optional().or(z.literal('')),
})
const rolUpdateSchema = rolCreateSchema.partial()
```

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | Schemas Zod (nombre req/max80, descripcion opt) | Vitest unit |
| Hook | useRoles, useCreateRol, useEditRol, useDeleteRol contra MSW | renderHook + handlers |
| Component | RolesTable (render + callbacks), RolFormDialog (create/edit), RolDeleteDialog (204/409) | RTL |
| Integration | RolesListPage con store mutable; Sidebar admin vs user | RTL + MSW |

## Migration / Rollout

Sin migracion de datos. El unico impacto cross-feature es la relocalización de `useRoles`; los imports se actualizan mecánicamente. El `UsuarioFormDialog` se beneficia del refactor sin cambios en su código (el hook exporta la misma interfaz).

## Open Questions

- Ninguna. Gate de autorización en back es deuda conocida, no bloqueante. Todos los contratos del back verificados.
