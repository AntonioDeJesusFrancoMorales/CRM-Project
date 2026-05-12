# Exploración: foundation-and-login

**Change**: foundation-and-login
**Fase**: sdd-explore
**Fecha**: 2026-05-10 (America/Mexico_City)
**Persistencia**: hybrid

---

## 1. Resumen del problema

El proyecto está vacío. Necesitamos sentar **toda la base técnica** del frontend para que los Changes siguientes puedan construir features encima sin tocar la infraestructura. El primer entregable interactivo es la **pantalla de Login funcional** contra mocks (el backend no existe todavía).

El Change cumple cuatro objetivos en orden:

1. **Bootstrap** del proyecto Vite + React + TS con todas las dependencias.
2. **Capa de mocks MSW** con stubs para TODOS los endpoints del contrato (no solo los de auth) para desbloquear Changes futuros.
3. **Auth flow completo** (login/logout/me) + ProtectedRoute + interceptor 401.
4. **Layout shell** (sidebar + topbar) y **pantalla de Login** funcionales.

---

## 2. Estado actual

```
CRM-Project/
├── .atl/skill-registry.md          (escrito por sdd-init)
├── .gitignore                      (escrito por sdd-init)
└── openspec/
    ├── config.yaml                 (escrito por sdd-init)
    ├── specs/.gitkeep
    └── changes/
        ├── archive/.gitkeep
        └── foundation-and-login/
            └── exploration.md      (este archivo)
```

No hay `package.json`, `src/`, `node_modules`, ni configuración de build. Es bootstrap desde cero.

**Restricciones externas:**
- Contrato API en `Desktop/contratos_api_crm (1).pdf` (10 secciones, ~50 endpoints)
- Modelo de datos en `Desktop/diagrama_crm (6).html` (18 entidades)
- Backend NO existe — desarrollado por otro equipo en paralelo

---

## 3. Áreas afectadas (a crear)

Todas son nuevas. Lista canónica del scope del Change:

### Configuración raíz
- `package.json`, `package-lock.json` (o `pnpm-lock.yaml`)
- `tsconfig.json`, `tsconfig.node.json`
- `vite.config.ts`
- `tailwind.config.ts`, `postcss.config.js`
- `eslint.config.js`, `.prettierrc`, `.prettierignore`
- `index.html`
- `components.json` (config de shadcn/ui)
- `.env.development`, `.env.example`
- `vitest.config.ts` (o sección en `vite.config.ts`)

### Estructura `src/`
- `src/main.tsx`, `src/App.tsx`
- `src/api/` — cliente HTTP, interceptores, tipos del contrato
- `src/features/auth/` — Login page, hooks (useLogin, useLogout, useMe), schemas Zod
- `src/components/ui/` — primitivos shadcn (Button, Input, Form, Label, Card, Toast/Sonner)
- `src/components/layout/` — Sidebar, Topbar, AppShell, ProtectedRoute, RoleGuard
- `src/store/` — Zustand stores (authStore, uiStore)
- `src/routes/` — definición de rutas (router.tsx)
- `src/lib/` — utilidades (cn, formatters, errores)
- `src/mocks/` — MSW handlers + fixtures en memoria
- `src/test/` — setup de Vitest (setupTests.ts)
- `src/styles/globals.css`

### Tests del Change
- `src/features/auth/__tests__/Login.test.tsx`
- `src/features/auth/__tests__/useLogin.test.ts`
- `src/components/layout/__tests__/ProtectedRoute.test.tsx`

---

## 4. Decisiones técnicas — opciones y recomendación

### 4.1 Package manager y bootstrap

