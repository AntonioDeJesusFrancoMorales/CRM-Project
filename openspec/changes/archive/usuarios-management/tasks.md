# Tasks: Usuarios Management (Change 3)

**Proyecto**: CRM Pipely
**Fecha**: 2026-05-21
**Strict TDD**: activo — RED → GREEN obligatorio para cada hook crítico y la página
**Persistencia**: hybrid

---

## Fase 0: Primitivos shadcn

- [x] **T0.1** Instalar `select`, `badge` y `tooltip` con `pnpm dlx shadcn@latest add select badge tooltip --yes --overwrite` → genera `src/components/ui/select.tsx`, `badge.tsx`, `tooltip.tsx`. Ref: ADR-015, ADR-019, ADR-016.

---

## Fase 1: Schemas + tipos

- [x] **T1.1** Crear `src/features/usuarios/schemas/usuario.schema.ts` con `usuarioCreateSchema` (4 campos: `nombre` min 1 max 150, `correo` email max 200, `rol_sistema` enum `admin|usuario`, `rol_empresa` opcional max 100); `usuarioUpdateSchema = usuarioCreateSchema.partial()`; types `UsuarioCreateInput` y `UsuarioUpdateInput` vía `z.infer`. **Sin campo `activo`** — el backend lo asigna por defecto. Ref: ADR-014, spec R5, reconciliación B y C.

---

## Fase 2: TooltipProvider global

- [x] **T2.1** Modificar `src/App.tsx`: envolver `<RouterProvider router={router} />` con `<TooltipProvider delayDuration={150}>`, manteniéndolo dentro de `<QueryClientProvider>` y antes de `<Toaster>`. Verificar que la estructura `QueryClientProvider > TooltipProvider > RouterProvider + Toaster` no rompa el árbol de providers existente. Ref: ADR-016.

---

## Fase 3: Hooks (Strict TDD — RED → GREEN por hook crítico)

- [x] **T3.1 RED** Crear `src/features/usuarios/__tests__/useUsuarios.test.tsx`: 2 tests que fallan (hook no existe) — (a) GET 200 devuelve array de usuarios, (b) GET 500 propaga error. Ref: ADR-020, spec R2.
- [x] **T3.2 GREEN** Crear `src/features/usuarios/hooks/useUsuarios.ts`: `useQuery({ queryKey: ['usuarios'], queryFn: () => apiClient.get<Usuario[]>('/usuarios') })`. Los 2 tests deben pasar. Ref: spec R2, ADR-020.
- [x] **T3.3 RED** Crear `src/features/usuarios/__tests__/useCreateUsuario.test.tsx`: 2 tests que fallan — (a) mutación 201 invalida `['usuarios']` + llama toast, (b) 422 propaga `details`. Ref: ADR-020, spec R5.
- [x] **T3.4 GREEN** Crear `src/features/usuarios/hooks/useCreateUsuario.ts`: mutation POST `/usuarios`, onSuccess invalida `['usuarios']` + toast éxito, onError maneja 422 y 5xx. Los 2 tests deben pasar. Ref: spec R5, ADR-020.
- [x] **T3.5 RED** Crear `src/features/usuarios/__tests__/useDeleteUsuario.test.tsx`: 2 tests que fallan — (a) DELETE 204 llama `removeQueries` + invalida, (b) 404 muestra toast específico + invalida. Ref: ADR-020, spec R7.
- [x] **T3.6 GREEN** Crear `src/features/usuarios/hooks/useDeleteUsuario.ts`: mutation DELETE `/usuarios/:id`, onSuccess removeQueries `['usuarios', id]` + invalidate `['usuarios']` + toast, onError 404 toast diferenciado. Los 2 tests deben pasar. Ref: spec R7, ADR-020.
- [x] **T3.7 RED** Crear `src/features/usuarios/__tests__/useDesactivarUsuario.test.tsx`: 2 tests que fallan — (a) PATCH `/usuarios/:id/desactivar` 200 invalida `['usuarios']`, (b) 404 muestra toast de error. Ref: ADR-018, ADR-020, spec R8.
- [x] **T3.8 GREEN** Crear `src/features/usuarios/hooks/useDesactivarUsuario.ts`: mutation PATCH `/usuarios/:id/desactivar`, con JSDoc explicando asimetría vs reactivar. Los 2 tests deben pasar. Ref: ADR-018, spec R8.
- [x] **T3.9** Crear `src/features/usuarios/hooks/useUpdateUsuario.ts`: mutation PATCH `/usuarios/:id`, acepta `UsuarioUpdateInput`, invalida `['usuarios']` + toast. JSDoc nota: también se usa para reactivar pasando `{ activo: true }`. Sin test directo por ADR-021. Ref: ADR-014, ADR-018, ADR-021, spec R6, R9.
- [x] **T3.10** Verificar `pnpm test:run` — 28 tests / 12 archivos pasan en verde (incluye 8 nuevos del Lote B). Confirmado 0 fallos. Ref: ADR-020.

