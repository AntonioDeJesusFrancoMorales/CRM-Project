# Tasks: Empresas CRUD

## Phase 1: shadcn primitives + schema + types

- [ ] 1.1 `pnpm dlx shadcn@latest add table dialog alert-dialog tabs --yes --overwrite` → 4 archivos en `src/components/ui/`.
- [ ] 1.2 `src/features/empresas/schemas/empresa.schema.ts`: `empresaCreateSchema` (Zod, nombre required, pagina_web URL, resto opcional+`.literal('')`), `empresaUpdateSchema = empresaCreateSchema.partial()`, types `EmpresaCreateInput` + `EmpresaUpdateInput`.
- [ ] 1.3 `src/lib/form-utils.ts`: helper `stringsToNulls<T>(obj: T): T` que convierte `""` → `null` recursivamente. Util compartido para todas las features.
- [ ] 1.4 `src/lib/format.ts`: helper `formatRelativeDate(iso)` con Intl.RelativeTimeFormat ES (fallback a fecha absoluta si > 30 días).

## Phase 2: Hooks (Strict TDD — RED → GREEN por cada hook)

- [ ] 2.1 **RED** `__tests__/useEmpresas.test.tsx`: 2 tests (listado exitoso devuelve array, 500 propaga error). Falla porque hook no existe.
- [ ] 2.2 **GREEN** `hooks/useEmpresas.ts`: `useQuery({ queryKey: ['empresas'], queryFn: () => apiClient.get<Empresa[]>('/empresas') })`. Test pasa.
- [ ] 2.3 `hooks/useEmpresa.ts`: query `['empresas', id]` con `enabled: !!id`. (Sin test propio — cubierto por EmpresaDetailPage.test.tsx)
- [ ] 2.4 `hooks/useEmpresaProspectos.ts` + `useEmpresaClientes.ts`: queries `['empresas', id, 'prospectos'|'clientes']` con `enabled: !!id`. (Sin test propio — cubierto por EmpresaDetailPage)
- [ ] 2.5 **RED** `__tests__/useCreateEmpresa.test.tsx`: 2 tests (crear invalida `['empresas']`, 422 propaga details).
- [ ] 2.6 **GREEN** `hooks/useCreateEmpresa.ts`: mutation, onSuccess invalida `['empresas']` + toast, onError maneja 422+5xx.
- [ ] 2.7 `hooks/useUpdateEmpresa.ts`: mutation acepta `(id, input)`, invalida `['empresas']` y `['empresas', id]`. (Cubierto por EmpresasListPage.test).
- [ ] 2.8 **RED** `__tests__/useDeleteEmpresa.test.tsx`: 2 tests (delete OK invalida cache, 404 muestra toast).
- [ ] 2.9 **GREEN** `hooks/useDeleteEmpresa.ts`: mutation, onSuccess `removeQueries(['empresas',id]) + invalidate(['empresas'])`, 404 toast específico.

## Phase 3: Componentes presentacionales

- [ ] 3.1 `components/EmpresasTable.tsx`: shadcn Table con columnas (Nombre, Sector, Teléfono, Web link, Creado relativo, Acciones DropdownMenu). Props: `empresas`, `onView`, `onEdit`, `onDelete`.
- [ ] 3.2 `components/EmpresaForm.tsx`: shadcn Form + RHF + zodResolver. Props: `mode: 'create' \| 'edit'`, `defaultValues?`, `onSubmit`. Aplica `stringsToNulls` antes de submit.
- [ ] 3.3 `components/EmpresaFormDialog.tsx`: shadcn Dialog wrapper. Props: `mode`, `open`, `onOpenChange`, `empresa?` (para edit). Internamente usa `useCreateEmpresa`/`useUpdateEmpresa`. Cierra automático en éxito.
- [ ] 3.4 `components/EmpresaDeleteDialog.tsx`: shadcn AlertDialog con texto "¿Eliminar **{nombre}**? Esta acción no se puede deshacer. Sus prospectos y clientes asociados quedarán sin empresa." Internamente usa `useDeleteEmpresa`.
- [ ] 3.5 `components/EmpresaInfoTab.tsx`: grid de campos (nombre, sector, teléfono, pagina_web como `<a>`, redes con iconos lucide). Muestra "—" en nulls.
- [ ] 3.6 `components/EmpresaProspectosTab.tsx`: lista simple (tabla mini o cards) con prospectos vinculados. Empty state si vacío.
- [ ] 3.7 `components/EmpresaClientesTab.tsx`: equivalente a prospectos pero para clientes.

## Phase 4: Páginas (Strict TDD)

- [ ] 4.1 **RED** `__tests__/EmpresasListPage.test.tsx`: 3 tests (render con datos muestra tabla; búsqueda filtra; click "Nueva empresa" abre dialog).
- [ ] 4.2 **GREEN** `pages/EmpresasListPage.tsx`: header con título + botón "Nueva empresa", `<Input>` de búsqueda, `<EmpresasTable>`, estado local de `searchTerm` + `editingEmpresa` + `deletingEmpresa` + `createOpen`. Empty state + error state.
- [ ] 4.3 **RED** `__tests__/EmpresaDetailPage.test.tsx`: 2 tests (render con id válido muestra tabs; 404 redirige a `/empresas`).
- [ ] 4.4 **GREEN** `pages/EmpresaDetailPage.tsx`: header con nombre+sector+acciones Editar/Eliminar, `<Tabs>` con los 3 tabs, `useEffect` para redirect en 404.

## Phase 5: Wiring + cleanup

- [ ] 5.1 Eliminar `EmpresasPlaceholder` de `src/routes/placeholders.tsx` (export y función).
- [ ] 5.2 Actualizar `src/routes/router.tsx`: import `EmpresasListPage` y `EmpresaDetailPage`; reemplazar `EmpresasPlaceholder` en las dos rutas (`/empresas` y `/empresas/:id`).
- [ ] 5.3 Habilitar item "Empresas" en Sidebar (ya está habilitado desde Change 1, verificar que el NavLink active funcione con la ruta real).

## Phase 6: Verificación final

- [ ] 6.1 `pnpm test:run` → 14/14 tests verde (9 existentes + 5 nuevos).
- [ ] 6.2 `pnpm type-check` exit 0.
- [ ] 6.3 `pnpm lint` 0 errors (warnings shadcn permitidos).
- [ ] 6.4 `pnpm build` OK.
- [ ] 6.5 Smoke manual: login → /empresas muestra 3 empresas → crear nueva refresca lista → editar refleja cambio → eliminar con confirmación → detalle muestra 3 tabs → búsqueda filtra → 404 en /empresas/inexistente redirige.
