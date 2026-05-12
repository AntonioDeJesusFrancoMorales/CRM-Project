# Design: Empresas CRUD

## Technical Approach

Feature-first dentro de `src/features/empresas/`. Capas estándar: schemas (Zod) → hooks (TanStack Query) → components (shadcn) → pages (componer todo). Reutilizar `apiClient` y patrones probados en Change 1.

```
EmpresasListPage ─→ useEmpresas() ─→ apiClient.get('/empresas')
        │
        ├─→ EmpresasTable + búsqueda local
        ├─→ EmpresaFormDialog (create) ─→ useCreateEmpresa()
        ├─→ EmpresaFormDialog (edit)   ─→ useUpdateEmpresa()
        └─→ EmpresaDeleteDialog        ─→ useDeleteEmpresa()

EmpresaDetailPage ─→ useEmpresa(id) + useEmpresaProspectos(id) + useEmpresaClientes(id)
                        │
                        └─→ Tabs (Info / Prospectos / Clientes)
```

## Architecture Decisions

| # | Decisión | Alternativa | Por qué |
|---|----------|-------------|---------|
| ADR-007 | Una sola `EmpresaForm` reutilizable con prop `mode: 'create' \| 'edit'` | Forms separados | Mismos 7 campos, misma validación; duplicar es deuda |
| ADR-008 | `empresaUpdateSchema = empresaCreateSchema.partial()` | Schema separado | DRY; PATCH naturalmente acepta cualquier subset |
| ADR-009 | Strings vacíos → null antes del POST/PATCH | Enviar `""` | Backend espera null para opcionales; coincide con types `\| null` |
| ADR-010 | Búsqueda client-side (no `?search=` query param) | Server-side | 3 fixtures; agregar param cuando vuelvan 50+ |
| ADR-011 | `useEmpresa` + `useEmpresaProspectos` + `useEmpresaClientes` corren en paralelo (no `useQueries`) | Combinar en useQueries | TanStack ya paraleliza queries independientes en componentes hermanos |
| ADR-012 | No optimistic updates en Change 2 | Optimistic everywhere | Costo/beneficio bajo con MSW de 200-400ms |

## Data Flow

### Crear empresa
```
Click "Nueva empresa" → setOpen(true)
EmpresaFormDialog (mode=create) → EmpresaForm
  ↓ submit
useCreateEmpresa.mutate(formData)
  ↓ stringsToNulls(formData) → POST /empresas
  201 → queryClient.invalidateQueries(['empresas']) + toast + setOpen(false)
  422 → form.setError(field, message) por cada detail
```

### Eliminar empresa
```
Click "Eliminar" en fila → setDeleteTarget(empresa)
EmpresaDeleteDialog → confirma
useDeleteEmpresa.mutate(id)
  ↓ DELETE /empresas/:id
  204 → queryClient.removeQueries(['empresas',id]) + invalidate(['empresas']) + toast
  404 → toast "ya fue eliminada" + invalidate(['empresas']) (sync con realidad)
```

### Detalle con 3 tabs
```
EmpresaDetailPage(id) ─┬─→ useEmpresa(id)              → tab Info
                       ├─→ useEmpresaProspectos(id)    → tab Prospectos
                       └─→ useEmpresaClientes(id)      → tab Clientes
                       
useEmpresa 404 → setTimeout(navigate('/empresas'), 1500) + toast
```

## File Changes

```
src/features/empresas/
├── schemas/empresa.schema.ts          (Zod create + update + types)
├── hooks/
│   ├── useEmpresas.ts                 (query, key: ['empresas'])
│   ├── useEmpresa.ts                  (query, key: ['empresas', id])
│   ├── useEmpresaProspectos.ts        (key: ['empresas', id, 'prospectos'])
│   ├── useEmpresaClientes.ts          (key: ['empresas', id, 'clientes'])
│   ├── useCreateEmpresa.ts            (mutation + invalidate)
│   ├── useUpdateEmpresa.ts            (mutation + invalidate)
│   └── useDeleteEmpresa.ts            (mutation + remove + invalidate)
├── components/
│   ├── EmpresasTable.tsx              (shadcn Table + search + acciones)
│   ├── EmpresaForm.tsx                (RHF + Zod + shadcn Form, prop mode)
│   ├── EmpresaFormDialog.tsx          (Dialog wrapper)
│   ├── EmpresaDeleteDialog.tsx        (AlertDialog)
│   ├── EmpresaInfoTab.tsx             (Tab content: campos + redes con iconos)
│   ├── EmpresaProspectosTab.tsx       (Tab content: lista prospectos)
│   └── EmpresaClientesTab.tsx         (Tab content: lista clientes)
├── pages/
│   ├── EmpresasListPage.tsx
│   └── EmpresaDetailPage.tsx
└── __tests__/
    ├── useEmpresas.test.tsx
    ├── useCreateEmpresa.test.tsx
    ├── useDeleteEmpresa.test.tsx
    ├── EmpresasListPage.test.tsx
    └── EmpresaDetailPage.test.tsx
```

Modificados:
- `src/routes/router.tsx`: importa pages reales, deja de importar `EmpresasPlaceholder`
- `src/routes/placeholders.tsx`: borrar `EmpresasPlaceholder` export

Nuevos shadcn: `components/ui/{table,dialog,alert-dialog,tabs}.tsx`

## Interfaces / Contracts

**Schema Zod (`empresa.schema.ts`)**:
```ts
const empresaCreateSchema = z.object({
  nombre: z.string().min(1).max(150),
  sector: z.string().max(80).optional().or(z.literal('')),
  telefono: z.string().regex(/^[\d\s+()-]{7,20}$/).optional().or(z.literal('')),
  pagina_web: z.string().url().optional().or(z.literal('')),
  facebook: z.string().max(150).optional().or(z.literal('')),
  instagram: z.string().max(150).optional().or(z.literal('')),
  twitter: z.string().max(150).optional().or(z.literal('')),
});
type EmpresaCreateInput = z.infer<typeof empresaCreateSchema>;
type EmpresaUpdateInput = Partial<EmpresaCreateInput>;
```

**Hook shapes**:
- `useEmpresas(): UseQueryResult<Empresa[]>`
- `useEmpresa(id): UseQueryResult<Empresa>`
- `useCreateEmpresa(): UseMutationResult<Empresa, Error, EmpresaCreateInput>`
- `useUpdateEmpresa(id): UseMutationResult<Empresa, Error, EmpresaUpdateInput>`
- `useDeleteEmpresa(): UseMutationResult<void, Error, string>` (input es el id)

**Helper `stringsToNulls`** en `lib/form-utils.ts`: convierte `""` → `null` antes de enviar.

## Testing Strategy

Strict TDD (RED → GREEN → REFACTOR) para cada hook crítico y page. NO tests para componentes presentacionales puros.

| Test file | Casos |
|-----------|-------|
| useEmpresas.test.tsx | listado exitoso, error 500 con retry |
| useCreateEmpresa.test.tsx | crear exitoso invalida cache, 422 propaga details |
| useDeleteEmpresa.test.tsx | delete exitoso, 404 manejo |
| EmpresasListPage.test.tsx | render con datos, búsqueda filtra, click nueva empresa abre dialog |
| EmpresaDetailPage.test.tsx | render con id válido, 404 redirige a `/empresas` |

## Migration / Rollout

No migration required (feature nueva, sin datos legacy).

## Open Questions

- [ ] El formato del campo `creado_en` en la tabla: ¿"hace 3 días" o "15 ene 2026"? Recomiendo: relative (más natural en lista, full date en tooltip).
