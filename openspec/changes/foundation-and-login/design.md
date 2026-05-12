# Design: Foundation & Login

## Technical Approach

SPA con capas claras: **View → Hook (TanStack/Zustand) → HTTP client → MSW → fixtures in-memory**. Cada feature vive en `src/features/<dominio>/`; `src/api/` y `src/mocks/` son cross-feature.

```
LoginPage ─→ useLogin() ─→ apiClient.post('/auth/login')
                              │
                              ▼
                       MSW worker  ─→  fixtures/usuarios.ts
                              │
                              ▼
                     authStore.setSession()  →  localStorage
```

## Architecture Decisions

| # | Decisión | Alternativa | Por qué |
|---|----------|-------------|---------|
| ADR-001 | `fetch` + wrapper delgado | axios, ky | Sin dependencia extra; suficiente para nuestro contrato; ~50 LOC controlables |
| ADR-002 | Token en `localStorage` via Zustand+persist | HttpOnly cookie | El contrato exige `Authorization: Bearer` — cookie no aplica. XSS mitigado con CSP + sin `dangerouslySetInnerHTML` |
| ADR-003 | Features-first (`src/features/<dom>/`) | Por tipo (`pages/`, `hooks/`) | Cada Change toca una sola carpeta; aísla dominios; estándar en CRMs medianos |
| ADR-004 | Un handler MSW por dominio | Un solo archivo | Espejo del contrato; cada Change agrega lógica sin tocar otros |
| ADR-005 | React Router v7 data routes SIN loaders | Loaders + Query | Doble fuente de verdad; TanStack Query es nuestro único data layer |
| ADR-006 | Fixtures in-memory mutables | JSON estáticos | Mutaciones POST/PATCH/DELETE se ven reflejadas en GETs durante la sesión — sin esto, frustrante para desarrollar |

## Data Flow

### Login exitoso
```
User ─submit─→ LoginForm ─→ useLogin.mutate()
                              │
                       apiClient.post('/auth/login', creds)
                              │
                       MSW handler valida creds
                              │
                  ┌──── 200 {token, usuario} ────┐
                  ▼                                 │
         authStore.setSession(token, user)         │
                  │                                 │
         queryClient.setQueryData(['auth','me'], user)
                  │
         navigate(state.from ?? '/empresas')
```

### 401 → logout automático
```
Componente ──useQuery── apiClient.get('/empresas')
                            │
                       MSW handler → 401
                            │
                  HttpError throw  →  client.onUnauthorized()
                            │
                  authStore.logout() + queryClient.clear()
                            │
                  navigate('/login')  + toast "Sesión expiró"
```

### Recarga con sesión persistida
```
App mount ─→ Zustand persist rehidrata authStore desde localStorage
              │
        ProtectedRoute ve token → renderiza AppShell
              │
        useMe() (TanStack Query) → GET /auth/me con Bearer
              │
        200 → cache fresh; 401 → flujo "logout automático"
```

## File Changes

```
src/
├── main.tsx, App.tsx, styles/globals.css
├── api/
│   ├── client.ts            (HTTP wrapper)
│   ├── http-error.ts        (clase HttpError)
│   └── types.ts             (tipos del contrato API)
├── features/auth/
│   ├── pages/LoginPage.tsx
│   ├── components/LoginForm.tsx
│   ├── hooks/{useLogin,useLogout,useMe}.ts
│   └── schemas/login.schema.ts
├── components/
│   ├── ui/                  (shadcn: Button, Input, Label, Form, Card, Sonner, Avatar, DropdownMenu, Separator)
│   └── layout/{AppShell,Sidebar,Topbar,ProtectedRoute,RoleGuard}.tsx
├── store/{authStore,uiStore}.ts
├── routes/router.tsx
├── lib/{cn,api-error}.ts
├── mocks/
│   ├── browser.ts
│   ├── handlers/{index,auth,empresas,usuarios,prospectos,clientes,tratos,tareas,tableros,etiquetas-comentarios}.ts
│   └── fixtures/{empresas,usuarios,prospectos,clientes,tratos,tareas,tableros}.ts
└── test/setupTests.ts
```

Configs raíz: `package.json`, `tsconfig.json`, `vite.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `eslint.config.js`, `.prettierrc`, `vitest.config.ts`, `components.json`, `index.html`, `.env.{development,example}`.

## Interfaces / Contracts

**HTTP client** (`src/api/client.ts`):
```ts
type ApiClient = {
  get<T>(path: string): Promise<T>;
  post<T>(path: string, body?: unknown): Promise<T>;
  patch<T>(path: string, body?: unknown): Promise<T>;
  delete<T>(path: string): Promise<T>;
};
// Inyecta Authorization desde authStore. Lanza HttpError en !ok.
// onUnauthorized hook → authStore.logout() + redirect.
```

**TanStack Query keys**:
```
['auth','me']
['empresas'] / ['empresas',id] / ['empresas',id,'prospectos']
['usuarios'] / ['usuarios',id]
['prospectos',{filters}] / ['prospectos',id]
... (mismo patrón por dominio)
```
Invalidación: tras `mutate` exitoso, `queryClient.invalidateQueries({queryKey:['<dominio>']})`.

**Zustand stores**:
```ts
authStore: { token: string|null; usuario: Usuario|null; setSession; logout }  // persist
uiStore:   { sidebarOpen: boolean; toggleSidebar }                              // no persist
```

**MSW handler shape** (auth funcional):
```ts
http.post('/api/v1/auth/login', async ({request}) => {
  const {email, password} = await request.json();
  const user = mockUsers.find(u => u.email===email && u.password===password);
  return user ? json({token:fakeJwt(user), usuario:toDto(user)})
              : json({status:401,error:'UNAUTHORIZED',message:'...'},{status:401});
})
```

**Stub shape** (dominios pendientes):
```ts
http.get('/api/v1/empresas', () => json(empresasFixture))
http.post('/api/v1/empresas', async ({request}) => {
  const body = await request.json();
  const created = {id: crypto.randomUUID(), ...body, creado_en: now()};
  empresasFixture.push(created);
  return json(created, {status:201});
})
```

## Routing tree

```
/login                              → LoginPage
/                                   → ProtectedRoute
  /                                 → AppShell
    /                               → redirect → /empresas
    /empresas                       → Empresas placeholder (Change 2)
    /prospectos, /clientes, /tratos, /tableros → placeholders
    RoleGuard(admin):
      /usuarios                     → placeholder (Change 3)
```

## Testing Strategy

| Layer | Qué | Cómo |
|-------|-----|------|
| Unit | `useLogin`, `authStore` | Vitest + RTL `renderHook` |
| Integration | LoginPage flow, ProtectedRoute | RTL + MSW server con override por test |
| E2E | — | fuera de scope (post-MVP) |

## Migration / Rollout

No migration required (proyecto nuevo, bootstrap inicial).

## Open Questions

- [ ] ¿`fakeJwt` codifica al menos `{sub, exp}` para parecer real? Recomiendo sí (ayuda a debug).
