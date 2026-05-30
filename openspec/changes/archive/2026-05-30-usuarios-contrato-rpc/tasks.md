# Tasks — Change 7: usuarios-contrato-rpc

**Status**: pending
**Modo**: Strict TDD — cada unidad: test rojo primero, implementación verde, refactor.
**Runner**: `pnpm test:run`
**Type-check**: `pnpm type-check`
**Fecha**: 2026-05-30

---

## Resumen de fases

| Fase | Descripción | Tareas |
|------|-------------|--------|
| F1 | Tipos + endpoints (fuente de verdad) | 4 |
| F2 | Fixtures y handlers MSW (usuarios + roles) | 8 |
| F3 | Hooks de usuarios (RPC) | 8 |
| F4 | Hook de roles + helper lookup | 4 |
| F5 | Schema Zod de usuario | 2 |
| F6 | Componentes y page | 6 |
| F7 | Limpieza | 3 |
| F8 | Verificación final | 3 |
| **Total** | | **38** |

---

## F1 — Tipos + endpoints (fuente de verdad)

> Dependencia de todo lo demás. Completar antes de tocar cualquier hook, handler o componente.

- [x] **F1.1** [TEST] Ampliar `src/api/__tests__/endpoints.test.ts`: verificar `endpoints.usuarios.getAll()` → `/usuarios/get-all`, `getById('u1')` → `/usuarios/get-by-id?id=u1`, `create()` → `/usuarios/create`, `edit('u1')` → `/usuarios/edit?id=u1`, `delete('u1')` → `/usuarios/delete?id=u1`; y `endpoints.roles.getAll()` → `/roles/get-all`.
  - Archivo: `src/api/__tests__/endpoints.test.ts`

- [x] **F1.2** [IMPL] Agregar a `src/api/endpoints.ts` el bloque `usuarios: { getAll, getById, create, edit, delete }` y el bloque `roles: { getAll }` siguiendo el shape exacto de `tareas` y `contactos`.
  - Archivo: `src/api/endpoints.ts`

- [x] **F1.3** [IMPL] Actualizar `src/api/types.ts`: reemplazar `Usuario` por el shape del back (`id, nombre, correo, rolId, creadoEn, activo: boolean, keycloakId: string | null`); agregar `UsuarioSesion` independiente (`id, nombre, correo, rol_sistema: RolSistema, rol_empresa: string | null`); agregar `Rol` (`id, nombre, descripcion: string | null, activo: boolean`); cambiar `LoginResponse.usuario` de `Pick<Usuario,...>` a `UsuarioSesion`. Mantener intactos todos los demás tipos.
  - Archivo: `src/api/types.ts`

- [x] **F1.4** [IMPL] Actualizar `src/store/authStore.ts`: cambiar `AuthUser = Pick<Usuario,...>` por `AuthUser = UsuarioSesion` (importado de `@/api/types`). `RoleGuard.tsx` no cambia.
  - Archivo: `src/store/authStore.ts`

---

## F2 — Fixtures y handlers MSW (usuarios + roles)

> Depende de F1 (tipos + endpoints). Hacerlo antes que los tests de hooks para que los hooks pasen contra los handlers RPC correctos.

- [x] **F2.1** [TEST] Escribir `src/mocks/handlers/__tests__/usuarios.handler.test.ts`: verificar `GET /api/usuarios/get-all` retorna array con campos `rolId`, `creadoEn`, `keycloakId`, `activo` y SIN `rol_sistema`/`rol_empresa`; `POST /api/usuarios/create` responde 201; `PUT /api/usuarios/edit?id=u1` lee id del query param y responde 200; `DELETE /api/usuarios/delete?id=u1` responde 204; `GET /api/usuarios/get-by-id?id=u1` retorna el usuario.
  - Archivo: `src/mocks/handlers/__tests__/usuarios.handler.test.ts` (nuevo)

- [x] **F2.2** [TEST] Escribir `src/mocks/handlers/__tests__/roles.handler.test.ts`: verificar `GET /api/roles/get-all` retorna al menos 2 roles con campos `id`, `nombre`, `descripcion`, `activo`.
  - Archivo: `src/mocks/handlers/__tests__/roles.handler.test.ts` (nuevo)

