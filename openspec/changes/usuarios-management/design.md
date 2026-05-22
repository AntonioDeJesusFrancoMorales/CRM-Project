# Design: Usuarios Management

**Change**: usuarios-management (Change 3)
**Fecha**: 2026-05-21
**Persistencia**: hybrid
**Strict TDD**: enabled
**Patrón base**: réplica de `src/features/empresas/` con adaptaciones documentadas

---

## 1. Technical Approach

Feature-first dentro de `src/features/usuarios/` siguiendo exactamente las mismas capas establecidas en Change 2 (Empresas):

```
schemas (Zod) -> hooks (TanStack Query) -> components (shadcn + RHF) -> pages
```

Diferencia clave vs Empresas: **no hay página de detalle** (no existen subrelaciones del Usuario). Todo cabe en la lista + un Dialog de edición.

Decisión nueva en este Change: **bloqueo parcial del admin en sesión**. La lógica vive en client-side (deshabilitar botones críticos cuando el usuario de la fila es el mismo que el `authStore.usuario`), apoyada visualmente con `Tooltip` de shadcn.

```
UsuariosListPage
  ├── useUsuarios()         -> tabla
  ├── useAuthStore()        -> usuario en sesión (para isOwnAccount)
  ├── UsuariosTable
  │     ├── filtro rol_sistema (Select) + búsqueda nombre/correo
  │     ├── Badge (rol_sistema + activo)
  │     └── DropdownMenu por fila:
  │           ├── Editar          -> UsuarioFormDialog (mode=edit)
  │           ├── Desactivar      -> useDesactivarUsuario (endpoint dedicado)
  │           ├── Reactivar       -> useUpdateUsuario({activo:true}) (PATCH genérico)
  │           └── Eliminar        -> UsuarioDeleteDialog -> useDeleteUsuario
  ├── UsuarioFormDialog (create) -> UsuarioForm (mode=create)
  ├── UsuarioFormDialog (edit)   -> UsuarioForm (mode=edit, isOwnAccount?)
  └── UsuarioDeleteDialog        -> useDeleteUsuario
```

---

## 2. Architecture Decisions

> Continuación numérica desde Change 2 (último ADR = ADR-012). Esta feature introduce ADR-013 a ADR-021.

### ADR-013: `UsuarioForm` reutilizable con prop `mode` + variante `isOwnAccount`

**Contexto**: Necesitamos un solo componente de formulario para crear y editar usuarios, con la complicación adicional de que cuando el usuario que se está editando coincide con el de la sesión (admin editando su propia cuenta), el campo `rol_sistema` debe estar deshabilitado para evitar autodegradación.

**Decisión**: Una sola `UsuarioForm` con dos props:
- `mode: 'create' | 'edit'` — controla labels del botón submit, valores por defecto y reglas de validación condicionales.
- `isOwnAccount?: boolean` — cuando es `true`, el `Select` de `rol_sistema` se renderiza deshabilitado y envuelto en `Tooltip` con el mensaje "No puedes cambiar tu propio rol".

**Alternativas consideradas**:
- A: Dos componentes separados (`UsuarioCreateForm`, `UsuarioEditForm`) — descartada porque duplica 90% del JSX (4 de 5 campos son idénticos) y rompe el patrón ADR-007 ya establecido en Empresas.
- B: Una prop `lockedFields: Array<keyof Usuario>` genérica — descartada por over-engineering (YAGNI). Solo hay un caso real (`rol_sistema` cuando `isOwnAccount`); abstraer prematuramente confunde sin aportar valor.

**Consecuencias**:
- Positivas: DRY, consistencia visual con Empresas, fácil de mantener.
- Negativas: La prop `isOwnAccount` solo aplica en `mode='edit'`. Hay que documentar en el JSDoc que en `mode='create'` se ignora.
- Neutrales: El componente queda con 2 ramas pequeñas en JSX (con/sin Tooltip alrededor del Select).

**Verificable por**: `UsuariosListPage.test.tsx` cubre el caso "admin edita su propia cuenta -> Select de rol está disabled".

---

### ADR-014: `usuarioUpdateSchema = usuarioCreateSchema.partial()`

**Contexto**: PATCH `/usuarios/:id` acepta cualquier subset de campos. Necesitamos un schema Zod para validar el form de edición que sea consistente con el de creación pero permita campos vacíos/ausentes.

