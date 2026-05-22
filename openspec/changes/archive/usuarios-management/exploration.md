# Exploración: usuarios-management

**Change**: usuarios-management (Change 3 del plan macro)
**Fase**: sdd-explore
**Fecha**: 2026-05-21 (America/Mexico_City)
**Persistencia**: hybrid
**Strict TDD**: enabled — test runner: `pnpm test:run` (Vitest)

---

## 1. Contexto

El Change 2 (Empresas) dejó la ruta `/usuarios` con un placeholder que dice "Gestión de usuarios del sistema. Solo accesible para administradores." El Change 3 reemplaza ese placeholder por la **vista completa de Gestión de Usuarios**, que es la pantalla donde el admin del CRM administra las cuentas del equipo.

Esta es una pantalla **admin-only**: ya existe `<RoleGuard role="admin">` protegiéndola en el router. El Change NO agrega nuevos guards — solo reemplaza el placeholder con la implementación real.

Restricciones de diseño decididas por el usuario:
- Solo admins ven y usan esta pantalla (guard ya existe).
- El admin en sesión tiene **bloqueo parcial**: puede editar su propio nombre/correo, pero NO puede cambiar su `rol_sistema`, desactivarse ni eliminarse a sí mismo.
- No se implementa cambio de contraseña en este Change (diferido).
- El contrato de tipos `Usuario` no se modifica.

---

## 2. Estado actual del código

### Lo que ya existe

```
src/
├── api/
│   └── types.ts                       ← tipo Usuario (7 campos, NO modificar)
├── mocks/
│   ├── handlers/usuarios.ts           ← 5 endpoints (ver sección 3)
│   └── fixtures/usuarios.ts           ← 2 usuarios mock
├── routes/
│   ├── placeholders.tsx               ← UsuariosPlaceholder (a REEMPLAZAR)
│   └── router.tsx                     ← /usuarios protegido con <RoleGuard role="admin" />
├── store/
│   └── authStore.ts                   ← useAuthStore → usuario.id para bloqueo parcial
└── components/ui/
    ├── alert-dialog.tsx
    ├── avatar.tsx
    ├── button.tsx
    ├── card.tsx
    ├── dialog.tsx
    ├── dropdown-menu.tsx
    ├── form.tsx
    ├── input.tsx
    ├── label.tsx
    ├── separator.tsx
    ├── sonner.tsx
    ├── table.tsx
    └── tabs.tsx
```

**Helpers compartidos ya existentes (reutilizar sin modificar):**
- `src/lib/form-utils.ts` — `stringsToNulls()` y `nullsToStrings()`
- `src/lib/format.ts` — `formatRelativeDate()` y `formatDate()`

### Lo que falta (a crear en este Change)

```
src/features/usuarios/
├── schemas/
│   └── usuario.schema.ts
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

**Primitivos shadcn que FALTAN y deben instalarse:**
- `select.tsx` (para `rol_sistema` en el form — actualmente NO instalado)
- `switch.tsx` (opcional para toggle `activo` inline — actualmente NO instalado)
- `badge.tsx` (opcional para mostrar rol/estado en tabla — actualmente NO instalado)

**Decisión importante**: dado que el proyecto ya instala shadcn components con `pnpm dlx shadcn@latest add`, la fase de Apply deberá ejecutar ese comando antes de implementar `UsuarioForm`. Ver sección 6.

**Wiring a modificar (archivos existentes):**
- `src/routes/placeholders.tsx` — eliminar `UsuariosPlaceholder`
- `src/routes/router.tsx` — reemplazar `<UsuariosPlaceholder />` por `<UsuariosListPage />`

---

## 3. Endpoints disponibles (fuente de verdad: `src/mocks/handlers/usuarios.ts`)

| Método | Ruta | Body (request) | Respuesta | Notas |
|--------|------|----------------|-----------|-------|
| `GET` | `/api/v1/usuarios` | — | `Usuario[]` | Lista completa, sin paginación |
| `GET` | `/api/v1/usuarios/:id` | — | `Usuario` o 404 | Detalle individual |
| `POST` | `/api/v1/usuarios` | `{ nombre, correo, rol_sistema?, rol_empresa? }` | `Usuario` | `activo: true` por defecto, sin campo `password` en DTO |
| `PATCH` | `/api/v1/usuarios/:id` | Partial `Usuario` | `Usuario` | Editar cualquier campo |
| `DELETE` | `/api/v1/usuarios/:id` | — | `void` o 404 | Eliminar |
| `PATCH` | `/api/v1/usuarios/:id/desactivar` | — | `Usuario` | Establece `activo: false` en fixture |

**Observaciones importantes:**
1. No existe endpoint `PATCH /usuarios/:id/activar` — para re-activar un usuario se usa el PATCH genérico con `{ activo: true }`.
2. El POST recibe el body sin `password` (las credenciales son responsabilidad del backend real; en mock el usuario se crea sin contraseña funcional).
3. El mock de `makeCrudHandlers` maneja el store en memoria vacío para POST (los usuarios creados en runtime NO persisten en el fixture de login). Esto es correcto para el mock — documentarlo en los tests.

---

## 4. Modelo Usuario (contrato actual — NO modificar)

```typescript
// src/api/types.ts
export type RolSistema = 'admin' | 'usuario';

