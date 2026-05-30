# Exploration: usuarios-contrato-rpc (Change 7)

**Fecha**: 2026-05-30
**Base**: feat/kanban-tareas (Change 6 archivado, 582/582 tests verdes)
**Investigador**: sdd-explore sub-agent

---

## Current State

### Front — estado actual del feature usuarios

El feature `src/features/usuarios/` existe y está funcional, pero usa **convenciones REST legacy** (rutas REST con path params y métodos PATCH) en lugar del patrón RPC del back real.

| Aspecto | Estado actual | Estado requerido |
|---------|--------------|-----------------|
| Rutas | `/usuarios`, `/usuarios/:id`, `/usuarios/:id/desactivar` | `/usuarios/get-all`, `/usuarios/create`, `/usuarios/edit?id=`, `/usuarios/delete?id=` |
| Métodos | GET/POST/PATCH/DELETE (path params) | GET/POST/PUT/DELETE (query params) |
| Endpoints.ts | No incluye bloque `usuarios` | Debe agregarse |
| Tipo `Usuario` en api/types.ts | `rol_sistema: 'admin'\|'usuario'`, `rol_empresa: string\|null`, `creado_en: string` (snake_case) | `rolId: string` (UUID), `creadoEn: string` (camelCase) — ver divergencias |
| Schema Zod | `rol_sistema`, `rol_empresa` (inventados) | `rolId: UUID`, `nombre`, `correo`, `initialPassword` (create) |
| `useDesactivarUsuario` | apunta a `PATCH /usuarios/:id/desactivar` (NO EXISTE en el back) | debe eliminarse |
| `useUpdateUsuario` | `PATCH /usuarios/:id` | debe migrar a `PUT /usuarios/edit?id=` |
| `useUsuarios` | `GET /usuarios` | `GET /usuarios/get-all` |
| `useCreateUsuario` | `POST /usuarios` | `POST /usuarios/create` |
| `useDeleteUsuario` | `DELETE /usuarios/:id` | `DELETE /usuarios/delete?id=` |
| MSW handlers | rutas legacy + handler `/desactivar` inventado | rutas RPC, eliminar `/desactivar` |

### Back — contrato verificado (Java real)

**Archivo**: `infrastructure/.../rest/UsuarioController.java` (líneas 38-96)
- `@RequestMapping("/api/usuarios")`
- `POST /create` → `@RequestBody CreateUsuarioRequest` → `201 Created` con `UsuarioResponse`
- `GET /get-all` → `List<UsuarioResponse>`
- `GET /get-by-id?id=UUID` → `UsuarioResponse`
- `PUT /edit?id=UUID` → `@RequestBody EditUsuarioRequest` → `UsuarioResponse`
- `DELETE /delete?id=UUID` → `204 No Content`

**CreateUsuarioRequest** (`infrastructure/.../dto/request/CreateUsuarioRequest.java`, líneas 15-33):
```java
record CreateUsuarioRequest(
  @NotBlank String nombre,           // max 100
  @NotBlank @Email String correo,    // max 120
  @NotNull UUID rolId,               // obligatorio
  @NotBlank String initialPassword,  // para Keycloak, nunca persiste
  String keycloakId                  // opcional, max 255
)
```

**EditUsuarioRequest** (`...dto/request/EditUsuarioRequest.java`, líneas 14-28):
```java
record EditUsuarioRequest(
  @NotBlank String nombre,
  @NotBlank @Email String correo,
  UUID rolId,                // puede ser null (preserva existente)
  String keycloakId          // opcional
)
// AUSENCIA CRÍTICA: NO tiene campo `activo`
```

**EditUsuarioCommand** (`application/.../usuario/command/EditUsuarioCommand.java`, líneas 11-17):
```java
record EditUsuarioCommand(UUID id, String nombre, String correo, UUID rolId, String keycloakId)
// Javadoc explicita: "Does NOT include id/rolId/creadoEn/activo — preserved from the existing entity"
```

**EditUsuarioService** (`application/.../usuario/service/EditUsuarioService.java`, líneas 49-56):
```java
Usuario updated = Usuario.reconstitute(
    existing.getId(),
    command.nombre(),
    command.correo(),
    existing.getRolId(),   // ← preserva rolId del existente (ignora el del command si null)
    existing.getCreadoEn(),
    existing.isActivo(),   // ← PRESERVA activo del existente, NO se puede cambiar via PUT /edit
    keycloakId
);
```

**UsuarioResponse** (`...dto/response/UsuarioResponse.java`, líneas 11-18):
```java
record UsuarioResponse(
  UUID id,
  String nombre,
  String correo,
  UUID rolId,
  LocalDateTime creadoEn,
  boolean activo,
  String keycloakId
)
```

