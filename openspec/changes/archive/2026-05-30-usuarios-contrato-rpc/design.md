# Design: usuarios-contrato-rpc (Change 7)

## Technical Approach

El patrón RPC ya está resuelto por los Changes 1-6 (`endpoints.ts` + hooks `useQuery`/`useMutation` + handlers MSW). `usuarios` lo espeja sin novedad. Este design acota EXCLUSIVAMENTE las dos decisiones que el patrón existente NO cubre: (1) desacoplar la auth mock del tipo `Usuario` realineado, y (2) ubicar el feature `roles`. Refs: spec `usuarios-rpc` (tipos, CRUD) y `roles-lookup` (Rol, useRoles, lookup).

## Decisión 1 — Aislamiento `Usuario` vs `UsuarioSesion`

**Choice**: `Usuario`, `UsuarioSesion` y `Rol` viven los tres en `src/api/types.ts` (fuente única del contrato). `UsuarioSesion` es un tipo INDEPENDIENTE (no deriva de `Usuario` con `Pick`). `LoginResponse.usuario` pasa a tipo `UsuarioSesion`. `AuthUser` del authStore deriva de `UsuarioSesion`, no de `Usuario`. El fixture mock define `UsuarioMock = Usuario & { password, rol_sistema, rol_empresa }`.

| Alternativa | Tradeoff | Veredicto |
|-------------|----------|-----------|
| `UsuarioSesion` en `authStore.ts` | Acopla el contrato de sesión a la capa de estado; el handler de auth tendría que importar del store | Rechazada |
| `UsuarioSesion = Pick<Usuario, ...>` (legacy) | Rompe al sacar `rol_sistema`/`rol_empresa` de `Usuario`; reintroduce el acoplamiento que el change elimina | Rechazada (spec L44 lo prohíbe) |
| Tipo independiente en `types.ts` | Cero acoplamiento; auth y CRUD evolucionan por separado; `types.ts` sigue siendo la fuente única | **Elegida** |

**Contrato de tipos exacto** (en `src/api/types.ts`):

```ts
export interface Usuario {              // == UsuarioResponse del back
  id: string;
  nombre: string;
  correo: string;
  rolId: string;
  creadoEn: string;
  activo: boolean;                      // READ-ONLY (D1)
  keycloakId: string | null;
}

export interface UsuarioSesion {        // SOLO para auth mock; independiente
  id: string;
  nombre: string;
  correo: string;
  rol_sistema: RolSistema;
  rol_empresa: string | null;
}

export interface Rol {                  // == RolResponse del back
  id: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
}

export interface LoginResponse {
  token: string;
  usuario: UsuarioSesion;               // antes: Pick<Usuario, ...>
}
```

`authStore.ts`: `export type AuthUser = UsuarioSesion;` (o `Pick<UsuarioSesion, ...>` si se quiere reducir; el spec exige que exponga `rol_sistema`, que ya está). `RoleGuard.tsx` no cambia: sigue leyendo `usuario.rol_sistema`.

**Cómo NO se rompe el login**: el handler `auth.ts` ya construye `usuario` con `rol_sistema`/`rol_empresa` desde `UsuarioMock`. Como `UsuarioMock` conserva esos campos y `LoginResponse` ahora los exige vía `UsuarioSesion`, el handler compila sin cambios de lógica. El único ajuste en el fixture: `rol_sistema`/`rol_empresa`/`password` se mueven del tipo base `Usuario` al wrapper `UsuarioMock`, y se agrega `rolId`/`creadoEn`/`keycloakId` a cada registro. `toUsuarioDto` debe seguir devolviendo un `Usuario` válido (ya alineado), por lo que su `Omit` debe excluir `password`, `rol_sistema` y `rol_empresa`.

## Decisión 2 — Ubicación de `roles`

**Choice**: `roles` NO es un feature propio. Vive DENTRO de `src/features/usuarios/`. El hook `useRoles` y el helper de lookup son sub-módulos de `usuarios`.

| Alternativa | Tradeoff | Veredicto |
|-------------|----------|-----------|
| `src/features/roles/` feature-flat propio | Feature sin pages/components/CRUD propios (solo get-all consumido por usuarios); crea un feature anémico que viola el espíritu de "screaming"/cohesión | Rechazada |
| Dentro de `src/features/usuarios/` | Único consumidor real es usuarios; el hook es reutilizable por import directo si otro feature lo necesita después; cohesión alta | **Elegida** |

Rationale: ADR-040 feature-flat agrupa por dominio con UI propia. `roles` en este change es solo lectura auxiliar de `usuarios` (poblar select + lookup), sin pages ni CRUD. Un feature propio sería anémico. Si un día aparece CRUD de roles, se promueve a `src/features/roles/` (refactor barato: mover 2-3 archivos). El hook ya queda diseñado como reutilizable (spec `roles-lookup` L44).

**Helper de lookup `rolId → nombre`**: vive en `src/features/usuarios/lib/rolLookup.ts`. Función pura, testeable aislada, sin React:

```ts
export function resolveRolNombre(rolId: string, roles: Rol[]): string {
  return roles.find((r) => r.id === rolId)?.nombre ?? rolId;  // fallback = rolId
}
```

La tabla la llama con `roles ?? []` (cuando `useRoles` está pending → `[]` → devuelve `rolId`, satisface el scenario de fallback).

## File Changes (solo lo no-trivial del patrón)

| File | Action | Description |
|------|--------|-------------|
| `src/api/types.ts` | Modify | `Usuario` realineado; nuevos `UsuarioSesion`, `Rol`; `LoginResponse.usuario: UsuarioSesion` |
| `src/store/authStore.ts` | Modify | `AuthUser = UsuarioSesion` |
| `src/features/usuarios/lib/rolLookup.ts` | Create | helper puro `resolveRolNombre` |
| `src/features/usuarios/hooks/useRoles.ts` | Create | `useQuery(['roles'], endpoints.roles.getAll)` |
| `src/mocks/fixtures/usuarios.ts` | Modify | `UsuarioMock = Usuario & { password, rol_sistema, rol_empresa }`; registros con `rolId`/`creadoEn`/`keycloakId`; `toUsuarioDto` omite los 3 campos auth |
| `src/mocks/fixtures/roles.ts` | Create | ≥2 roles; `id` coincide con `rolId` de usuarios |
| `src/mocks/handlers/roles.ts` | Create | `GET /api/roles/get-all` |
| `src/mocks/handlers/index.ts` | Modify | registrar `rolesHandlers` |
| `src/api/endpoints.ts` | Modify | bloques `usuarios` (con `getById`) y `roles: { getAll }` |

(Resto de hooks/componentes/handlers de usuarios: cambios mecánicos por patrón RPC, ver proposal Affected Areas.)

## Interfaces / Contracts

`endpoints.roles = { getAll: () => '/roles/get-all' }`. `endpoints.usuarios = { getAll, getById, create, edit, delete }` (idéntico shape a `tareas`).

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | `Usuario`/`UsuarioSesion`/`Rol` campos; `resolveRolNombre` (match, fallback pending, fallback no-match); endpoints | type-level + función pura |
| Hook | `useRoles`, `useUsuarios`/create/edit/delete contra MSW | render-hook + handlers |
| Integration | login mock retorna `rol_sistema`; tabla muestra nombre rol; select poblado | RTL + MSW |

## Migration / Rollout

No migration. Cambios aislados; rollback vía `git revert` (proposal §Rollback).

## Open Questions

- None. D1-D5 cerradas; ubicación de `roles` y lookup decididos arriba. No se detectó decisión de producto pendiente.