- [x] **F2.3** [IMPL] Crear `src/mocks/fixtures/roles.ts`: al menos 2 roles con campos `id`, `nombre`, `descripcion`, `activo`. Los `id` deben coincidir con los `rolId` que se asignarán a los usuarios mock en F2.4.
  - Archivo: `src/mocks/fixtures/roles.ts` (nuevo)

- [x] **F2.4** [IMPL] Actualizar `src/mocks/fixtures/usuarios.ts`: redefinir `UsuarioMock = Usuario & { password: string; rol_sistema: RolSistema; rol_empresa: string | null }` (los 3 campos auth salen del tipo base `Usuario`); agregar `rolId`, `creadoEn`, `keycloakId` a cada registro; `toUsuarioDto` debe hacer `Omit` de `password`, `rol_sistema`, `rol_empresa` y retornar `Usuario` válido. `findUsuarioByCreds` y `findUsuarioById` sin cambios de firma.
  - Archivo: `src/mocks/fixtures/usuarios.ts`

- [x] **F2.5** [IMPL] Reescribir `src/mocks/handlers/usuarios.ts`: eliminar rutas REST legacy (`GET/POST /api/usuarios`, `PATCH /api/usuarios/:id`, `DELETE /api/usuarios/:id`, `PATCH /api/usuarios/:id/desactivar`); implementar handlers RPC: `GET /api/usuarios/get-all`, `GET /api/usuarios/get-by-id?id=` (query param), `POST /api/usuarios/create` (body: `nombre, correo, rolId, initialPassword`; responde 201 sin devolver `initialPassword`), `PUT /api/usuarios/edit?id=` (sin `activo` ni `initialPassword`), `DELETE /api/usuarios/delete?id=` (responde 204); agregar error 422 con `details` en create y edit.
  - Nota: el handler legacy PATCH /api/usuarios/:id/desactivar fue conservado provisionalmente para que useDesactivarUsuario.test.tsx no se rompa antes de Batch 2/F7.1.
  - Archivo: `src/mocks/handlers/usuarios.ts`

- [x] **F2.6** [IMPL] Crear `src/mocks/handlers/roles.ts`: handler `GET /api/roles/get-all` que retorna `rolesFixture`.
  - Archivo: `src/mocks/handlers/roles.ts` (nuevo)

- [x] **F2.7** [IMPL] Actualizar `src/mocks/handlers/index.ts`: importar `rolesHandlers` y agregarlos al array `handlers`.
  - Archivo: `src/mocks/handlers/index.ts`

- [x] **F2.8** [TEST] Actualizar `src/mocks/handlers/auth.ts` si el compilador lo requiere (el handler construye `LoginResponse` con `UsuarioSesion`; si `toUsuarioDto` ya no incluye `rol_sistema`/`rol_empresa`, hay que construir el objeto `usuario` desde los campos `UsuarioMock` directamente). Verificar que la suite de auth queda verde después de F2.4.
  - Archivo: `src/mocks/handlers/auth.ts`

---

## F3 — Hooks de usuarios (RPC)

> Depende de F1 (endpoints) y F2 (handlers MSW actualizados). Los tests de hooks apuntan contra los handlers RPC.

- [x] **F3.1** [TEST] Actualizar `src/features/usuarios/__tests__/useUsuarios.test.tsx`: cambiar ruta interceptada de `GET /api/usuarios` a `GET /api/usuarios/get-all`; verificar queryKey `['usuarios']`; response con campos `rolId`, `creadoEn`, `keycloakId` (no `rol_sistema`).
  - Archivo: `src/features/usuarios/__tests__/useUsuarios.test.tsx`

- [x] **F3.2** [IMPL] Actualizar `src/features/usuarios/hooks/useUsuarios.ts`: `queryFn` usa `endpoints.usuarios.getAll()`; queryKey `['usuarios']`; tipo `Usuario[]`.
  - Archivo: `src/features/usuarios/hooks/useUsuarios.ts`