**Usuario domain** (`domain/.../entity/Usuario.java`): tiene `withActivo(boolean)` pero es un método interno de dominio — NO está expuesto via ningún endpoint REST.

---

## DECISIÓN PRINCIPAL RESUELTA: campo `activo` — desactivar/reactivar

**Veredicto**: El back NO permite cambiar `activo` vía ningún endpoint REST existente.

Evidencia directa:
1. `EditUsuarioRequest` (líneas 14-28): no tiene campo `activo`
2. `EditUsuarioCommand` (Javadoc línea 8): "Does NOT include ... activo — preserved from the existing entity"
3. `EditUsuarioService` (línea 55): `existing.isActivo()` hardcodeado — el comando no influye
4. `Usuario.withActivo()` (líneas 112-122): método de dominio sin exposición REST

**Conclusión**: Las funcionalidades de `useDesactivarUsuario` (`PATCH /usuarios/:id/desactivar`) y `reactivarMutation` (`PATCH /usuarios/:id { activo: true }`) en `UsuariosListPage` llaman a endpoints que **no existen en el back real**. Son puro mock local.

**Opciones**:
- **Opción A — Quitar desactivar/reactivar del front** (recomendada): Eliminar `useDesactivarUsuario`, `reactivarMutation`, y los botones Desactivar/Reactivar de la UI. El campo `activo` en `UsuarioResponse` queda como dato de solo lectura (badge de estado visible). Pros: elimina deuda técnica, alineación perfecta con el back. Contras: pérdida de funcionalidad de activación/desactivación desde el CRM.
- **Opción B — Diferir**: Mantener los hooks y handlers MSW de desactivar/reactivar como mock local, con comentario explícito indicando que son funcionalidades pendientes de endpoint en el back. Pros: la UI sigue funcionando en desarrollo. Contras: la deuda crece y puede confundir; violaría el principio "el back es la fuente de verdad".

**Recomendación**: Opción A. El campo `activo` es solo lectura desde el front; se muestra en la tabla como badge de estado. Si el back en el futuro agrega el endpoint, es un Change nuevo.

---

## Divergencias de schema (front vs back)

| Campo | Front actual (api/types.ts) | Back real (UsuarioResponse) | Acción |
|-------|---------------------------|----------------------------|--------|
| `id` | `string` | `UUID` → serializa como `string` | OK, sin cambio |
| `nombre` | `string` | `String` | OK |
| `correo` | `string` | `String` | OK |
| `rol_sistema` | `'admin' \| 'usuario'` | **NO EXISTE** — el back tiene `rolId: UUID` | Reemplazar por `rolId: string` |
| `rol_empresa` | `string \| null` | **NO EXISTE** — el back no tiene este campo | Eliminar del tipo `Usuario` |
| `activo` | `boolean` | `boolean` | OK |
| `creado_en` | `string` (snake_case) | `LocalDateTime creadoEn` → serializa camelCase | Renombrar a `creadoEn` |
| `keycloakId` | NO EXISTE | `String keycloakId` (opcional) | Agregar como `string \| null` |

**Impacto en componentes**:
- `UsuariosTable.tsx`: usa `u.rol_sistema`, `u.rol_empresa`, `u.creado_en` → deben migrar a `u.rolId`, `u.creadoEn`. El campo `rol_empresa` se elimina de la tabla o se reemplaza por otro dato significativo.
- `UsuarioForm.tsx`: usa `rol_sistema` y `rol_empresa` como campos del form → el form debe adaptarse: en create se pide `rolId` (UUID selector), en edit ídem.
- `UsuariosListPage.tsx`: `usuario.rol_sistema === 'admin'` → ya no aplica directamente; la UI necesita resolver el rol desde un lookup de roles.
- Schema Zod (`usuario.schema.ts`): reescribir completamente — `nombre`, `correo`, `rolId` (UUID), `initialPassword` (solo en create).
- Fixture `usuariosFixture`: los campos deben adaptarse al nuevo tipo `Usuario` (rolId en lugar de rol_sistema/rol_empresa, creadoEn en lugar de creado_en). **El fixture comparte `findUsuarioByCreds` con auth** (ver abajo).

---

## Análisis de auth mock — preservar login

**Hallazgo crítico**: `authHandlers` (`src/mocks/handlers/auth.ts`) importa directamente `findUsuarioByCreds` y `findUsuarioById` de `src/mocks/fixtures/usuarios.ts`.

