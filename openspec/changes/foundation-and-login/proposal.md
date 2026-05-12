# Proposal: Foundation & Login

## Intent

Establecer la base técnica completa del frontend CRM (residencia universitaria) y entregar la primera pantalla interactiva: **Login** funcional contra MSW. Sin esta base, los Changes 2–8 no tienen dónde apoyarse.

## Scope

### In Scope
- Bootstrap del proyecto con Vite + React + TS + pnpm
- Tooling: ESLint, Prettier, Vitest, RTL, jsdom, Tailwind v3, shadcn/ui (new-york, slate)
- MSW v2 con handlers stub para los 9 dominios del contrato API
- Cliente HTTP `fetch` con wrapper, interceptor 401, errores normalizados
- Auth flow: `useLogin`, `useLogout`, `useMe`; `authStore` (Zustand + persist + localStorage)
- Routing: React Router v7 data routes; `ProtectedRoute` + `RoleGuard`
- Layout shell: Sidebar 240px + Topbar 56px + `AppShell`
- LoginPage con RHF+Zod, hints de credenciales mock en dev
- Tests críticos: Login, ProtectedRoute, useLogin

### Out of Scope
- `PATCH /auth/me/password` (diferido a Change posterior)
- Dark mode toggle (CSS vars sí, toggle no)
- Custom branding (default slate)
- Mobile/tablet, i18n, refresh tokens, tests E2E
- Implementación real de features Empresas..Etiquetas (solo placeholders)

## Capabilities

### New Capabilities
- `auth`: login/logout/me, token storage, interceptor 401
- `app-shell`: rutas protegidas, layout, role guards, navegación
- `mock-backend`: MSW handlers por dominio + fixtures in-memory + switch env

### Modified Capabilities
- None (proyecto nuevo)

## Approach

Orden de implementación:

1. **Bootstrap** — `pnpm create vite . --template react-ts`
2. **Tooling** — Tailwind v3, ESLint+Prettier, Vitest+RTL, paths alias
3. **shadcn init** — new-york/slate + 9 componentes iniciales
4. **MSW** — fixtures, handlers stub para 9 dominios, browser worker
5. **API + Auth** — `client.ts`, `authStore`, hooks de auth
6. **Routing + Layout** — router, ProtectedRoute, RoleGuard, AppShell, Sidebar, Topbar
7. **LoginPage** — schema Zod, form RHF+shadcn, redirect post-éxito
8. **Tests** — Login, ProtectedRoute, useLogin

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `package.json`, configs raíz | New | Vite, TS, Tailwind, ESLint, Prettier, Vitest, components.json |
| `src/api/`, `src/lib/` | New | Cliente HTTP + utilidades |
| `src/mocks/` | New | MSW + fixtures + handlers (9 archivos por dominio) |
| `src/store/` | New | Zustand authStore + uiStore |
| `src/components/{ui,layout}/` | New | shadcn primitivos + AppShell/Sidebar/Topbar/guards |
| `src/features/auth/` | New | LoginPage + hooks + schemas |
| `src/routes/` | New | router con ProtectedRoute + placeholders |
| `src/test/` | New | setupTests.ts |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Cambios en contrato API mientras desarrollamos | Med | Tipos centralizados en `src/api/types.ts`; revisar contrato cada Change |
| MSW v2 con browsers viejos | Low | Defender en Chrome/Edge actuales |
| `rol_sistema` con valores distintos a admin/usuario | Low | Type union editable en un solo lugar |
| JWT TTL no especificada en contrato | Low | 401 → logout limpio cubre ambos casos |

## Rollback Plan

Es bootstrap inicial: rollback = `rm -rf` de todo lo creado (src/, package.json, configs raíz, lockfile, node_modules) y dejar el repo en estado actual (solo `.atl/`, `.gitignore`, `openspec/`). Reversible 100% sin pérdida de artefactos SDD.

## Dependencies

- Node.js ≥ 20 LTS, pnpm ≥ 9
- Acceso a registry npm
- Contrato API y diagrama DB en Desktop (referencia)

## Success Criteria

- [ ] `pnpm dev` levanta la app sin errores
- [ ] Visitar `/` redirige a `/login` cuando no hay token
- [ ] Login con credenciales mock guarda token y redirige a `/empresas`
- [ ] Logout borra token y vuelve a `/login`
- [ ] Recargar la página mantiene la sesión (token persistido)
- [ ] 401 desde MSW dispara logout automático
- [ ] `pnpm test` corre y pasa los 3 tests del Change
- [ ] `pnpm build` compila sin errores TS
- [ ] Sidebar muestra Empresas habilitado y resto con "Próximamente"