**Decisión**: Igual que ADR-008 en Empresas — un schema base `usuarioCreateSchema` con todos los campos requeridos y un derivado `usuarioUpdateSchema = usuarioCreateSchema.partial()` para edición.

**Alternativas consideradas**:
- A: Dos schemas separados escritos a mano — descartada por duplicación y riesgo de divergencia silenciosa.
- B: Un solo schema con todos los campos opcionales + validación condicional al submit — descartada porque `mode='create'` debe forzar nombre, correo y rol como obligatorios; mezclar reglas confunde al `resolver` de RHF.

**Consecuencias**:
- Positivas: DRY total entre create/edit. Refactor de un campo se propaga automáticamente.
- Negativas: En `mode='edit'`, si el usuario borra el campo `nombre`, Zod NO falla (porque es partial). Aceptable: el backend rechaza si el resultado no es válido (422). Mitigación: el form precarga valores existentes, así que en la práctica nunca se envía vacío.
- Neutrales: Type-safe gracias a `z.infer`.

**Verificable por**: Tipo de `EmpresaUpdateInput` igual a `Partial<EmpresaCreateInput>` — el compilador valida. Test indirecto en flujo de edit de `UsuariosListPage.test.tsx`.

---

### ADR-015: Integración Select shadcn + react-hook-form vía `Controller`

**Contexto**: El campo `rol_sistema` es un enum (`'admin' | 'usuario'`). Necesitamos un Select con buena UX (no el `<select>` nativo). shadcn ofrece `Select` basado en Radix, pero su API no es compatible con `register()` de RHF porque no expone un input nativo con `ref` y `onChange` estándar.

**Decisión**: Usar el patrón `Controller` de RHF para envolver el `Select` de shadcn. Este es el patrón **oficialmente documentado por shadcn** para integración con RHF. Estructura:

```tsx
<FormField
  control={form.control}
  name="rol_sistema"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Rol del sistema</FormLabel>
      <Select onValueChange={field.onChange} value={field.value} disabled={isOwnAccount}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un rol" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="usuario">Usuario</SelectItem>
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>
```

`FormField` de shadcn ya es un wrapper de `Controller` — no necesitamos importarlo explícitamente.

**Alternativas consideradas**:
- A: `<select>` nativo estilado con Tailwind — descartada porque rompe la consistencia visual con el resto de la app (Dialog, AlertDialog, Tabs son todos Radix).
- B: `register('rol_sistema')` directamente sobre `SelectTrigger` — descartada porque NO funciona; el `Select` de Radix maneja su valor internamente y `register` no captura el cambio.
- C: Manejar el valor con `useState` + `setValue` manualmente — descartada porque rompe la integración con `formState` (errors, isDirty, etc.).

**Consecuencias**:
- Positivas: Patrón estándar, ya usado por toda la comunidad shadcn. Integración total con `formState`.
- Negativas: Un poco más verboso que `register`. Aceptable por consistencia.
- Neutrales: Aplica también si en el futuro se agrega un Select para `rol_empresa` (cuando se defina el enum).

**Verificable por**: El form se monta sin warnings, el submit captura el valor correctamente y el Zod schema valida `rol_sistema` como enum. Test indirecto en `UsuariosListPage.test.tsx` (flujo crear usuario con rol seleccionado).

---

### ADR-016: `TooltipProvider` se monta en el app shell (App.tsx)

**Contexto**: `Tooltip` de shadcn requiere un `TooltipProvider` ancestro en el árbol React. Hay dos lugares plausibles:
1. Dentro de `UsuariosListPage` (scope mínimo).
2. En el app shell global (`App.tsx`), envolviendo `RouterProvider`.

**Decisión**: Montar `<TooltipProvider>` en `src/App.tsx`, envolviendo `<RouterProvider router={router} />`. Es el mismo lugar donde ya viven los providers globales (`QueryClientProvider`, `Toaster`).

Estructura resultante en `App.tsx`:
```tsx
<QueryClientProvider client={queryClient}>
  <TooltipProvider delayDuration={150}>
    <RouterProvider router={router} />
    <Toaster richColors position="top-right" />
  </TooltipProvider>
</QueryClientProvider>
```

