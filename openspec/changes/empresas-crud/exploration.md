# Exploración: empresas-crud

**Change**: empresas-crud (Change 2 del plan macro)
**Fase**: sdd-explore
**Fecha**: 2026-05-10 (America/Mexico_City)
**Persistencia**: hybrid
**Strict TDD**: enabled

---

## 1. Resumen del problema

El Change 1 dejó un placeholder en `/empresas` que dice "Próximamente — Change 2". Ahora hay que reemplazar ese placeholder por la **vista completa de Empresas** con CRUD funcional + subrelaciones (prospectos y clientes de cada empresa).

Toda la infraestructura ya existe (router protegido, MSW handlers, types, query-client, shadcn). El Change 2 es **puro frontend de feature**: lista, detalle, formulario reusable, eliminación, navegación entre vistas, y tests strict-TDD.

Este es el segundo entregable defendible — el primero donde se ve "el CRM funcionando" más allá del login.

---

## 2. Estado actual relevante

```
src/
├── api/
│   ├── client.ts                  ← apiClient.get/post/patch/delete
│   ├── http-error.ts              ← HttpError + isHttpError
│   └── types.ts                   ← Empresa, Prospecto, Cliente
├── mocks/
│   ├── handlers/empresas.ts       ← CRUD funcional + /:id/prospectos + /:id/clientes
│   └── fixtures/empresas.ts       ← 3 empresas mock
├── routes/
│   ├── placeholders.tsx           ← EmpresasPlaceholder (a REEMPLAZAR)
│   └── router.tsx                 ← rutas /empresas y /empresas/:id apuntan a placeholder
└── components/ui/                 ← falta: table, dialog, alert-dialog, tabs
```

`EmpresasPlaceholder` se elimina (sus dos rutas `/empresas` y `/empresas/:id` apuntan a esta).

---

## 3. Áreas afectadas (a crear)

```
src/
├── features/empresas/
│   ├── components/
│   │   ├── EmpresasTable.tsx
│   │   ├── EmpresaForm.tsx           ← reusable para crear y editar
│   │   ├── EmpresaFormDialog.tsx     ← envuelve EmpresaForm en shadcn Dialog
│   │   ├── EmpresaDeleteDialog.tsx   ← AlertDialog de confirmación
│   │   ├── EmpresaProspectosTab.tsx  ← lista prospectos de la empresa
│   │   ├── EmpresaClientesTab.tsx    ← lista clientes de la empresa
│   │   └── EmpresaInfoTab.tsx        ← campos generales + redes sociales
│   ├── hooks/
│   │   ├── useEmpresas.ts            ← list
│   │   ├── useEmpresa.ts             ← detail
│   │   ├── useEmpresaProspectos.ts
│   │   ├── useEmpresaClientes.ts
│   │   ├── useCreateEmpresa.ts
│   │   ├── useUpdateEmpresa.ts
│   │   └── useDeleteEmpresa.ts
│   ├── pages/
│   │   ├── EmpresasListPage.tsx
│   │   └── EmpresaDetailPage.tsx
│   ├── schemas/
│   │   └── empresa.schema.ts          ← create + update + types inferidos
│   └── __tests__/
│       ├── useEmpresas.test.tsx
│       ├── useCreateEmpresa.test.tsx
│       ├── useDeleteEmpresa.test.tsx
│       ├── EmpresasListPage.test.tsx
│       └── EmpresaDetailPage.test.tsx
├── components/ui/                     ← agregar via shadcn add
│   ├── table.tsx
│   ├── dialog.tsx
│   ├── alert-dialog.tsx
│   └── tabs.tsx
└── lib/
    └── api-paths.ts                   ← constantes /api/v1/empresas, etc. (opcional, reduce typos)
```

**Eliminar**:
- `EmpresasPlaceholder` en `src/routes/placeholders.tsx` (las otras 5 placeholders siguen)
- Las dos referencias en `router.tsx` apuntan a los nuevos `EmpresasListPage` y `EmpresaDetailPage`

---

## 4. Decisiones técnicas — opciones y recomendación

### 4.1 Layout de la lista

| Opción | Pros | Contras |
|--------|------|---------|
| **Tabla shadcn (Recomendado)** | Profesional, denso, fácil de escanear. Apto para datos tabulares con columnas claras. Estándar enterprise CRM. | Menos amigable en mobile (post-MVP igual) |
| Tarjetas grid | Visual, espacioso | Pierde densidad; un CRM con 100+ empresas se hace pesado |
| Lista vertical simple | Mínimo código | Pobre para defensa profesional |

**Columnas recomendadas**: Nombre, Sector, Teléfono, Página web (link), Creado en (relative date), Acciones (Ver / Editar / Eliminar).

**Filtros/búsqueda**: Input de búsqueda client-side por nombre + sector. **Sin paginación en Change 2** (MSW tiene 3 empresas; agregarla cuando vuelvan 50+).

**Empty state**: Cuando array vacío → ilustración mínima (icono Building2) + texto + botón "Crear primera empresa". Cuando filtro no encuentra → texto "No hay empresas que coincidan con tu búsqueda".