- [x] **F3.3** [TEST] Actualizar `src/features/usuarios/__tests__/useCreateUsuario.test.tsx`: cambiar ruta de `POST /api/usuarios` a `POST /api/usuarios/create`; body incluye `rolId` e `initialPassword`; NO incluye `rol_sistema`, `rol_empresa`, `activo`; handler responde 201; queryKey `['usuarios']` se invalida.
  - Archivo: `src/features/usuarios/__tests__/useCreateUsuario.test.tsx`

- [x] **F3.4** [IMPL] Actualizar `src/features/usuarios/hooks/useCreateUsuario.ts`: `mutationFn` usa `apiClient.post(endpoints.usuarios.create(), body)`; body sigue `CreateUsuarioRequest` (`nombre, correo, rolId, initialPassword`); invalida `['usuarios']`.
  - Archivo: `src/features/usuarios/hooks/useCreateUsuario.ts`

- [x] **F3.5** [TEST] Escribir `src/features/usuarios/__tests__/useEditUsuario.test.tsx` (nuevo, reemplaza `useUpdateUsuario`): verifica `PUT /api/usuarios/edit?id=u1` (PUT, no PATCH); id es query param (no path); body incluye `nombre`, `correo`, `rolId`; body NO incluye `activo` ni `initialPassword`; error 422 retorna `details`; queryKey `['usuarios']` se invalida.
  - Archivo: `src/features/usuarios/__tests__/useEditUsuario.test.tsx` (nuevo)

- [x] **F3.6** [IMPL] Renombrar `useUpdateUsuario.ts` → `useEditUsuario.ts`: `mutationFn` usa `apiClient.put(endpoints.usuarios.edit(id), body)`; body sigue `EditUsuarioRequest` (`nombre, correo, rolId?`); sin `activo`; invalida `['usuarios']` y remueve `['usuarios', id]`.
  - Nota: useUpdateUsuario.ts se conserva hasta Batch 2/F7.2 para no romper importaciones.
  - Archivo: `src/features/usuarios/hooks/useEditUsuario.ts` (nuevo; useUpdateUsuario.ts pendiente eliminación en F7.2)

- [x] **F3.7** [TEST] Actualizar `src/features/usuarios/__tests__/useDeleteUsuario.test.tsx`: cambiar ruta de `DELETE /api/usuarios/:id` a `DELETE /api/usuarios/delete?id=u1`; id como query param; responde 204; toast "Usuario eliminado"; queryKey `['usuarios']` se invalida.
  - Archivo: `src/features/usuarios/__tests__/useDeleteUsuario.test.tsx`

- [x] **F3.8** [IMPL] Actualizar `src/features/usuarios/hooks/useDeleteUsuario.ts`: `mutationFn` usa `apiClient.delete(endpoints.usuarios.delete(id))`; invalida `['usuarios']`.
  - Archivo: `src/features/usuarios/hooks/useDeleteUsuario.ts`

---

## F4 — Hook de roles + helper lookup

> Depende de F1 (tipos `Rol`, `endpoints.roles`) y F2.3/F2.6 (fixture y handler de roles).

- [x] **F4.1** [TEST] Escribir `src/features/usuarios/__tests__/useRoles.test.tsx`: verifica `GET /api/roles/get-all`; queryKey `['roles']`; response tipificada como `Rol[]` con campos `id`, `nombre`, `descripcion`, `activo`.
  - Archivo: `src/features/usuarios/__tests__/useRoles.test.tsx` (nuevo)

- [x] **F4.2** [IMPL] Crear `src/features/usuarios/hooks/useRoles.ts`: `useQuery({ queryKey: ['roles'], queryFn: () => apiClient.get<Rol[]>(endpoints.roles.getAll()) })`.
  - Archivo: `src/features/usuarios/hooks/useRoles.ts` (nuevo)

- [x] **F4.3** [TEST] Escribir `src/features/usuarios/__tests__/rolLookup.test.ts`: verificar `resolveRolNombre('rol-uuid', roles)` retorna el nombre; `resolveRolNombre` con array vacío retorna el id como fallback; `resolveRolNombre` con id no encontrado retorna el id como fallback.
  - Archivo: `src/features/usuarios/__tests__/rolLookup.test.ts` (nuevo)