**Alternativas consideradas**:
- A: Envolver solo `UsuariosListPage` — descartada porque cuando otras features (Prospectos, Clientes en Changes futuros) usen Tooltip, tendrían que repetir el provider. Acumula deuda.
- B: Envolver solo `AppShell` (en `components/layout/AppShell.tsx`) — descartada porque `AppShell` se renderiza dentro del árbol de rutas y un Tooltip que aparezca antes de rutas protegidas (caso edge: aún ninguno previsto, pero conceptualmente) quedaría sin provider. Mejor lo más arriba posible.
- C: Crear un wrapper `AppProviders` aparte — descartada por YAGNI (solo hay 3 providers; un wrapper sería ceremonia innecesaria en esta etapa).

**Consecuencias**:
- Positivas: Cualquier feature futura puede usar `Tooltip` sin tocar providers. Centraliza la decisión arquitectónica de "providers globales viven en App.tsx".
- Negativas: `App.tsx` se acopla a una dependencia (shadcn-tooltip) que solo Usuarios usa hoy. Aceptable: es una decisión a futuro, no un acoplamiento real (Tooltip es genérico).
- Neutrales: `delayDuration={150}` es el valor recomendado por shadcn para UX rápida sin parpadeo.

**Verificable por**: Render manual de `UsuariosListPage` y hover sobre botones bloqueados muestra Tooltip sin warnings en consola.

---

### ADR-017: Bloqueo parcial del admin — helper `isOwnAccount` inline

**Contexto**: El admin en sesión NO puede:
- Cambiar su propio `rol_sistema` (evita autodegradación).
- Desactivarse a sí mismo.
- Eliminarse a sí mismo.

Pero SÍ puede editar su nombre y correo. La lógica se reduce a comparar `usuario.id === sessionUser.id`. Hay que decidir dónde vive.

**Decisión**: La comparación es **inline** en los componentes que la necesitan (`UsuariosTable`, `UsuarioFormDialog`, `UsuarioDeleteDialog`), leyendo `sessionUser` desde `useAuthStore()` directamente. NO se extrae a un helper `usuarios/lib/permissions.ts` en este Change.

Patrón en los 3 componentes:
```tsx
const sessionUser = useAuthStore((s) => s.usuario);
const isOwnAccount = sessionUser?.id === usuario.id;
```

Cuando `isOwnAccount` es `true`:
- `UsuariosTable`: deshabilita los items "Desactivar" y "Eliminar" del DropdownMenu, envueltos en `Tooltip`.
- `UsuarioFormDialog` (mode=edit): pasa `isOwnAccount` a `UsuarioForm`, que deshabilita el `Select` de `rol_sistema`.
- `UsuarioDeleteDialog`: deshabilita el botón de confirmar eliminación con Tooltip (defensa en profundidad — el DropdownMenu ya bloqueó la entrada).

**Alternativas consideradas**:
- A: Helper `isOwnAccount(usuario, sessionUserId)` en `src/features/usuarios/lib/permissions.ts` — descartada por **prematuro**. La función sería literalmente `return usuario.id === sessionUserId;`. Una línea no justifica un módulo. Si en futuros Changes (4-8) aparece lógica de permisos más compleja (escalable, multi-rol, etc.) se extraerá en ese momento.
- B: Hook custom `useIsOwnAccount(usuario)` — descartada por la misma razón. Un hook que internamente solo hace `useAuthStore` + comparación de IDs es overhead.
- C: Computar `isOwnAccount` solo en `UsuariosListPage` y propagar como prop hacia abajo — descartada porque obliga a pasar la prop por 3 niveles (Page -> Table -> DropdownMenu -> Tooltip wrapper). Que cada componente lea `useAuthStore` directamente es más limpio (Zustand está diseñado para este patrón).

**Consecuencias**:
- Positivas: Cero indirección. Cada componente es autocontenido para su decisión de UI.
- Negativas: La comparación se repite literalmente en 3 lugares. Refactor a helper trivial si surge la necesidad (10 minutos).
- Neutrales: Si en Change 4+ aparece "permissions matrix" más rica, se extrae sin romper consumidores (los componentes seguirían leyendo del store, no del helper).

**Verificable por**: `UsuariosListPage.test.tsx` debe cubrir:
1. Admin en sesión ve los items Desactivar/Eliminar deshabilitados sobre su propia fila.
2. Admin en sesión NO ve esos items deshabilitados en filas de otros usuarios.
3. El form de edición sobre la propia cuenta tiene el Select de rol disabled.

---

### ADR-018: Asimetría desactivar (endpoint dedicado) vs reactivar (PATCH genérico)