El login mock (`POST /api/auth/login`) hace:
```typescript
const user = findUsuarioByCreds(body.email!, body.password!);  // busca por correo + password + activo
const response: LoginResponse = {
  token: fakeJwt({ id: user.id, nombre: user.nombre, rol_sistema: user.rol_sistema }),
  usuario: { id, nombre, correo, rol_sistema, rol_empresa }   // ← usa rol_sistema y rol_empresa
}
```

El `GET /api/auth/me` usa `findUsuarioById` y devuelve `toUsuarioDto(user)`.

**El `LoginResponse` type en `api/types.ts`** es:
```typescript
{ token: string; usuario: Pick<Usuario, 'id' | 'nombre' | 'correo' | 'rol_sistema' | 'rol_empresa'> }
```

**Lo que hay que preservar sin romper auth**:
1. Los campos `id`, `nombre`, `correo`, `password` del fixture son necesarios para auth → se mantienen.
2. `rol_sistema` y `rol_empresa` son usados por `LoginResponse` y el `authStore` → **estos dos campos deben seguir existiendo en el fixture auth**, pero ya no serán parte del tipo `Usuario` del back.
3. **Estrategia**: El tipo `Usuario` (api/types.ts) se alinea al back (con `rolId`, sin `rol_sistema`/`rol_empresa`). El `LoginResponse` se extiende con un tipo `UsuarioAuth` separado (o se actualiza el pick) para mantener los campos que auth necesita. El fixture de usuarios se divide o se amplía: los usuarios mock tendrán `rolId` además de mantener `rol_sistema`/`rol_empresa` como campos del tipo extendido `UsuarioMock` (solo para auth mock).
4. `useAuthStore` usa `Pick<Usuario, 'id' | 'nombre' | 'correo' | 'rol_sistema' | 'rol_empresa'>` → debe actualizar qué campos expone el store de auth.

**Riesgo**: si se elimina `rol_sistema`/`rol_empresa` del tipo `Usuario` directamente, el `LoginResponse` y `authStore` se rompen. Hay que hacer la migración con cuidado.

---

## Bloque endpoints.ts a agregar

```typescript
usuarios: {
  getAll: () => '/usuarios/get-all',
  getById: (id: string) => `/usuarios/get-by-id?id=${id}`,
  create: () => '/usuarios/create',
  edit: (id: string) => `/usuarios/edit?id=${id}`,
  delete: (id: string) => `/usuarios/delete?id=${id}`,
},
```

---

## El modelo `rolId` — implicación de UX

El back usa `rolId: UUID` en lugar de `rol_sistema: 'admin' | 'usuario'`. Esto implica:
- Para mostrar "Admin"/"Usuario" en la tabla, el front necesita resolver el nombre del rol desde el UUID. Opciones:
  - A) Cargar la lista de roles vía `GET /roles/get-all` y hacer lookup client-side.
  - B) Que el back incluya `rolNombre` en `UsuarioResponse` (requiere cambio en back → fuera de alcance).
  - C) El fixture mock hardcodea dos roles conocidos con UUIDs fijos, y los componentes hacen lookup en un mapa rol mock.

Para el mock local (MSW), la opción C es más simple. Para integración real, la opción A es la correcta. El Change 7 debería implementar A (con un hook `useRoles` que llame a `/roles/get-all`).

**Implicación adicional**: el form de crear/editar usuario necesita un Select que liste los roles disponibles (cargados desde el back). Esto requiere un nuevo hook `useRoles`.

---

## Affected Areas

- `src/api/types.ts` — tipo `Usuario` a reescribir (rolId, creadoEn, keycloakId; sin rol_sistema/rol_empresa)
- `src/api/types.ts` — `LoginResponse` debe desacoplarse del tipo `Usuario` principal
- `src/api/endpoints.ts` — agregar bloque `usuarios`
- `src/features/usuarios/schemas/usuario.schema.ts` — reescribir completo
- `src/features/usuarios/hooks/useUsuarios.ts` — migrar a `/usuarios/get-all`, endpoints
- `src/features/usuarios/hooks/useCreateUsuario.ts` — migrar a `/usuarios/create`, cambiar payload
- `src/features/usuarios/hooks/useUpdateUsuario.ts` — migrar a `PUT /usuarios/edit?id=`, renombrar a `useEditUsuario`
- `src/features/usuarios/hooks/useDeleteUsuario.ts` — migrar a `/usuarios/delete?id=` query param
- `src/features/usuarios/hooks/useDesactivarUsuario.ts` — **ELIMINAR** (endpoint inexistente)
- `src/features/usuarios/components/UsuariosTable.tsx` — adaptar campos (rolId lookup, creadoEn, sin rol_empresa)
- `src/features/usuarios/components/UsuarioForm.tsx` — reemplazar rol_sistema/rol_empresa por rolId Select
- `src/features/usuarios/pages/UsuariosListPage.tsx` — eliminar reactivarMutation y desactivarMutation o mover a solo-lectura
- `src/mocks/fixtures/usuarios.ts` — adaptar al nuevo tipo, preservar campos auth (password, rol_sistema para LoginResponse)
- `src/mocks/handlers/usuarios.ts` — reescribir con rutas RPC (/get-all, /create, /edit, /delete)
- `src/features/usuarios/__tests__/` — reescribir todos los tests (5 archivos)
- **NUEVO** `src/features/usuarios/hooks/useRoles.ts` — para cargar la lista de roles del back
- **NUEVO** `src/mocks/fixtures/roles.ts` — fixture de roles para MSW
- **NUEVO** `src/mocks/handlers/roles.ts` — handler GET /roles/get-all