| Opción | Pros | Contras | Esfuerzo |
|--------|------|---------|----------|
| **npm + `npm create vite@latest`** | Estándar, viene con Node, sin instalación extra. Compatible 100% con todas las herramientas del ecosistema. | Lento instalando (~30s en proyectos medianos). Lock file grande. | Bajo |
| **pnpm + `pnpm create vite`** | Más rápido (3-5x), menor disco (hard links), strict por default detecta peer deps mal. | Requiere instalar pnpm. Algunos paquetes con peer deps mal configurados se quejan. | Bajo |
| **bun + `bun create vite`** | Ultra rápido, runtime nativo. | Aún inmaduro en Windows (tu plataforma). Algunos paquetes (MSW) tienen issues con bun. Riesgo en residencia. | Medio |

**Recomendación**: **pnpm**. Compromiso entre velocidad y estabilidad. Sin riesgos de compatibilidad con MSW/Vitest. Si nunca usaste pnpm, los comandos son casi idénticos a npm (`pnpm install`, `pnpm add`, `pnpm run dev`).

> Pregunta abierta al usuario: ¿estás cómodo con pnpm o prefieres npm? Si dudas, vamos npm.

---

### 4.2 Estructura de carpetas (features-first)

**Opción A — Por tipo (anti-pattern):**
```
src/
├── components/
├── hooks/
├── pages/
├── services/
└── utils/
```
Pros: simple al inicio. Contras: escala mal, mezcla dominios, dificulta refactors.

**Opción B — Features-first (Recomendado):**
```
src/
├── api/                    # cliente HTTP + tipos generados del contrato
│   ├── client.ts
│   ├── http-error.ts
│   └── types.ts
├── features/               # un dominio = una carpeta
│   ├── auth/
│   │   ├── components/
│   │   │   └── LoginForm.tsx
│   │   ├── hooks/
│   │   │   ├── useLogin.ts
│   │   │   ├── useLogout.ts
│   │   │   └── useMe.ts
│   │   ├── schemas/
│   │   │   └── login.schema.ts
│   │   └── pages/
│   │       └── LoginPage.tsx
│   ├── empresas/           (Change 2)
│   ├── prospectos/         (Change 4)
│   ├── clientes/           (Change 5)
│   ├── tratos/             (Change 6)
│   ├── tareas/             (Change 6)
│   ├── kanban/             (Change 7)
│   └── usuarios/           (Change 3)
├── components/
│   ├── ui/                 # shadcn primitives (Button, Input, Form, …)
│   └── layout/             # Sidebar, Topbar, AppShell, ProtectedRoute
├── store/                  # Zustand (auth, ui)
├── routes/
│   └── router.tsx
├── lib/                    # utilidades cross-feature
│   ├── cn.ts
│   ├── format.ts
│   └── api-error.ts
├── mocks/                  # MSW
│   ├── browser.ts
│   ├── handlers/
│   │   ├── index.ts
│   │   ├── auth.ts
│   │   ├── empresas.ts
│   │   ├── usuarios.ts
│   │   ├── prospectos.ts
│   │   ├── clientes.ts
│   │   ├── tratos.ts
│   │   ├── tareas.ts
│   │   ├── tableros.ts
│   │   └── etiquetas-comentarios.ts
│   └── fixtures/
│       ├── empresas.ts
│       ├── usuarios.ts
│       └── …
├── styles/globals.css
├── test/setupTests.ts
├── App.tsx
└── main.tsx
```

**Recomendación**: Opción B (features-first). Es el patrón estándar en CRMs medianos y grandes. Cada Change futuro toca una sola carpeta `src/features/<entidad>/` casi sin colisiones. Container-presentational opcional dentro de cada feature.

---

### 4.3 MSW — organización de handlers y fixtures

**Decisión 1: granularidad de handlers**

| Opción | Pros | Contras |
|--------|------|---------|
| Un solo archivo | Simple, todo en un lugar | Imposible de mantener con 50 endpoints |
| **Un archivo por dominio (Recomendado)** | Espejo del contrato API, fácil de extender por Change | Pequeña navegación entre archivos |
| Un archivo por endpoint | Demasiado fragmentado | Mucho boilerplate |

**Decisión 2: fixtures (datos mock)**