export interface Usuario {
  id: string;
  nombre: string;           // requerido, editable
  correo: string;           // requerido, editable
  rol_sistema: RolSistema;  // 'admin' | 'usuario' — editable vía Select (bloqueado para self)
  rol_empresa: string | null; // string libre, editable
  activo: boolean;          // editable — bloqueado para self
  creado_en: string;        // ISO 8601, solo lectura en UI
}
```

**Fixture actual:** 2 usuarios — `admin@crm.test` (Antonio Franco, admin) y `vendedor@crm.test` (María González, usuario). Los tests pueden asumir este mínimo y sobrescribir con `server.use(...)`.

---

## 5. Decisiones pre-resueltas (respuestas del usuario)

| # | Tema | Decisión |
|---|------|----------|
| Q1 | Acciones del admin | **CRUD completo** — crear, editar (nombre/correo/rol_sistema/rol_empresa), activar/desactivar, eliminar |
| Q2 | Búsqueda y filtros | **Búsqueda client-side** por nombre/correo + **filtro por `rol_sistema`** (todos/admin/usuario). Sin filtro por `activo`. |
| Q3 | Auto-prevención del admin logueado | **Bloqueo parcial** — puede editar su nombre/correo, NO puede cambiar su `rol_sistema`, desactivarse ni eliminarse. La UI deshabilita las acciones críticas con tooltip explicativo. |
| Q4 | Cambio de contraseña | **Diferido** — no entra en este Change |
| Q5 | Campos extra del modelo | **Sin cambios** — mantener `src/api/types.ts` intacto |

---

## 6. Recomendaciones técnicas

### 6.1 Estructura de archivos

Replicar exactamente la arquitectura de `src/features/empresas/` (patrón probado en Change 2):

```
schemas/ → hooks/ → components/ → pages/ → __tests__/
```

### 6.2 Schema Zod

```typescript
// Pseudocódigo orientativo (no implementación final)
const usuarioCreateSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(150),
  correo: z.string().email('Correo inválido').max(200),
  rol_sistema: z.enum(['admin', 'usuario']),
  rol_empresa: z.string().max(100).optional().or(z.literal('')),
});

const usuarioUpdateSchema = usuarioCreateSchema.partial();
```

- `activo` NO va en el schema de creación (el backend lo asigna como `true`).
- Para edición, `activo` se maneja con la mutación `useDesactivarUsuario` o PATCH directo — NO dentro del form principal.

### 6.3 Hooks

| Hook | Descripción |
|------|-------------|
| `useUsuarios()` | `GET /usuarios` → `UseQueryResult<Usuario[]>` |
| `useCreateUsuario()` | `POST /usuarios` → `UseMutationResult<Usuario, Error, UsuarioCreateInput>` |
| `useUpdateUsuario(id)` | `PATCH /usuarios/:id` → `UseMutationResult<Usuario, Error, UsuarioUpdateInput>` |
| `useDeleteUsuario()` | `DELETE /usuarios/:id` → `UseMutationResult<void, Error, string>` |
| `useDesactivarUsuario()` | `PATCH /usuarios/:id/desactivar` → `UseMutationResult<Usuario, Error, string>` |

Query keys (mismo patrón jerárquico que Empresas):

```typescript
export const usuariosKeys = {
  all: ['usuarios'] as const,
  list: () => ['usuarios'] as const,
  detail: (id: string) => ['usuarios', id] as const,
};
```

### 6.4 Componentes

**`UsuariosTable`** — diferencias respecto a `EmpresasTable`:
- Columnas: Nombre, Correo, Rol Sistema (badge/texto), Rol Empresa, Estado (Activo/Inactivo), Creado, Acciones.
- Filtrado client-side por `rol_sistema` (todos/admin/usuario) + búsqueda por nombre/correo.
- El menú de acciones desactiva "Cambiar rol", "Desactivar" y "Eliminar" cuando el usuario es el admin en sesión (`usuario.id === useAuthStore().usuario?.id`), mostrando tooltip "No puedes realizar esta acción sobre tu propia cuenta".

**`UsuarioForm`** — diferencias respecto a `EmpresaForm`:
- Campo `rol_sistema`: `<Select>` con opciones admin/usuario (requiere instalar `select.tsx`).
- Campo `rol_empresa`: `<Input>` texto libre.
- Campo `correo`: `<Input type="email">`.
- En modo edit con bloqueo parcial: el campo `rol_sistema` se renderiza como `disabled` cuando `isOwnAccount === true`.

**`UsuarioFormDialog`** — mismo patrón que `EmpresaFormDialog`:
- Unión discriminada `CreateProps | EditProps`.
- Dos sub-componentes internos: `CreateDialog` y `EditDialog`.

**`UsuarioDeleteDialog`** — igual que `EmpresaDeleteDialog`:
- AlertDialog con texto "¿Eliminar a **[nombre]**? Esta acción no se puede deshacer."
- Usa `useDeleteUsuario()`.

### 6.5 Bloqueo parcial (implementación)

```typescript
// En UsuariosTable y UsuarioDeleteDialog
const { usuario: sessionUser } = useAuthStore();
const isOwnAccount = (usuario: Usuario) => sessionUser?.id === usuario.id;

