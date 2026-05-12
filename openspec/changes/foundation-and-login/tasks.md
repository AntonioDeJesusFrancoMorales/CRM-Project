# Tasks: Foundation & Login

## Phase 1: Bootstrap

- [x] 1.1 Bootstrap manual (no `pnpm create vite` por archivos existentes): `package.json` con React 18 + Vite 5 + TS 5 + todas las devDeps de Lote A; `pnpm install`.
- [x] 1.2 `tsconfig.json`: `paths` con alias `@/*` → `./src/*`; `strict: true`; `noUncheckedIndexedAccess: true`. Y `tsconfig.node.json`.
- [x] 1.3 `vite.config.ts`: plugin React + alias `@/*`. `index.html`, `src/main.tsx`, `src/App.tsx`, `src/vite-env.d.ts`.
- [ ] 1.4 `.env.development` con `VITE_ENABLE_MSW=true`; `.env.example` con placeholders documentados. (BLOQUEADA por hook de seguridad — usuario debe crear ambos archivos manualmente; contenido entregado en chat.)

## Phase 2: Tooling

- [x] 2.1 Tailwind v3 + PostCSS instalados via `package.json`. Configs `tailwind.config.ts` + `postcss.config.js` escritas. (BLOQUEA: 3.1)
- [x] 2.2 `tailwind.config.ts` con `content` + `darkMode:'class'`; `src/styles/globals.css` con `@tailwind` directives; importado en `main.tsx`.
- [x] 2.3 ESLint + Prettier instalados; `eslint.config.js` flat config con TS + react-hooks + react-refresh + prettier; `.prettierrc`; `.prettierignore`.
- [x] 2.4 Vitest + RTL + jsdom instalados; `vitest.config.ts` con `environment:'jsdom'`, `globals:true`, `setupFiles:['./src/test/setupTests.ts']`, coverage v8.
- [x] 2.5 `src/test/setupTests.ts`: import `@testing-library/jest-dom/vitest`; `afterEach(cleanup)`; comentario TODO marcando MSW server para Phase 4.
- [x] 2.6 `package.json` scripts: `dev`, `build`, `preview`, `lint`, `format`, `format:check`, `test` (watch), `test:run`, `test:ui`, `type-check`.

## Phase 3: shadcn/ui

- [x] 3.1 shadcn init manual (CLI falló por flag `--base-color`): `components.json` + `tailwind.config.ts` con tema completo + `globals.css` con CSS vars (light + dark). Deps: class-variance-authority, clsx, tailwind-merge, tailwindcss-animate, lucide-react@^0.469.
- [x] 3.2 `pnpm dlx shadcn@latest add button input label form card sonner avatar dropdown-menu separator --yes --overwrite` → 9 componentes en `src/components/ui/`. Trajo automáticamente RHF, @hookform/resolvers, zod, sonner, next-themes, 5 paquetes Radix.
- [x] 3.3 `src/lib/utils.ts` con `cn()` (clsx + twMerge). NOTA: shadcn espera `lib/utils.ts`, no `lib/cn.ts` — alineé con su convención.

## Phase 4: MSW

- [x] 4.1 `pnpm add -D msw@^2`; `pnpm exec msw init public/ --save` → `public/mockServiceWorker.js` creado. msw agregado a `pnpm.onlyBuiltDependencies`.
- [x] 4.2 `src/mocks/utils/{withDelay,fake-jwt,error,crud}.ts`: helper de delay 200–400ms; `fakeJwt(user)` con base64url + `{sub,iat,exp:+8h,nombre,rol_sistema}`; `decodeFakeJwt` para validación; helper `errors.{unauthorized,forbidden,notFound,validation,server}`; factory `makeCrudHandlers<T>` que reduce boilerplate.
- [x] 4.3 `src/mocks/fixtures/usuarios.ts`: 2 mocks (admin@crm.test/Admin123! rol admin; vendedor@crm.test/Vendedor123! rol usuario). Helpers `findUsuarioByCreds`, `findUsuarioById`, `toUsuarioDto` (excluye password).
- [x] 4.4 `src/mocks/fixtures/{empresas,prospectos,clientes,tratos,tareas,tableros}.ts`: 2–3 items por dominio con UUIDs deterministas y timestamps coherentes. Tableros incluye fixtures de columnas, fichas, etiquetas y comentarios.
- [x] 4.5 `src/mocks/handlers/auth.ts`: handlers funcionales POST /auth/login (200/401/422), POST /auth/logout (200), GET /auth/me (200/401 con validación de token + expiración), PATCH /auth/me/password (501 stub).
- [x] 4.6 `src/mocks/handlers/{empresas,usuarios,prospectos,clientes,tratos,tareas,tableros,etiquetas-comentarios}.ts`: stubs CRUD usando `makeCrudHandlers` + endpoints especiales por dominio (filtros, /convertir, /ganar, /perder, /completar, /reordenar, /mover, sub-recursos /:id/{prospectos,clientes,tratos,tareas,etiquetas,comentarios}).
- [x] 4.7 `src/mocks/handlers/index.ts` combina los 9 arrays; `src/mocks/browser.ts` con `setupWorker(...handlers)`.
- [x] 4.8 `src/main.tsx` con `enableMocks()` async condicional a `VITE_ENABLE_MSW==='true'` antes del render. Importa worker dinámicamente para que no bloatee el bundle prod.