| Opción | Pros | Contras |
|--------|------|---------|
| **In-memory mutable (Recomendado)** | Permite que POST/PATCH/DELETE persistan durante la sesión, simulando backend real | Se pierde al recargar (aceptable para mocks) |
| Fixtures estáticos JSON | Inmutable, predecible | Mutaciones no se ven reflejadas, frustrante al desarrollar |
| LocalStorage | Persiste entre recargas | Complica resets, riesgo de datos corruptos durante desarrollo |

In-memory mutable: cada handler-file exporta un `let empresas: Empresa[] = [...]` y los handlers leen/mutan ese array. Para resetear datos, recargas la app.

**Decisión 3: switch on/off**

```ts
// main.tsx
if (import.meta.env.VITE_ENABLE_MSW === "true") {
  const { worker } = await import("./mocks/browser");
  await worker.start({ onUnhandledRequest: "warn" });
}
```

Variable en `.env.development`: `VITE_ENABLE_MSW=true`. Cuando exista el backend real, se baja a `false` y el frontend pega al backend sin tocar código.

**Decisión 4: delays y errores**

Helper `withDelay(ms)` y `withRandomError(rate)` para simular latencia y errores aleatorios opcionales (útil para probar estados de loading y error). Default: delay 200-400ms, sin errores aleatorios.

**Recomendación combinada**: handlers por dominio + fixtures in-memory mutables + switch por env var + helper de delay (sin errores aleatorios por default).

> Stub de TODOS los dominios en Change 1. Los handlers de auth son los únicos con lógica completa; los demás retornan datos fixtures en GET y aceptan cuerpos en POST/PATCH/DELETE manipulando los arrays in-memory.

---

### 4.4 Auth flow

**Decisión 1: storage del token JWT**

| Opción | Pros | Contras |
|--------|------|---------|
| `localStorage` | Persiste entre tabs y reloads | Vulnerable a XSS (cualquier script lee el token) |
| `sessionStorage` | Se borra al cerrar el tab | Igual de vulnerable a XSS, peor UX |
| **Zustand con `persist` middleware sobre localStorage (Recomendado)** | Reactivo en toda la app, persiste, fácil de limpiar | Mismo riesgo XSS que localStorage |
| HttpOnly cookie | Inmune a XSS | El backend tiene que setearla — el contrato dice "Bearer en header", así que NO aplica |

Como el contrato exige `Authorization: Bearer {token}`, no hay opción de HttpOnly cookie. Mitigamos XSS con CSP, sanitización de input y nunca renderizar HTML crudo.

**Decisión 2: cliente HTTP**

| Opción | Pros | Contras |
|--------|------|---------|
| **`fetch` nativo + wrapper delgado (Recomendado)** | Sin dependencias extra, moderno, suficiente | Requiere escribir un wrapper de ~50 líneas |
| Axios | Interceptores ya hechos, ergonomía | +13kb, dependencia adicional |
| ky | API moderna sobre fetch | Otra dependencia |

El wrapper delgado vive en `src/api/client.ts` y maneja:
- Inyección automática de `Authorization` desde `authStore`
- Parseo de respuesta JSON
- Lanzamiento de `HttpError` con shape `{ status, error, message, details? }` (matching del contrato)
- Hook de 401 → ejecuta `authStore.logout()` y redirige a `/login`

**Decisión 3: manejo de 401**

El contrato NO menciona refresh tokens. Solo `POST /auth/login` y `POST /auth/logout`. Por lo tanto:
- En 401 → limpiar token, sacar al usuario al `/login`, mostrar toast "Tu sesión expiró".
- Si el backend agrega refresh tokens más adelante, se añade al wrapper sin tocar features.

**Decisión 4: ProtectedRoute pattern**

```
<Route element={<ProtectedRoute />}>      // verifica authStore.token + GET /auth/me
  <Route element={<AppShell />}>          // sidebar + topbar
    <Route path="empresas" … />
    <Route element={<RoleGuard role="admin" />}>
      <Route path="usuarios" … />        // solo admin (anticipa Change 3)
    </Route>
  </Route>
</Route>
<Route path="/login" element={<LoginPage />} />
```