- [x] **F4.4** [IMPL] Crear `src/features/usuarios/lib/rolLookup.ts`: función pura `resolveRolNombre(rolId: string, roles: Rol[]): string` — `roles.find(r => r.id === rolId)?.nombre ?? rolId`.
  - Archivo: `src/features/usuarios/lib/rolLookup.ts` (nuevo)

---

## F5 — Schema Zod de usuario

> Depende de F1 (tipos del back). Los tests de componentes en F6 dependen del schema correcto.

- [x] **F5.1** [TEST] Actualizar `src/features/usuarios/__tests__/usuario.schema.test.ts` (o crear si no existe): `usuarioCreateSchema` valida `nombre` (max 100), `correo` (@email, max 120), `rolId` (string UUID no vacío), `initialPassword` (min 1); rechaza body con `rol_sistema`, `rol_empresa`; `usuarioUpdateSchema` (para edición) valida `nombre`, `correo`, `rolId?`; NO incluye `initialPassword` ni `activo`.
  - Archivo: `src/features/usuarios/__tests__/usuario.schema.test.ts`

- [x] **F5.2** [IMPL] Reescribir `src/features/usuarios/schemas/usuario.schema.ts`: `usuarioCreateSchema` con `nombre` (max 100), `correo` (email, max 120), `rolId` (uuid), `initialPassword` (min 1); `usuarioUpdateSchema` con `nombre`, `correo`, `rolId?` (sin `initialPassword`, sin `activo`); exportar `UsuarioCreateInput` y `UsuarioUpdateInput`.
  - Archivo: `src/features/usuarios/schemas/usuario.schema.ts`

---

## F6 — Componentes y page

> Depende de F3 (hooks), F4 (useRoles + rolLookup) y F5 (schema).

- [x] **F6.1** [TEST] Actualizar/escribir test de `UsuarioForm` en `src/features/usuarios/__tests__/`: verificar que el select de roles se puebla con datos de `useRoles`; mientras `useRoles` está cargando, el select muestra estado deshabilitado o "Cargando roles..."; en mode='edit' el select muestra el rol actual seleccionado; campo `initialPassword` presente en mode='create', ausente en mode='edit'; sin campos `rol_sistema`/`rol_empresa`.
  - Archivo: `src/features/usuarios/__tests__/UsuarioForm.test.tsx` (nuevo o actualizar)

- [x] **F6.2** [IMPL] Reescribir `src/features/usuarios/components/UsuarioForm.tsx`: eliminar campos `rol_sistema` y `rol_empresa`; agregar `<Select>` de roles poblado con `useRoles()` (cada opción: `label=rol.nombre`, `value=rol.id`); agregar campo `initialPassword` (visible solo en mode='create'); `isOwnAccount` prop eliminada o inactivada (ya no bloquea nada); propagar `UsuarioCreateInput`/`UsuarioUpdateInput` del schema nuevo.
  - Archivo: `src/features/usuarios/components/UsuarioForm.tsx`

- [x] **F6.3** [IMPL] Actualizar `src/features/usuarios/components/UsuarioFormDialog.tsx`: adaptar props a los nuevos tipos de input (`UsuarioCreateInput`/`UsuarioUpdateInput`); propagar `useRoles` al form si es necesario (o dejar que `UsuarioForm` lo consuma internamente).
  - Archivo: `src/features/usuarios/components/UsuarioFormDialog.tsx`

- [x] **F6.4** [TEST] Actualizar/escribir test de `UsuariosTable` en `src/features/usuarios/__tests__/`: verificar que la columna de rol muestra nombre del rol (via `resolveRolNombre`); cuando roles no cargaron, muestra `rolId` como fallback; badge de `activo` es READ-ONLY (no hay botón "Desactivar" ni "Reactivar"); fecha en columna `creadoEn`.
  - Archivo: `src/features/usuarios/__tests__/UsuariosTable.test.tsx` (nuevo o actualizar)