---

## Approaches

1. **Migración directa homologando empresas/tareas** (recomendada)
   - Pros: patrón establecido y probado (Change 1), mínima fricción, fácil revisión
   - Cons: requiere decidir el modelo de `rolId` en la UI
   - Esfuerzo: Medio

2. **Migración con tipo `UsuarioAuth` separado para el auth store**
   - Pros: aislamiento limpio entre `Usuario` (back contract) y el estado de sesión (auth)
   - Cons: introduce un segundo tipo que los devs deben conocer
   - Esfuerzo: Bajo adicional

---

## Recommendation

Implementar la Migración directa (Approach 1) + separar `UsuarioAuth` del tipo `Usuario` del back (Approach 2 como complemento).

El tipo `Usuario` en `api/types.ts` se alinea 100% al `UsuarioResponse` del back. La auth usa un tipo `UsuarioSesion` o `UsuarioAuth` que preserva `rol_sistema`/`rol_empresa` solo para el mock (o se adapta cuando el back tenga auth real). Los hooks migran al patrón RPC. `useDesactivarUsuario` se elimina. La funcionalidad de activar/desactivar queda fuera del alcance del Change 7.

---

## Risks

- **Romper el login mock**: el fixture y `LoginResponse` comparten campos con el tipo `Usuario`. Requiere atención especial en la migración del tipo `api/types.ts`.
- **rolId en la UI**: cambiar de `'admin'|'usuario'` a UUID requiere un nuevo hook `useRoles` y un fixture mock de roles. Aumenta el alcance del change.
- **Tests existentes**: los 5 tests del feature usuarios usan los campos legacy (`rol_sistema`, etc.). Todos deberán reescribirse en TDD.

---

## Open Decisions

**D1 — ¿Qué hacer con desactivar/reactivar?**
- Opciones: (A) Quitar de la UI (recomendado), (B) Diferir con mock
- Recomendación: Quitar. El back no tiene el endpoint; la UI muestra `activo` como dato de solo lectura.

**D2 — ¿Se agrega `get-by-id` al bloque endpoints aunque el front no lo consuma hoy?**
- Opciones: (A) Sí, por completitud (patrón tareas lo tiene), (B) No, YAGNI
- Recomendación: Sí, por homologación (tareas y contactos lo tienen).

**D3 — ¿Password mock del fixture se mantiene?**
- El campo `password` en `usuariosFixture` es exclusivo para la auth mock. Se mantiene en el tipo `UsuarioMock` (interfaz extendida del fixture). NO va al tipo `Usuario` del back.
- Recomendación: Sí, se mantiene como está.

**D4 — ¿Cómo resolvemos `rolId` en la UI?**
- El back devuelve `rolId: UUID`. La tabla necesita mostrar el nombre del rol.
- Opciones: (A) Nuevo hook `useRoles` + lookup client-side (correcto a largo plazo), (B) Hardcodear dos UUIDs de roles en el fixture y un mapa local (solo para mock)
- Recomendación: Agregar `useRoles` (hook simple GET /roles/get-all) + fixture `roles.ts`. Alcance limitado.

**D5 — ¿Cómo manejar `LoginResponse` y el authStore al cambiar el tipo `Usuario`?**
- Opciones: (A) Crear tipo `UsuarioSesion` separado para lo que devuelve auth/login (con `rol_sistema`, `rol_empresa`), (B) Actualizar el authStore para usar `rolId` directamente
- Recomendación: Opción A — crear `UsuarioSesion` con los campos que auth mock necesita. El tipo `Usuario` del back es puro; `UsuarioSesion` es el shape del store de sesión.

---

## Ready for Proposal

Sí. Las decisiones abiertas (D1-D5) requieren confirmación del usuario antes de spec, pero el alcance está bien definido.