**Recomendación combinada**: Zustand + persist + localStorage para el token. fetch + wrapper. 401 → logout + redirect. ProtectedRoute como layout route.

> Mejora futura: pasar a HttpOnly cookies cuando el backend lo soporte. No bloqueante para residencia.

---

### 4.5 Routing — React Router v7

**Decisión: data routes vs JSX**

React Router v7 soporta dos modos. **Data routes** (createBrowserRouter) es el recomendado oficialmente: permite loaders, actions, error boundaries por ruta. Pero loaders chocan con TanStack Query (los dos hacen lo mismo).

| Opción | Pros | Contras |
|--------|------|---------|
| Data routes con loaders | Ergonomía de RR v7 completa | Solapa con TanStack Query, dos fuentes de verdad |
| **Data routes SIN loaders, fetching en componentes con TanStack Query (Recomendado)** | Una sola fuente de verdad para data fetching | Renunciamos a loaders pero ganamos cache de TanStack |
| JSX routes (legacy) | Más simple | Sin error boundaries por ruta |

**Recomendación**: Data routes (createBrowserRouter) sin loaders. TanStack Query es nuestro único data layer.

**Estructura de rutas:**
```
/                          → redirect a /empresas si auth, sino /login
/login                     → LoginPage
/                          → ProtectedRoute → AppShell
  /empresas                → EmpresasListPage (Change 2)
  /empresas/:id            → EmpresaDetailPage (Change 2)
  /prospectos              → … (Change 4)
  /clientes                → … (Change 5)
  /tratos                  → … (Change 6)
  /tableros                → … (Change 7)
  /usuarios                → RoleGuard(admin) → … (Change 3)
  /perfil                  → cambio de contraseña (PATCH /auth/me/password)
```

En Change 1 todas las rutas internas son placeholders ("Próximamente — Change N"). Solo Login está implementado de verdad.

---

### 4.6 shadcn/ui — setup y componentes iniciales

**Setup:**
```bash
pnpm dlx shadcn@latest init
```

Esto crea `components.json` y `src/components/ui/`. Configuración recomendada:
- Style: `new-york` (más profesional que `default`)
- Base color: `slate` (neutro)
- CSS variables: sí (permite dark mode futuro)
- React Server Components: no (somos SPA pura)

**Componentes a traer en Change 1:**

| Componente | Para qué |
|------------|----------|
| `Button` | Acciones generales |
| `Input` | Login form |
| `Label` | Login form |
| `Form` (RHF wrapper) | Login form |
| `Card` | Contenedor del LoginPage |
| `Sonner` | Toasts (errores 401, sesión expirada, errores de validación) |
| `Avatar` | Topbar |
| `DropdownMenu` | Menú de usuario en topbar (Logout, Cambiar contraseña) |
| `Separator` | Sidebar y topbar |

Los demás (Table, Dialog, Select, Combobox, Calendar, etc.) se agregan a medida que se necesiten en Changes posteriores. **Filosofía shadcn**: no traes lo que no usas.

**Tema:**

| Opción | Pros | Contras |
|--------|------|---------|
| **Default slate (Recomendado)** | Profesional out-of-the-box, listo para defender | Es "el look de shadcn" reconocible |
| Custom corporate | Identidad propia | Más trabajo, sin briefing del cliente real |

Default slate ahora; si hay tiempo al final, custom branding.

---

### 4.7 Forms — RHF + Zod

Patrón establecido para todos los forms del proyecto:

```
src/features/<feature>/schemas/<entity>.schema.ts   → Zod schemas + types inferidos
src/features/<feature>/components/<Entity>Form.tsx  → componente de form con RHF + shadcn Form
src/features/<feature>/hooks/use<Entity>Mutation.ts → useMutation de TanStack
```

Schema de login (preview, no código):
- `email`: string, .email(), required
- `password`: string, .min(8), required
- Mensajes en español neutro: "Correo inválido", "La contraseña debe tener al menos 8 caracteres"