---

## Fase 4: Componentes presentacionales (sin tests directos por ADR-020)

- [x] **T4.1** Crear `src/features/usuarios/components/UsuariosTable.tsx`: `shadcn Table` con columnas (Nombre, Correo, Rol sistema `Badge`, Rol empresa, Estado `Badge`, Fecha creación relativa, Acciones); `Input` búsqueda controlado; `Select` filtro `rol_sistema` (admin/usuario/todos); `DropdownMenu` por fila con: Editar (siempre), Desactivar (si `activo:true`, bloqueado con Tooltip si `isOwnAccount`), Reactivar (si `activo:false`), Eliminar (bloqueado con Tooltip si `isOwnAccount`); comparación `isOwnAccount` inline. Props: `UsuariosTableProps`. Ref: ADR-017, ADR-018, ADR-019, spec R2–R4, R8, R9, R10.
- [x] **T4.2** Crear `src/features/usuarios/components/UsuarioForm.tsx`: `shadcn Form` + RHF + `zodResolver`. Campos: `nombre` (Input), `correo` (Input email), `rol_sistema` (Select via `FormField`/Controller, `disabled={isOwnAccount}` envuelto en Tooltip), `rol_empresa` (Input opcional). **Sin campo `activo`**. Props: `UsuarioFormProps` con `mode`, `defaultValues?`, `onSubmit`, `onCancel?`, `isSubmitting?`, `serverErrors?`, `isOwnAccount?`. Aplica `stringsToNulls` (de `src/lib/form-utils.ts`) antes de onSubmit. Ref: ADR-013, ADR-015, spec R5, R6, R10.3, reconciliación A y B.
- [x] **T4.3** Crear `src/features/usuarios/components/UsuarioFormDialog.tsx`: `shadcn Dialog` wrapper con discriminated union `CreateProps | EditProps`. Mode `create`: llama `useCreateUsuario`; mode `edit`: llama `useUpdateUsuario(usuario.id)`. Renderiza `<UsuarioForm>` con props correspondientes. Cierra automáticamente en éxito. Ref: ADR-013, spec R5.1, R6.1.
- [x] **T4.4** Crear `src/features/usuarios/components/UsuarioDeleteDialog.tsx`: `shadcn AlertDialog` con texto "¿Eliminar **{nombre}**? Esta acción no se puede deshacer.". Si `isOwnAccount`: botón confirmar `disabled` + Tooltip "No puedes eliminar tu propia cuenta" (defensa en profundidad). Internamente usa `useDeleteUsuario`. Props: `UsuarioDeleteDialogProps`. Ref: ADR-017, spec R7, R10.1.

---

## Fase 5: Página principal (Strict TDD — RED → GREEN)

- [x] **T5.1 RED** Crear `src/features/usuarios/__tests__/UsuariosListPage.test.tsx`: tests que fallan (página no existe) — (a) render con datos muestra tabla, (b) búsqueda por texto filtra filas, (c) filtro por rol funciona, (d) click "Nuevo usuario" abre Dialog, (e) click "Editar" abre Dialog con datos del usuario, (f) admin en sesión ve "Eliminar" y "Desactivar" deshabilitados en su propia fila + Select `rol_sistema` disabled en form de edición propia. Ref: ADR-020, spec R2–R6, R10.
- [x] **T5.2 GREEN** Crear `src/features/usuarios/pages/UsuariosListPage.tsx`: header con título "Usuarios" + botón "Nuevo usuario"; estado local `searchTerm`, `rolFilter`, `createOpen`, `editTarget`, `deleteTarget`; `useUsuarios()` para datos; `useAuthStore` para `sessionUserId`; renderiza `<UsuariosTable>`, `<UsuarioFormDialog>` (create + edit), `<UsuarioDeleteDialog>`; empty state y error state. Los 6 tests deben pasar. Ref: ADR-016, ADR-017, spec R1–R11.