// Deshabilitar en el DropdownMenu:
<DropdownMenuItem
  disabled={isOwnAccount(usuario)}
  onClick={() => onDelete(usuario)}
>
  Eliminar
</DropdownMenuItem>
```

Usar `disabled` en los `DropdownMenuItem` relevantes + un `Tooltip` o `title` explicativo (si Tooltip shadcn no está instalado, usar `title` HTML nativo para MVP).

### 6.6 Activar/Desactivar

Acción inline en el menú contextual de cada fila (no un campo del form):
- Si `activo === true`: mostrar opción "Desactivar" → llama `useDesactivarUsuario`.
- Si `activo === false`: mostrar opción "Activar" → llama `useUpdateUsuario(id)` con `{ activo: true }`.
- Ambas acciones deshabilitadas para la cuenta propia.

### 6.7 Primitivos shadcn a instalar en la fase Apply

```bash
pnpm dlx shadcn@latest add select badge --yes --overwrite
```

- `select.tsx` — obligatorio para `rol_sistema` en el form.
- `badge.tsx` — opcional para mostrar el rol en la tabla de forma visual.
- `switch.tsx` — NO necesario si el toggle activo/inactivo se maneja con opción de menú.

### 6.8 Testing strategy (Strict TDD activo)

| Archivo test | Escenarios clave |
|---|---|
| `useUsuarios.test.tsx` | lista exitosa, array vacío, error 500 |
| `useCreateUsuario.test.tsx` | crear exitoso invalida lista, error 422 propaga details |
| `useDeleteUsuario.test.tsx` | delete exitoso, 404 |
| `useDesactivarUsuario.test.tsx` | desactivar exitoso, 404 |
| `UsuariosListPage.test.tsx` | render tabla, búsqueda filtra, filtro por rol, botón "Nuevo usuario" abre dialog, acciones bloqueadas para self |

Filosofía RED → GREEN → REFACTOR. Los tests se escriben ANTES que la implementación.

---

## 7. Riesgos y preguntas abiertas

| Riesgo | Mitigación |
|--------|-----------|
| **`select.tsx` y `badge.tsx` no instalados**: el form de usuario necesita un `<Select>` para `rol_sistema`. Instalar con shadcn CLI antes de implementar `UsuarioForm`. | Documentar en tasks como paso 0 obligatorio. |
| **No existe endpoint `PATCH /activar`**: para re-activar usar `PATCH /usuarios/:id` con `{ activo: true }`. Esto es diferente al flujo de desactivar (endpoint dedicado). Los hooks deben reflejar esta asimetría. | Documentado en sección 3; el hook `useDesactivarUsuario` solo desactiva; la re-activación usa `useUpdateUsuario`. |
| **Tooltip para bloqueo parcial**: shadcn `Tooltip` no está instalado. Para MVP usar atributo `title` HTML nativo en los DropdownMenuItems deshabilitados. Si se quiere tooltip estilizado, agregar `tooltip.tsx` en la fase Apply. | Decidir en tasks si instalar tooltip o usar `title`. Recomendación: `title` es suficiente para MVP. |
| **Búsqueda + filtro simultáneos**: la tabla debe soportar búsqueda por texto Y filtro por rol al mismo tiempo (AND lógico). Implementar como `useMemo` con ambas condiciones. | Patrón simple, no es riesgo real — solo documentarlo para el implementador. |
| **Fixture mutable de usuarios**: el fixture de login (`usuariosFixture`) se muta directamente en el handler de `/desactivar`. En tests, usar `server.use(...)` para sobrescribir el handler y aislar el estado. | Mismo patrón ya usado en tests de Empresas. |

**Preguntas abiertas**: Ninguna. Todas las decisiones críticas están resueltas.

---

## 8. Próximos pasos

Pasar a fase **Propose** (`/sdd-propose usuarios-management`).

La propuesta debe cubrir:
- Alcance del Change (qué entra, qué no entra).
- Lista de primitivos shadcn a instalar.
- Plan de entregables defensibles (qué puede mostrar el alumno al revisor).
- Confirmación de que este Change no bloquea ni modifica Changes 4–8.