**Contexto**: El handler MSW en `src/mocks/handlers/usuarios.ts` expone:
- `PATCH /usuarios/:id/desactivar` — endpoint dedicado que pone `activo: false`.
- NO existe `PATCH /usuarios/:id/activar`.

La reactivación se hace vía PATCH genérico con `{ activo: true }`. Esta asimetría refleja la realidad del contrato. Hay que formalizarla como decisión.

**Decisión**: Aceptar la asimetría tal cual y documentarla:
- `useDesactivarUsuario()` — mutation dedicada que llama al endpoint específico. Útil porque "desactivar" es una operación de negocio con potencial lógica server-side (auditoría, notificaciones, etc.) que no aplica a un PATCH genérico.
- `useUpdateUsuario(id)` — mutation genérica. Se usa tanto para editar campos (nombre/correo/rol) como para reactivar (`mutate({ activo: true })`).

En el `DropdownMenu` de `UsuariosTable`:
- Si `usuario.activo === true` -> muestra "Desactivar" -> `useDesactivarUsuario`.
- Si `usuario.activo === false` -> muestra "Reactivar" -> `useUpdateUsuario.mutate({ activo: true })`.

Documentación obligatoria:
- JSDoc sobre `useDesactivarUsuario`: explica por qué es endpoint dedicado.
- JSDoc sobre `useUpdateUsuario`: nota corta indicando que también se usa para reactivar pasando `{ activo: true }`.

**Alternativas consideradas**:
- A: Crear `useActivarUsuario` que internamente llame a `useUpdateUsuario` con `{ activo: true }` — descartada porque agrega un wrapper sin ganancia (no oculta complejidad, solo añade un archivo más).
- B: Hacer que `useDesactivarUsuario` también use PATCH genérico (con `{ activo: false }`) — descartada porque desperdicia el endpoint dedicado del backend y pierde la semántica de "desactivar" como operación de negocio diferenciada.
- C: Crear endpoint MSW `/usuarios/:id/activar` para simetría — descartada porque toca el contrato (NO tocar mocks/handlers según proposal) y no aporta valor real.

**Consecuencias**:
- Positivas: Respeta el contrato MSW (que es la fuente de verdad). Refleja un patrón backend común (soft-delete con endpoint dedicado).
- Negativas: Un futuro mantenedor podría sorprenderse al no encontrar `useActivarUsuario`. Mitigado por JSDoc.
- Neutrales: Si el backend real algún día agrega `PATCH /usuarios/:id/activar`, el refactor es local a un solo hook (agregar `useActivarUsuario` y reemplazar el call site en `UsuariosTable`).

**Verificable por**:
- `useDesactivarUsuario.test.tsx` cubre el endpoint dedicado.
- El flujo de reactivar se cubre indirectamente en `UsuariosListPage.test.tsx` (test: "click en Reactivar invoca update con activo: true").

---

### ADR-019: Badges visuales para `rol_sistema` y estado `activo`

**Contexto**: La tabla debe mostrar de un vistazo el rol del usuario y si está activo o no. Las opciones eran texto plano, iconos o badges.

**Decisión**: Usar `Badge` de shadcn con las siguientes variantes y colores:

| Campo | Valor | Variante shadcn | Clase Tailwind extra | Razón |
|-------|-------|-----------------|----------------------|-------|
| `rol_sistema` | `admin` | `default` | `bg-primary` (azul brand) | Rol con privilegios — destacar |
| `rol_sistema` | `usuario` | `secondary` | neutral por defecto | Rol estándar — visualmente discreto |
| `activo` | `true` | `outline` | `border-emerald-500 text-emerald-700` | Verde = estado saludable |
| `activo` | `false` | `outline` | `border-muted-foreground text-muted-foreground` | Gris = desactivado, neutral (no error) |

**Alternativas consideradas**:
- A: Iconos en vez de badges (escudo para admin, candado para inactivo) — descartada porque requiere instalar iconos extra y el badge ya es estándar shadcn. Iconos sin texto reducen accesibilidad.
- B: Color rojo para `inactivo` — descartada porque "inactivo" no es error, es estado. Rojo confunde semánticamente.
- C: Sin badge para `rol_sistema: usuario` (solo mostrar cuando es admin) — descartada porque deja la tabla con celdas vacías y rompe la consistencia visual.