---

## Fase 6: Wiring + cleanup

- [x] **T6.1** Modificar `src/routes/router.tsx`: importar `UsuariosListPage` desde `src/features/usuarios/pages/UsuariosListPage`; reemplazar `<UsuariosPlaceholder />` por `<UsuariosListPage />` en la ruta `/usuarios`. Ref: proposal (scope In).
- [x] **T6.2** Modificar `src/routes/placeholders.tsx`: eliminar el export `UsuariosPlaceholder` (función + type si aplica). Verificar que no haya otros consumidores antes de eliminar. Ref: proposal (scope In).
- [x] **T6.3** Verificar `pnpm test:run` (todos los tests en verde), `pnpm lint` (0 errores), `pnpm type-check` (exit 0). Los 3 comandos deben pasar antes de continuar a Fase 7. Ref: ADR-020.

---

## Fase 7: Verificación manual (smoke test)

- [x] **T7.1** Smoke test manual — el desarrollador debe: (1) iniciar sesión como admin; (2) navegar a `/usuarios`; (3) verificar que la tabla muestra los usuarios del fixture; (4) probar búsqueda por nombre y por correo; (5) probar filtro por rol (admin, usuario, todos); (6) crear un usuario nuevo con todos los campos y confirmar el toast de éxito + aparece en tabla; (7) editar un usuario existente y confirmar actualización; (8) desactivar un usuario y confirmar que el badge cambia a "Inactivo"; (9) reactivar ese usuario y confirmar badge "Activo"; (10) eliminar un usuario con confirmación en AlertDialog; (11) abrir edición sobre la propia cuenta: verificar que `rol_sistema` está disabled con Tooltip + que las acciones Eliminar/Desactivar están bloqueadas en la fila propia. Ref: spec R1–R11.

---

## Resumen de fases

| Fase | Tasks | Foco | Estimado relativo |
|------|-------|------|-------------------|
| 0 | 1 | Instalación shadcn (select, badge, tooltip) | xs |
| 1 | 1 | Schema Zod + types | xs |
| 2 | 1 | TooltipProvider en App.tsx | xs |
| 3 | 10 | Hooks con Strict TDD (4 pares RED/GREEN + 1 sin test + verificación) | m |
| 4 | 4 | Componentes presentacionales | m |
| 5 | 2 | Página principal con Strict TDD | m |
| 6 | 3 | Wiring + cleanup + verificación CI | xs |
| 7 | 1 | Smoke test manual | xs |
| **Total** | **23 tasks** | | |

---

## Notas de implementación

### Correcciones de reconciliación aplicadas (Spec ↔ Design)

- **A**: `UsuarioForm` **NO incluye** campo `activo`. La alternancia activo/inactivo se gestiona exclusivamente desde el DropdownMenu de la tabla.
- **B**: `usuarioCreateSchema` **NO incluye** campo `activo`. El backend lo asigna como `true` por defecto.
- **C**: Límites de caracteres alineados con la spec: `nombre` max 150, `correo` max 200, `rol_empresa` max 100.

### Archivos NO tocar

`src/api/types.ts`, `src/api/usuarios.ts`, `src/mocks/handlers/usuarios.ts`, `src/mocks/fixtures/usuarios.ts`, `src/store/authStore.ts`, `src/components/layout/RoleGuard.tsx`, archivos de otras features.

### Lotes sugeridos para sdd-apply

- **Lote A** (Fases 0–2, 3 tasks): primitivos + schema + TooltipProvider
- **Lote B** (Fase 3, 10 tasks): todos los hooks con ciclo TDD
- **Lote C** (Fases 4–5, 6 tasks): componentes + página con TDD
- **Lote D** (Fases 6–7, 4 tasks): wiring + verificación final