---

### 4.2 Crear empresa

| Opción | Pros | Contras |
|--------|------|---------|
| **Dialog modal (Recomendado)** | Rápido, no navega fuera del contexto, UX moderna estilo Linear/Notion. Menos código que página completa. | Forms muy grandes se sienten apretados — pero el de Empresa es chico (7 campos) |
| Página `/empresas/nueva` | Más espacio | Más routing, navegación extra para una acción simple |
| Sheet/Drawer lateral | Alternativa moderna | Requiere instalar Sheet, similar al Dialog |

**Recomendación**: Dialog. El formulario tiene 7 campos máximo, cabe cómodo. Botón "Nueva empresa" en topbar de la página.

---

### 4.3 Editar empresa

Reusar `EmpresaForm` con `defaultValues` poblados desde `useEmpresa(id)`. El componente recibe prop `mode: 'create' | 'edit'` para decidir si llama `useCreateEmpresa` o `useUpdateEmpresa` en submit.

Acceso: botón "Editar" en cada fila → abre el mismo `EmpresaFormDialog` pero precargado.

---

### 4.4 Eliminar empresa

`AlertDialog` shadcn con texto "¿Eliminar la empresa **Innovatech Solutions**? Esta acción no se puede deshacer. Sus prospectos y clientes asociados quedarán huérfanos." (en el contrato, no especifica si DELETE cascada — asumimos NO cascada, advertimos al usuario).

**Manejo de 404**: si el usuario abre el confirm y otro tab eliminó la empresa antes → DELETE devuelve 404 → toast "La empresa ya fue eliminada" + cerrar dialog + invalidar lista.

---

### 4.5 Detalle de empresa

Página `/empresas/:id` con header (nombre + sector + acciones Editar/Eliminar) y **Tabs**:
- **Información**: campos generales + redes sociales (con iconos lucide y links)
- **Prospectos** (N): tabla de prospectos vinculados
- **Clientes** (N): tabla de clientes vinculados

Las 3 queries (`useEmpresa`, `useEmpresaProspectos`, `useEmpresaClientes`) corren en paralelo gracias a TanStack Query. Solo la activa muestra spinner; las otras quedan en cache para cuando el usuario cambie de tab.

**404 en detail**: si `:id` no existe → mostrar página de error embebida en AppShell + botón "Volver a Empresas".

---

### 4.6 Schemas Zod

```ts
// Pseudocódigo, no es implementación
const empresaCreateSchema = z.object({
  nombre: z.string().min(1, 'requerido').max(150),
  sector: z.string().max(80).optional().or(z.literal('')),
  telefono: z.string().regex(/^[\d\s+()-]{7,20}$/).optional().or(z.literal('')),
  pagina_web: z.string().url().optional().or(z.literal('')),
  facebook: z.string().max(150).optional().or(z.literal('')),
  instagram: z.string().max(150).optional().or(z.literal('')),
  twitter: z.string().max(150).optional().or(z.literal('')),
});

const empresaUpdateSchema = empresaCreateSchema.partial();
```

- **URL**: validar `pagina_web` con `z.string().url()`. Para redes sociales, NO validar URL — permitir handle `@usuario` también.
- **Teléfono**: regex laxa (acepta `+52 961 555 1234`, `9615551234`, etc.).
- **Manejo de strings vacíos**: el form envía `""` por defecto. Convertir a `null` antes de POST/PATCH (backend espera null para campos opcionales no provistos).

---

### 4.7 Query keys + invalidación

| Key | Hook |
|-----|------|
| `['empresas']` | useEmpresas (lista) |
| `['empresas', id]` | useEmpresa (detalle) |
| `['empresas', id, 'prospectos']` | useEmpresaProspectos |
| `['empresas', id, 'clientes']` | useEmpresaClientes |

**Invalidación tras mutations**:
- Crear → invalidar `['empresas']`
- Editar → invalidar `['empresas']` + `['empresas', id]`
- Eliminar → invalidar `['empresas']` + remover `['empresas', id]` del cache

---

### 4.8 Optimistic updates

**Recomendación**: NO en Change 2. Mantener simple:
- Mutations refetch la lista on success
- Loading states visibles (botón con spinner, fila grisada al eliminar)

Costo de implementar optimistic updates: ~30% más código por cada mutation + rollback en error. Beneficio: percepción de velocidad. Para residencia con MSW (200-400ms delay), invalidación normal es perfectamente fluida.

**Si después se quiere agregar**: hacerlo en un Change posterior aislado, no acá.

---

### 4.9 Manejo de errores

| Status | Acción |
|--------|--------|
| 422 (validación) | `form.setError` por campo desde `error.details` |
| 404 (no encontrado) | Toast "Empresa no encontrada" + redirect a `/empresas` (caso edit/delete/detail) |
| 401 | Cliente HTTP ya maneja: logout + redirect a `/login` |
| 500 / network | Toast genérico "Algo salió mal, intenta nuevamente" |
| Lista vacía con error | Componente de error con botón "Reintentar" |

---

### 4.10 Testing strategy (Strict TDD activado)