**Consecuencias**:
- Positivas: Lectura rápida de la tabla. Visualmente alineado con shadcn.
- Negativas: Dos variantes custom (emerald + muted) que técnicamente no son del theme base. Aceptable porque emerald es una paleta Tailwind estándar y muted ya está en el theme shadcn.
- Neutrales: Si en el futuro se cambia el design system, las clases custom son fáciles de migrar (regex en un archivo).

**Verificable por**: Inspección visual + test snapshot opcional. No es prioridad de Strict TDD.

---

### ADR-020: Política de testing — solo hooks críticos + página

**Contexto**: Strict TDD obliga a RED -> GREEN para cada test. Hay que decidir qué se testea para no inflar el ciclo sin aportar valor.

**Decisión**: Testear con Vitest (RTL + MSW) solamente:

| Test file | Razón |
|-----------|-------|
| `useUsuarios.test.tsx` | Hook crítico: alimenta la tabla principal. Cubre 200 OK + error. |
| `useCreateUsuario.test.tsx` | Mutation crítica: cubre invalidación de cache + manejo 422. |
| `useDeleteUsuario.test.tsx` | Mutation crítica: cubre 204 y 404 (idempotencia). |
| `useDesactivarUsuario.test.tsx` | Endpoint dedicado — comportamiento único, merece test propio (cubre asimetría ADR-018). |
| `UsuariosListPage.test.tsx` | Test de integración: cubre render + búsqueda + filtro + apertura de Dialog + bloqueo parcial del admin en sesión. |

**NO se testean** (decisión consciente):
- `UsuariosTable` — presentacional puro. Su comportamiento se ejercita desde `UsuariosListPage.test.tsx`.
- `UsuarioForm` — presentacional. Su comportamiento se ejercita desde los tests de mutations (al disparar submit).
- `UsuarioFormDialog`, `UsuarioDeleteDialog` — wrappers. Su lógica son 5 líneas (open/close + delegación a la mutation).
- `useUpdateUsuario` — ver ADR-021.

**Alternativas consideradas**:
- A: Cobertura 100% (un test por archivo) — descartada por costo/beneficio. Strict TDD ya ralentiza; cubrir presentacionales solo mide líneas, no comportamiento útil.
- B: Solo testear hooks (sin page test) — descartada porque el bloqueo parcial del admin es lógica de UI compuesta (DropdownMenu + condiciones); sin test de página queda sin cobertura.
- C: Solo test E2E con Playwright — descartada por scope (E2E está out of scope para este Change y no hay infra Playwright aún).

**Consecuencias**:
- Positivas: Ciclo TDD ágil. Tests miden comportamiento real (mutations + flujo de página).
- Negativas: Si un componente presentacional regresiona visualmente, los tests no lo detectan. Aceptable: revisión manual + capturas en PR.
- Neutrales: Si surge un bug específico en `UsuariosTable` o `UsuarioForm`, se agrega test dirigido en ese momento.

**Verificable por**: 5 archivos test creados, todos verdes. Cobertura de hooks críticos = 100%. Cobertura de página = flujo principal + bloqueo parcial.

---

### ADR-021: `useUpdateUsuario` sin test directo — cobertura indirecta

**Contexto**: `useUpdateUsuario` es uno de los 5 hooks de la feature. Decidir si merece test propio dado el costo de Strict TDD.

**Decisión**: NO se escribe `useUpdateUsuario.test.tsx`. La cobertura del hook se logra **indirectamente**:
1. `UsuariosListPage.test.tsx` ejercita el hook al simular el flujo "abrir editar -> cambiar campo -> submit -> ver fila actualizada".
2. `useDesactivarUsuario.test.tsx` (el complemento de la asimetría ADR-018) no toca `useUpdateUsuario`, pero el flujo de reactivar se cubre en el page test.

**Alternativas consideradas**:
- A: Escribir test directo (`useUpdateUsuario.test.tsx`) que cubra 200 + 422 + 404 — descartada por costo/beneficio. El hook es estructuralmente idéntico a `useCreateUsuario` (mismo patrón TanStack mutation + invalidate). Si `useCreateUsuario` está cubierto, `useUpdateUsuario` lo está por **simetría estructural** + cobertura de integración.
- B: Cubrir `useUpdateUsuario` solo desde `useDesactivarUsuario.test.tsx` (reactivar usa update) — descartada porque mezcla preocupaciones; el test de desactivar no debe asumir nada sobre el flujo de update.