Errores del backend (422 con `details: [{ field, message }]`) se mapean al form con `setError(field, { message })`.

---

### 4.8 Testing

**Setup Vitest:**
- Entorno: `jsdom` (para componentes con DOM)
- Setup file: `src/test/setupTests.ts` — importa `@testing-library/jest-dom`, configura cleanup, **levanta MSW server**
- Comando: `pnpm test` (watch) y `pnpm test:run` (single run)

**MSW en tests:**

| Opción | Pros | Contras |
|--------|------|---------|
| Reusar handlers del browser | DRY | Los tests dependen de fixtures globales |
| **Handlers específicos por test (Recomendado)** | Cada test controla su escenario (200, 401, 422, 500) | Algo más de boilerplate |
| Híbrido: handlers default + override por test | Lo mejor de ambos | El más complejo |

**Recomendación**: híbrido. `src/mocks/handlers/index.ts` exporta los defaults. Los tests críticos usan `server.use(...)` para sobrescribir.

**Tests del Change 1 (mínimo):**
1. `Login.test.tsx` — render del form, validaciones, login exitoso, login con 401, login con 422
2. `ProtectedRoute.test.tsx` — redirige a /login si no hay token, deja pasar si sí
3. `useLogin.test.ts` — hook persiste token en authStore tras éxito, limpia en error

**Strict TDD**: todavía deshabilitado. En el `sdd-apply` del Change 1, después de instalar Vitest, se escribe un test "smoke" que falla, luego se implementa el componente para que pase. Después de Change 1, se flippea `strict_tdd: true` en `openspec/config.yaml`.

---

### 4.9 Layout shell

**Sidebar (izquierda, 240px):**
- Logo + nombre del CRM (placeholder)
- Lista de items: Empresas, Prospectos, Clientes, Tratos, Tableros, Usuarios (oculto si no admin)
- Item "Empresas" → activo, navegable
- Items pendientes de Changes futuros → con badge "Próximamente" y `pointer-events: none`
- Footer: versión + link "Cambiar contraseña"

**Topbar (arriba, 56px):**
- A la izquierda: breadcrumb o título de página (vacío en Change 1)
- A la derecha: Avatar con DropdownMenu → "Mi perfil", "Cerrar sesión"
- Ancho: 100% menos sidebar

**AppShell:**
```
┌─────────────┬───────────────────────────────┐
│             │ Topbar                        │
│  Sidebar    ├───────────────────────────────┤
│             │                               │
│             │ <Outlet />                    │
│             │                               │
└─────────────┴───────────────────────────────┘
```

**Responsive**: Change 1 desktop-first (>= 1024px). Mobile/tablet en backlog. Para residencia es razonable.

---

### 4.10 Pantalla de Login

**Composición:**
- Card centrada (max-w 400px), shadow
- Título: "Iniciar sesión"
- Form con Email + Password + botón "Entrar"
- Estados visuales: loading (botón disabled + spinner), error inline + toast
- Footer pequeño: "Sistema CRM — Residencia" (placeholder)

**Flujo:**
1. Usuario ingresa email + password
2. Submit → `useLogin().mutate({ email, password })`
3. MSW responde según el caso:
   - 200 → guarda token en authStore, redirige a `/empresas`
   - 401 → toast "Credenciales inválidas"
   - 422 → setError por campo
   - 500 → toast genérico "Algo salió mal, intenta de nuevo"
4. Si ya hay token al montar `LoginPage` → redirige a `/empresas`

**Credenciales mock para demo:**
- `admin@crm.test` / `Admin123!` → rol admin
- `vendedor@crm.test` / `Vendedor123!` → rol usuario

Documentadas en `.env.example` y en el mismo LoginPage como placeholder text del input email (solo en dev).

---

## 5. Recomendación final