**Filosofía**: RED-GREEN-REFACTOR. Para cada componente/hook crítico, escribir el test PRIMERO (que falla) y después implementar el código mínimo para que pase.

Tests planeados:

| Test | Cobertura |
|------|-----------|
| `useEmpresas.test.tsx` | listado exitoso, lista vacía, 500 |
| `useCreateEmpresa.test.tsx` | crear exitoso invalida lista, 422 propaga detalles |
| `useDeleteEmpresa.test.tsx` | delete exitoso, 404 |
| `EmpresasListPage.test.tsx` | render, búsqueda filtra, botón nueva empresa abre dialog |
| `EmpresaDetailPage.test.tsx` | render con id válido, 404 redirige |

**Tests NO escritos** (para evitar test bloat en MVP):
- Tests de componentes presentacionales puros (EmpresaForm internals) — cubiertos indirectamente por integration tests de páginas.
- Tests de TanStack Query internals.

---

## 5. Recomendación final

| Tema | Decisión |
|------|----------|
| Lista | shadcn Table + búsqueda client-side por nombre/sector, sin paginación |
| Crear/Editar | Mismo `EmpresaForm` en `EmpresaFormDialog`, mode prop discrimina |
| Eliminar | AlertDialog con confirmación + manejo 404 |
| Detalle | Página dedicada `/empresas/:id` con Tabs (Info / Prospectos / Clientes) |
| Schemas | `empresaCreateSchema` + `empresaCreateSchema.partial()` para update |
| Query keys | Patrón jerárquico `['empresas', id?, subrel?]` con invalidación quirúrgica |
| Optimistic updates | NO en Change 2 (futuro) |
| Errores | 422 → setError, 404 → redirect+toast, 500 → toast genérico |
| Tests | 5 archivos test (hooks + pages), strict TDD |

---

## 6. Componentes shadcn a instalar

```bash
pnpm dlx shadcn@latest add table dialog alert-dialog tabs --yes --overwrite
```

Esto trae: `table.tsx`, `dialog.tsx`, `alert-dialog.tsx`, `tabs.tsx` y sus dependencias Radix.

---

## 7. Riesgos identificados

1. **Strict TDD vs velocidad**: escribir tests primero suma tiempo. Mitigación: tests cubren los hooks y pages (alto valor), NO cada componente presentacional. Si el ritmo se vuelve insostenible, conversar con el usuario antes de saltar tests.

2. **shadcn Table no es DataTable**: shadcn provee primitivas (`<Table><TableRow><TableCell>`); la paginación/orden/filtro hay que armarlos a mano o con TanStack Table. Para Change 2 (3 empresas mock) no se necesita TanStack Table. Si vuelven 100+ empresas en Changes futuros, considerar instalarlo entonces.

3. **MSW handler de `/empresas/:id/prospectos`**: el handler actual filtra `prospectosFixture` por `empresa_id` — correcto. Pero los prospectos creados en runtime (in-memory mutable) no aparecen aún en ninguna empresa porque Change 4 implementa CREATE de prospectos. Para Change 2, el filtro funciona con los 3 fixtures iniciales. Documentar para no confundir al usuario.

4. **Cascada al eliminar**: el contrato NO especifica si DELETE empresa borra sus prospectos/clientes. Asumimos NO cascada (orphan permitido). Aviso al usuario en el AlertDialog. Si el backend cuando exista hace cascada, ajustamos el copy del dialog.

5. **`exactOptionalPropertyTypes: false`**: ya deshabilitado en Change 1 por shadcn. En este Change los tipos `Empresa` tienen muchos `| null` — eso compila bien con la config actual.

6. **Form de redes sociales**: el contrato dice "URL o usuario de Facebook/Instagram/Twitter". Decidir si validar URL estricta o permitir handles. Recomendación: permitir ambos (sin validar formato URL en estos 3 campos). Solo `pagina_web` se valida como URL.

---

## 8. Preguntas abiertas para el usuario

| # | Pregunta | Default si no responde |
|---|----------|------------------------|
| Q1 | ¿Tabla densa o tarjetas? | Tabla (recomendado) |
| Q2 | ¿Dialog modal o página separada para crear/editar? | Dialog |
| Q3 | ¿Aviso de no-cascada en delete dialog? | Sí: "Sus prospectos y clientes asociados quedarán huérfanos" |
| Q4 | ¿Mostrar las 3 tabs (Info/Prospectos/Clientes) o solo info en detalle? | Las 3 tabs |
| Q5 | ¿Estricto strict-TDD (tests siempre primero) o pragmático (tests al final del componente)? | Strict según config — pero el usuario puede decir "relajado" |
| Q6 | ¿Hay que agregar campo extra que no esté en el contrato? (ej: notas internas, logo URL) | No, ceñirse al contrato |
| Q7 | ¿Búsqueda solo por nombre, o también por sector/teléfono? | Por nombre + sector |

---

## 9. Listo para sdd-propose

**Sí.** Esta exploración cubre las 10 áreas con tradeoffs claros. Después de resolver Q1–Q7, pasamos a `/sdd-propose empresas-crud`.