**Plan de remediación**: Si en QA manual o uso real surge un bug exclusivo de `useUpdateUsuario` (ej. invalidación de cache no funciona, 422 no propaga errores), se agrega `useUpdateUsuario.test.tsx` con el caso específico. Trazabilidad: anotar el bug + crear el test = ciclo TDD post-hoc válido (no idealmente puro, pero aceptable como excepción documentada).

**Consecuencias**:
- Positivas: Ahorra ~30 minutos de ciclo TDD sin perder cobertura real.
- Negativas: Si el hook diverge del patrón de `useCreateUsuario` (ej. lógica custom), la simetría estructural deja de aplicar. Mitigado: el hook se mantiene mínimo (mutation + invalidate, sin lógica extra).
- Neutrales: Decisión revisable. Si en Change 4+ aparece patrón similar, se reevalúa.

**Verificable por**: Auditoría de cobertura — `useUpdateUsuario` aparece como invocado en al menos 2 paths del page test (editar usuario + reactivar usuario).

---

## 3. Component Map

```
UsuariosListPage
│
├── UsuariosTable (presentacional + acciones)
│     props: { usuarios, sessionUser, onEdit, onDelete, onDesactivar, onReactivar }
│     interno:
│       - Input búsqueda (controlled)
│       - Select filtro rol_sistema (admin/usuario/todos)
│       - Table con DropdownMenu por fila
│
├── UsuarioFormDialog (create + edit en un componente con discriminated union)
│     props (CreateProps | EditProps):
│       - { mode: 'create', open, onOpenChange }
│       - { mode: 'edit', open, onOpenChange, usuario, isOwnAccount }
│     interno:
│       - Llama useCreateUsuario | useUpdateUsuario según mode
│       - Renderiza <UsuarioForm/>
│
├── UsuarioForm (presentacional puro)
│     props: { mode, defaultValues?, onSubmit, onCancel?, isSubmitting?, serverErrors?, isOwnAccount? }
│     campos:
│       - nombre (Input)        — siempre editable
│       - correo (Input)         — siempre editable
│       - rol_sistema (Select)   — disabled si isOwnAccount=true (con Tooltip)
│       - rol_empresa (Input)    — siempre editable (string libre)
│
│       NOTA: el campo `activo` NO se edita desde el form. Su única
│       superficie de cambio son las acciones "Desactivar" / "Reactivar"
│       del DropdownMenu de la tabla (ver ADR-018). Evita UX duplicada
│       y respeta el contrato del POST (que NO acepta activo en el body).
│
└── UsuarioDeleteDialog (AlertDialog)
      props: { open, onOpenChange, usuario, isOwnAccount }
      interno:
        - Si isOwnAccount: botón "Eliminar" disabled + Tooltip (defensa en profundidad)
        - Llama useDeleteUsuario.mutate(usuario.id)
```

Relación con primitivos shadcn:
- `select.tsx` -> usado en `UsuarioForm` (rol_sistema) y `UsuariosTable` (filtro).
- `badge.tsx` -> usado en `UsuariosTable` (rol + estado).
- `tooltip.tsx` -> usado en `UsuariosTable` (acciones bloqueadas), `UsuarioForm` (rol bloqueado), `UsuarioDeleteDialog` (botón bloqueado).

---

## 4. Data Flow

### 4.1 Estado global y stores

| Store | Rol en esta feature | Lectura/Escritura |
|-------|----------------------|-------------------|
| `useAuthStore` (Zustand+persist) | Provee `usuario` (la sesión actual) para calcular `isOwnAccount` | Solo lectura |
| TanStack Query cache `['usuarios']` | Lista completa de usuarios | Lectura + invalidación tras mutations |
| TanStack Query cache `['usuarios', id]` | Usuario individual (no se usa activamente — no hay detail page) | No se toca en este Change |

### 4.2 Crear usuario

```
Click "Nuevo usuario" -> setCreateOpen(true)
UsuarioFormDialog (mode='create')
  -> UsuarioForm (mode='create', sin defaultValues)
     submit (datos válidos por Zod)
        -> useCreateUsuario.mutate(formData)
           -> stringsToNulls(formData)
           -> POST /usuarios
              201 -> queryClient.invalidateQueries(['usuarios']) + toast éxito + setCreateOpen(false)
              422 -> form.setError(field, message) por cada detail
```

### 4.3 Editar usuario