| Tema | Decisión |
|------|----------|
| Package manager | **pnpm** (con fallback a npm si el usuario prefiere) |
| Bootstrap | `pnpm create vite . --template react-ts` |
| Estructura | features-first (`src/features/<dominio>/...`) |
| MSW | handlers por dominio + fixtures in-memory mutables + switch por env var |
| Token storage | Zustand + persist + localStorage |
| HTTP client | fetch + wrapper delgado en `src/api/client.ts` |
| 401 handling | logout + redirect + toast |
| Routing | React Router v7 data routes SIN loaders |
| Auth guards | ProtectedRoute (auth) + RoleGuard (rol) como layout routes |
| shadcn | style new-york, base slate, CSS vars on |
| Componentes shadcn iniciales | Button, Input, Label, Form, Card, Sonner, Avatar, DropdownMenu, Separator |
| Forms | RHF + Zod, integrados con shadcn `Form` |
| Testing | Vitest + RTL + jsdom, MSW híbrido (defaults + overrides) |
| Layout | Sidebar 240px + Topbar 56px + AppShell desktop-first |
| Login | Card centrada, redirect post-éxito a `/empresas` |

---

## 6. Riesgos identificados

1. **Sin backend real durante todo el desarrollo** — el contrato puede tener errores que solo se detecten cuando el backend exista. Mitigación: mantener tipos del contrato en un solo lugar (`src/api/types.ts`), facilitar el cambio. Acordar con el compañero del backend revisiones del contrato cada cierto tiempo.

2. **Cambios en el contrato API** — si el equipo de backend cambia algo, hay que actualizar tipos + handlers. Mitigación: versionar el contrato (este PDF es v1) y dejar TODO en el código si surge ambigüedad.

3. **MSW + Service Workers en navegadores antiguos** — MSW v2 requiere navegadores modernos. Para residencia es aceptable (defendemos en Chrome/Edge actuales).

4. **Strict TDD desde Change 2** — el equipo solo eres tú, así que la velocidad la marcas tú. Riesgo bajo.

5. **Rol del usuario en `usuarios.rol_sistema`** — el contrato menciona `rol_sistema` (ENUM) pero NO especifica los valores. Por la sección 2 ("Solo accesibles para rol admin") asumimos al menos `admin` y `usuario`. Confirmar con el compañero del backend.

6. **Token JWT — formato y expiración** — el contrato no especifica TTL ni si el backend valida expiración del lado servidor. Asumimos que sí. El frontend solo decodifica para mostrar info del usuario si hace falta (no por seguridad).

7. **Rendimiento de drag-and-drop en Kanban (Change 7)** — fuera del alcance de este Change, pero conviene anticipar que dnd-kit o react-beautiful-dnd se evalúa más adelante.

---

## 7. Preguntas abiertas para el usuario

| # | Pregunta | Default si no responde |
|---|----------|------------------------|
| Q1 | ¿pnpm o npm? | pnpm |
| Q2 | ¿Tema shadcn default (slate) o branding custom? | default slate |
| Q3 | ¿Necesitas dark mode en el MVP o queda para después? | después |
| Q4 | ¿La pantalla de Login debe mostrar las credenciales mock como hint en dev, o solo en `.env.example`? | placeholder solo en dev |
| Q5 | ¿En el sidebar muestro los items pendientes con "Próximamente" o los oculto hasta que se implementen? | mostrar con "Próximamente" — ayuda a comunicar progreso |
| Q6 | ¿Confirmas que `rol_sistema` tiene los valores `admin` y `usuario` (o similar)? Si tu compañero del backend definió otros, dímelos. | asumimos `admin` y `usuario` |
| Q7 | ¿Quieres incluir `PATCH /auth/me/password` (cambio de contraseña) en Change 1, o lo movemos a un Change posterior? | incluirlo si no se atrasa el resto; sino, diferir |

---

## 8. Listo para sdd-propose

**Sí.** Esta exploración cubre las 10 áreas del scope con tradeoffs y recomendaciones. Después de que respondas las preguntas abiertas (Q1–Q7), pasamos a `/sdd-propose` que destila estas decisiones en una propuesta formal con scope, approach y rollback plan.