- [x] **F6.5** [IMPL] Actualizar `src/features/usuarios/components/UsuariosTable.tsx`: agregar columna `creadoEn`; columna rol usa `resolveRolNombre(usuario.rolId, roles ?? [])`; columna `activo` es badge READ-ONLY (sin acción de cambio); eliminar columna/acción `rol_empresa`; recibir prop `roles: Rol[]` del page o llamar `useRoles()` internamente.
  - Archivo: `src/features/usuarios/components/UsuariosTable.tsx`

- [x] **F6.6** [IMPL] Actualizar `src/features/usuarios/pages/UsuariosListPage.tsx`: incorporar `useRoles()` y pasar `roles` a la tabla; eliminar botón/acción "Reactivar" y cualquier llamada a `useDesactivarUsuario`; pasar `useEditUsuario` en lugar de `useUpdateUsuario`.
  - Archivo: `src/features/usuarios/pages/UsuariosListPage.tsx`

---

## F7 — Limpieza

> Depende de que F3–F6 estén en verde. Eliminar artefactos legacy.

- [x] **F7.1** [CLEANUP] Eliminar `src/features/usuarios/hooks/useDesactivarUsuario.ts` y su test `src/features/usuarios/__tests__/useDesactivarUsuario.test.tsx`. Verificar que ningún archivo importa `useDesactivarUsuario`.
  - Archivos: `useDesactivarUsuario.ts`, `useDesactivarUsuario.test.tsx`

- [x] **F7.2** [CLEANUP] Eliminar `src/features/usuarios/hooks/useUpdateUsuario.ts` (reemplazado por `useEditUsuario.ts` en F3.6). Verificar que ningún archivo lo importa.
  - Archivo: `useUpdateUsuario.ts`

- [x] **F7.3** [LINT] Verificar que no existen rutas literales legacy (`/api/usuarios`, `/api/v1/usuarios`, `/usuarios/:id`, `/usuarios/${id}`, `/desactivar`) en `src/features/usuarios/` y `src/mocks/handlers/usuarios.ts`. Todos los hooks y handlers usan `endpoints.usuarios.*` o `endpoints.roles.*`.
  - Verificación: búsqueda de strings en los archivos del feature

---

## F8 — Verificación final

> Ejecutar solo cuando F1–F7 estén completas.

- [x] **F8.1** [TEST] Ejecutar `pnpm test:run` — debe estar en verde. Confirmar que la suite de auth (login mock, `UsuarioSesion`, `rol_sistema`, `RoleGuard`) sigue pasando. Anotar cantidad de tests y archivos.
  - Criterio: 0 failed; suite de auth verde. **RESULTADO: 81 archivos, 641 tests, 0 failed.**

- [x] **F8.2** [TYPECHECK] Ejecutar `pnpm type-check` — deben existir exactamente los 5 errores pre-existentes en `src/features/contactos/__tests__/` y cero errores nuevos en el alcance de este change.
  - Criterio: 0 errores nuevos fuera de `contactos/__tests__`. **RESULTADO: Solo 5 errores pre-existentes en contactos/__tests__.**

- [x] **F8.3** [TEST] Verificar escenario end-to-end crítico: `UsuariosListPage` renderiza con roles cargados, nombres de rol visibles (no UUIDs), badge `activo` read-only, sin botón "Desactivar"/"Reactivar", create/edit/delete funcionan contra handlers RPC.
  - Archivo: `src/features/usuarios/__tests__/UsuariosListPage.test.tsx`

---

## Dependencias entre fases

```
F1 (tipos + endpoints)
  └─► F2 (fixtures + handlers MSW)
        └─► F3 (hooks usuarios)
        └─► F4 (useRoles + rolLookup)
              └─► F5 (schema Zod)
                    └─► F6 (componentes + page)
                          └─► F7 (limpieza)
                                └─► F8 (verificación final)
```

F1.3 y F1.4 modifican `src/api/types.ts` y `src/store/authStore.ts` juntos — hacerlos en el mismo commit.
F2.4 (fixture usuarios) y F2.8 (handler auth) están acoplados — hacerlos en secuencia.
F3.5/F3.6 renombran `useUpdateUsuario` → `useEditUsuario` — hacer F3.6 antes de borrar el archivo viejo en F7.2.