```
Click "Editar" en fila usuario X -> setEditTarget(X) + setEditOpen(true)
UsuarioFormDialog (mode='edit', usuario=X, isOwnAccount = sessionUser.id === X.id)
  -> UsuarioForm (mode='edit', defaultValues=nullsToStrings(X), isOwnAccount)
     submit
        -> useUpdateUsuario(X.id).mutate(formData)
           -> stringsToNulls(formData)
           -> PATCH /usuarios/X.id
              200 -> invalidate(['usuarios']) + toast + setEditOpen(false)
              422 -> propaga al form
```

### 4.4 Eliminar usuario

```
Click "Eliminar" en fila X -> setDeleteTarget(X)
UsuarioDeleteDialog (isOwnAccount = sessionUser.id === X.id)
  Si isOwnAccount: botón confirmar disabled + Tooltip "No puedes eliminar tu propia cuenta"
  Confirmar -> useDeleteUsuario.mutate(X.id)
                 -> DELETE /usuarios/X.id
                    204 -> removeQueries(['usuarios', X.id]) + invalidate(['usuarios']) + toast
                    404 -> toast "ya fue eliminado" + invalidate(['usuarios']) (sync)
```

### 4.5 Desactivar usuario (endpoint dedicado)

```
Click "Desactivar" en fila X (X.activo === true) -> useDesactivarUsuario.mutate(X.id)
   -> PATCH /usuarios/X.id/desactivar
      200 -> invalidate(['usuarios']) + toast "Usuario desactivado"
      404 -> toast error + invalidate
```

### 4.6 Reactivar usuario (PATCH genérico)

```
Click "Reactivar" en fila X (X.activo === false) -> useUpdateUsuario(X.id).mutate({ activo: true })
   -> PATCH /usuarios/X.id  body: { activo: true }
      200 -> invalidate(['usuarios']) + toast "Usuario reactivado"
      422 -> toast error (no aplica setError porque no estamos en form)
```

### 4.7 Invalidación tras mutations

Todas las mutations invalidan `['usuarios']` (no `['usuarios', id]` salvo en delete que además llama `removeQueries`). Patrón idéntico al de Empresas (Change 2).

---

## 5. Type Definitions

### 5.1 Schemas Zod (en `usuario.schema.ts`)

```ts
import { z } from 'zod';

export const usuarioCreateSchema = z.object({
  nombre: z.string().min(1, 'Nombre obligatorio').max(150),
  correo: z.string().email('Correo inválido').max(200),
  rol_sistema: z.enum(['admin', 'usuario'], {
    required_error: 'Selecciona un rol',
  }),
  rol_empresa: z.string().max(100).optional().or(z.literal('')),
});

// NOTA: `activo` NO va en el schema de creación. El POST /usuarios NO acepta
// `activo` en el body — el backend lo asigna como `true` por defecto. La
// alternancia activo/inactivo se hace exclusivamente desde el DropdownMenu
// de la tabla via useDesactivarUsuario (endpoint dedicado) o useUpdateUsuario
// con `{ activo: true }` (PATCH genérico, ver ADR-018).

export const usuarioUpdateSchema = usuarioCreateSchema.partial();

export type UsuarioCreateInput = z.infer<typeof usuarioCreateSchema>;
export type UsuarioUpdateInput = z.infer<typeof usuarioUpdateSchema>;
```

> Nota: `Usuario` (el modelo del backend) ya está en `src/api/types.ts` — no se duplica acá.

### 5.2 Props de componentes clave

```ts
// UsuarioForm
interface UsuarioFormProps {
  mode: 'create' | 'edit';
  defaultValues?: Partial<UsuarioCreateInput>;
  onSubmit: (values: UsuarioCreateInput) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  serverErrors?: Array<{ field: string; message: string }>;
  /** Cuando true, el Select de rol_sistema se renderiza deshabilitado con Tooltip. Solo aplica en mode='edit'. */
  isOwnAccount?: boolean;
}

// UsuarioFormDialog (discriminated union)
type CreateProps = {
  mode: 'create';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario?: never;
};
type EditProps = {
  mode: 'edit';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario: Usuario;
  isOwnAccount: boolean;
};
type UsuarioFormDialogProps = CreateProps | EditProps;

// UsuarioDeleteDialog
interface UsuarioDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario: Usuario | null;
  isOwnAccount: boolean;
}

// UsuariosTable
interface UsuariosTableProps {
  usuarios: Usuario[];
  sessionUserId: string;
  onEdit: (usuario: Usuario) => void;
  onDelete: (usuario: Usuario) => void;
  onDesactivar: (usuario: Usuario) => void;
  onReactivar: (usuario: Usuario) => void;
}
```

