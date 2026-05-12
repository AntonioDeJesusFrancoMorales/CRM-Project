# Proposal: Empresas CRUD

## Intent

Reemplazar el placeholder de `/empresas` por la **vista completa de Empresas funcional**: lista, crear, editar, eliminar, detalle con prospectos y clientes asociados. Es la prioridad explícita del usuario (residencia) y el primer entregable de feature después de Login.

## Scope

### In Scope
- Lista de empresas con tabla shadcn, búsqueda nombre+sector, acciones por fila
- Crear empresa vía Dialog modal con form RHF+Zod
- Editar empresa reutilizando el mismo form (prop `mode`)
- Eliminar con AlertDialog + warning de orphan + manejo 404
- Detalle `/empresas/:id` con 3 Tabs (Info / Prospectos / Clientes)
- 7 hooks TanStack Query con invalidación quirúrgica
- 5 tests strict-TDD (3 hooks críticos + 2 pages)
- Instalar shadcn: `table`, `dialog`, `alert-dialog`, `tabs`

### Out of Scope
- Optimistic updates (Change futuro)
- Paginación / ordenamiento server-side (no necesario con 3 fixtures)
- Crear/editar prospectos o clientes desde el detalle (Changes 4 y 5)
- Campos extra al contrato (logo URL, notas, etc.)
- Dark mode toggle, mobile responsive

## Capabilities

### New Capabilities
- `empresas-management`: CRUD completo + listado/detalle + subrelaciones de empresas

### Modified Capabilities
- `app-shell`: la ruta `/empresas` y `/empresas/:id` dejan de apuntar a placeholder y apuntan a páginas reales

## Approach

Orden de implementación (Strict TDD activado):

1. Instalar shadcn `table`, `dialog`, `alert-dialog`, `tabs`
2. Escribir `empresa.schema.ts` (Zod) + tipo `EmpresaInput`
3. **RED → GREEN** por cada hook: test que falla → implementación mínima → refactor
4. Componentes UI (`EmpresasTable`, `EmpresaForm`, `EmpresaFormDialog`, `EmpresaDeleteDialog`, tabs de detalle)
5. Páginas `EmpresasListPage` y `EmpresaDetailPage` con sus tests integration
6. Reemplazar referencias en `router.tsx` y eliminar `EmpresasPlaceholder`
7. Verificación: lint + type-check + test:run + build + smoke manual

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/features/empresas/` | New | feature completo: hooks, components, pages, schemas, __tests__ |
| `src/components/ui/{table,dialog,alert-dialog,tabs}.tsx` | New | shadcn primitivos |
| `src/routes/router.tsx` | Modified | reemplazar `EmpresasPlaceholder` por `EmpresasListPage`/`EmpresaDetailPage` |
| `src/routes/placeholders.tsx` | Modified | eliminar export de `EmpresasPlaceholder` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Strict TDD ralentiza ritmo | Med | Cubrir solo hooks+pages, NO componentes presentacionales |
| Cascada de DELETE no especificada | Low | Warn al usuario en AlertDialog |
| Redes sociales: handle o URL | Low | Validar solo `pagina_web` como URL; resto libre |
| `/:id/prospectos` filtra solo fixtures iniciales | Low | Documentar; Change 4 mutará el fixture |

## Rollback Plan

`rm -rf src/features/empresas/`. Restaurar `EmpresasPlaceholder` export en `placeholders.tsx` y referencia en `router.tsx`. Desinstalar shadcn components si se quiere (no obligatorio). Reversible 100%.

## Dependencies

- Change 1 completo (✅ 44/44 tasks, app-shell + routing + MSW + auth)
- Handlers MSW de empresas + fixtures ya implementados

## Success Criteria

- [ ] Login → `/empresas` muestra tabla con 3 fixtures
- [ ] Crear empresa abre Dialog, submit éxito refresca lista
- [ ] Editar carga datos en Dialog, submit éxito actualiza fila
- [ ] Eliminar abre AlertDialog, confirma → fila desaparece + toast
- [ ] Click "Ver" navega a `/empresas/:id` con 3 tabs visibles
- [ ] Búsqueda filtra por nombre+sector en tiempo real
- [ ] 5 tests + 9 existentes verde (14/14 total)
- [ ] `pnpm lint`, `type-check`, `test:run`, `build` todos exit 0