## Phase 5: API + Auth

- [x] 5.1 `src/api/types.ts`: 12 interfaces (Usuario, Empresa, Prospecto, Cliente, Trato, Tarea, Tablero, Columna, Ficha, Etiqueta, Comentario, ApiError, LoginResponse) + 8 unions (RolSistema, ComoNosConocio, EstadoPosibleCliente, TipoContrato, EstadoTrato, TipoTarea, EstadoTarea, TipoFicha). *Adelantado en Lote B porque fixtures lo necesitaban.*
- [x] 5.2 `src/api/http-error.ts`: clase `HttpError` con {status, code, message, details?} + helper `isHttpError`.
- [x] 5.3 `src/api/client.ts`: apiClient con get/post/patch/delete tipados. Inyecta Bearer desde authStore. Lanza HttpError. En 401 → logout + toast (solo si había sesión activa). Base URL desde VITE_API_BASE_URL.
- [x] 5.4 `src/store/authStore.ts`: Zustand + persist en localStorage `crm-auth`. {token, usuario, setSession, logout}. `partialize` para excluir funciones del JSON serializado.
- [x] 5.5 `src/store/uiStore.ts`: Zustand sin persist. {sidebarOpen, toggleSidebar, setSidebarOpen}.
- [x] 5.6 `src/features/auth/schemas/login.schema.ts`: Zod schema con mensajes ES neutro. Type `LoginInput` inferido.
- [x] 5.7 `src/features/auth/hooks/{useLogin,useLogout,useMe}.ts`: useLogin (mutation → setSession + cachea ['auth','me']); useLogout (mutation best-effort → logout + queryClient.clear); useMe (query ['auth','me'] gated por token, staleTime 5min).
- [x] EXTRA: `src/lib/query-client.ts`: instancia QueryClient con staleTime 30s, retry inteligente (no retry en 401/404/422), refetchOnWindowFocus off.

## Phase 6: Routing + Layout

- [x] 6.1 `ProtectedRoute.tsx`: usa `useLocation` y `Navigate` de react-router 7; redirige a `/login` con `state.from` si no hay token; renderiza `<Outlet/>` si autenticado.
- [x] 6.2 `RoleGuard.tsx`: prop `role`; si `usuario.rol_sistema !== role` → `<Navigate to='/empresas' replace/>` + toast disparado vía useEffect.
- [x] 6.3 `Sidebar.tsx`: 6 NavItems (Empresas habilitado, resto disabled con badge "Próximamente"). Usuarios oculto si !admin. Iconos lucide (Building2, UserSearch, Users, Handshake, KanbanSquare, ShieldCheck). Footer con versión.
- [x] 6.4 `Topbar.tsx`: Avatar con iniciales del nombre + DropdownMenu (label con nombre+correo, separator, "Cerrar sesión" con icono LogOut llamando `useLogout`).
- [x] 6.5 `AppShell.tsx`: flex Sidebar + (Topbar + main con `<Outlet/>` scrollable).
- [x] 6.6 `routes/placeholders.tsx`: 6 placeholders (Empresas/Usuarios/Prospectos/Clientes/Tratos/Tableros) con componente compartido + badge "Change N · Próximamente".
- [x] 6.7 `routes/router.tsx`: `createBrowserRouter` con `/login` → LoginPage; rama `ProtectedRoute → AppShell` con index → Navigate `/empresas`, todas las rutas placeholder, `RoleGuard(admin)` envolviendo `/usuarios`. Catch-all `*` redirige a `/`.
- [x] 6.8 `App.tsx` reescrito: `QueryClientProvider` + `RouterProvider` + `<Toaster richColors position="top-right"/>`.

## Phase 7: LoginPage

- [x] 7.1 `LoginForm.tsx`: shadcn Form + RHF + zodResolver. Placeholder condicional `DEV && VITE_ENABLE_MSW`. Mapeo de 422 a `setError` por campo. Botón con loader. Hint footer mostrando credenciales mock (solo en dev+MSW). Redirect post-éxito a `state.from || /empresas`.
- [x] 7.2 `LoginPage.tsx`: Card max-w-sm centrada con título "Iniciar sesión". useEffect redirige a `/empresas` si ya hay token.
- [x] 7.3 Wiring en `router.tsx` (cubierto en 6.7).

## Phase 8: Tests + Verificación

- [x] 8.1 `useLogin.test.tsx`: 3 tests (persiste sesión 200, NO persiste en 401, reporta detalles en 422 con `server.use` override). Helper `setupTestWrapper` con QueryClient aislado.
- [x] 8.2 `Login.test.tsx`: 4 tests (renderiza campos, validación client-side con `fireEvent.submit`, persiste sesión exitosa, mapea 422 a setError inline).
- [x] 8.3 `ProtectedRoute.test.tsx`: 2 tests (redirect a /login sin token, renderiza Outlet con token).
- [x] 8.4 Smoke manual ejecutado por el usuario: login + reload + logout + 401 (encontró bug de toast 401 silencioso → arreglado en useLogin.onError).
- [x] 8.5 Verificación final: lint (0 errors, 2 warnings benignas de shadcn), type-check ✅, test:run 9/9 ✅, build ✅ (532kb / 168kb gz).