### 5.3 Signatures de hooks

```ts
useUsuarios(): UseQueryResult<Usuario[], Error>
useCreateUsuario(): UseMutationResult<Usuario, Error, UsuarioCreateInput>
useUpdateUsuario(id: string): UseMutationResult<Usuario, Error, UsuarioUpdateInput>
useDeleteUsuario(): UseMutationResult<void, Error, string>
useDesactivarUsuario(): UseMutationResult<Usuario, Error, string>
```

---

## 6. File Changes

### 6.1 Crear (15 archivos)

```
src/features/usuarios/
├── schemas/usuario.schema.ts
├── hooks/
│   ├── useUsuarios.ts
│   ├── useCreateUsuario.ts
│   ├── useUpdateUsuario.ts
│   ├── useDeleteUsuario.ts
│   └── useDesactivarUsuario.ts
├── components/
│   ├── UsuariosTable.tsx
│   ├── UsuarioForm.tsx
│   ├── UsuarioFormDialog.tsx
│   └── UsuarioDeleteDialog.tsx
├── pages/
│   └── UsuariosListPage.tsx
└── __tests__/
    ├── useUsuarios.test.tsx
    ├── useCreateUsuario.test.tsx
    ├── useDeleteUsuario.test.tsx
    ├── useDesactivarUsuario.test.tsx
    └── UsuariosListPage.test.tsx
```

### 6.2 Modificar (3 archivos)

- `src/App.tsx` — agregar `<TooltipProvider delayDuration={150}>` alrededor de `<RouterProvider>` (ADR-016).
- `src/routes/router.tsx` — importar `UsuariosListPage` y reemplazar `<UsuariosPlaceholder />` en la ruta `/usuarios`.
- `src/routes/placeholders.tsx` — eliminar el export `UsuariosPlaceholder`.

### 6.3 Instalar (3 primitivos shadcn)

```bash
pnpm dlx shadcn@latest add select badge tooltip --yes --overwrite
```

Genera:
- `src/components/ui/select.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/tooltip.tsx`

### 6.4 NO tocar

- `src/api/types.ts`
- `src/api/usuarios.ts`
- `src/mocks/handlers/usuarios.ts`
- `src/mocks/fixtures/usuarios.ts`
- `src/store/authStore.ts`
- `src/components/layout/RoleGuard.tsx`
- Cualquier archivo de Empresas, Login u otras features

---

## 7. Testing Strategy (Strict TDD)

Aplica ADR-020. Ciclo RED -> GREEN -> REFACTOR para cada uno de los 5 archivos test.

| Test file | Casos cubiertos |
|-----------|------------------|
| `useUsuarios.test.tsx` | 200 con lista no vacía, error 500 propaga |
| `useCreateUsuario.test.tsx` | 201 invalida `['usuarios']`, 422 propaga `details` |
| `useDeleteUsuario.test.tsx` | 204 + remove, 404 maneja gracefully |
| `useDesactivarUsuario.test.tsx` | 200 endpoint dedicado, 404 maneja, invalidación |
| `UsuariosListPage.test.tsx` | render con datos, búsqueda filtra por nombre/correo, filtro por rol funciona, click "Nuevo usuario" abre Dialog, click "Editar" abre Dialog con datos, **admin en sesión ve Eliminar/Desactivar deshabilitados sobre su propia fila + Select rol deshabilitado en edit form** |

Setup: `vitest` + `@testing-library/react` + `msw` con overrides por test (mismo patrón que Change 1 y 2).

---

## 8. Open Questions

Ninguna en este momento. Todas las preguntas abiertas se resolvieron en las fases explore y propose:
- Bloqueo parcial vs duro: **parcial** (Q3 resuelto).
- Filtro por activo: **out of scope** (Q2 resuelto).
- Asimetría activar/desactivar: **aceptada como decisión de diseño** (ADR-018).
- TooltipProvider: **en App.tsx** (ADR-016).
- Tests sobre UsuarioForm: **no se escriben directos** (ADR-020).

---

## 9. Migration / Rollout

No requiere migración. Feature nueva sin datos legacy. Rollback descrito en proposal (eliminar carpeta `features/usuarios/` + restaurar placeholder).

---

## 10. Estado

Listo para `sdd-tasks`.
