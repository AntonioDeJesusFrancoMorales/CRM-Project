# Pipely — CRM Frontend

CRM en React + TypeScript desarrollado como proyecto de residencia profesional universitaria. Frontend desacoplado del backend mediante un contrato de API simulado con MSW (Mock Service Worker), lo que permite desarrollar la SPA en paralelo a la implementación del backend en Spring.

## Stack técnico

- **Framework**: React 18 + Vite + TypeScript estricto
- **Estado servidor**: TanStack Query v5
- **Estado cliente**: Zustand (con `persist` para sesión)
- **Routing**: React Router v7
- **UI**: TailwindCSS + shadcn/ui (Radix primitives)
- **Formularios**: React Hook Form + Zod (validación tipada)
- **Mock backend**: MSW v2 con fixtures y handlers por dominio
- **Testing**: Vitest + Testing Library + jsdom
- **Calidad**: ESLint + Prettier + type-check

## Estructura del proyecto

```
src/
├── api/                    # Cliente HTTP, contrato de tipos, errores normalizados
├── components/
│   ├── layout/             # AppShell, ProtectedRoute, RoleGuard, Sidebar
│   └── ui/                 # Primitives shadcn (table, dialog, form, etc.)
├── features/               # Feature-first (screaming architecture)
│   ├── auth/               # Login + persistencia de sesión
│   └── empresas/           # CRUD de empresas + prospectos/clientes vinculados
│       ├── components/     # Componentes presentacionales puros
│       ├── hooks/          # TanStack Query hooks (query keys + mutations)
│       ├── pages/          # Páginas que componen la feature
│       ├── schemas/        # Validadores Zod
│       └── __tests__/      # Tests por hook y por página
├── lib/                    # Helpers compartidos (format, form-utils)
├── mocks/                  # MSW handlers + fixtures
├── routes/                 # Definición del router
├── stores/                 # Stores Zustand
└── test/                   # Setup de Vitest + wrappers de testing
```

## Requisitos

- **Node.js** ≥ 20
- **pnpm** ≥ 9 (`corepack enable` recomendado)

## Puesta en marcha

```bash
pnpm install
cp .env.example .env.development   # solo si no existe — el repo ya lo incluye
pnpm dev                            # abre http://localhost:5173
```

### Credenciales del mock para login

| Email                 | Contraseña | Rol      |
| --------------------- | ---------- | -------- |
| `admin@pipely.test`   | `admin123` | admin    |
| `usuario@pipely.test` | `user123`  | usuario  |

## Modo de backend

El frontend funciona contra el mock (MSW) por defecto, pero puede apuntar al backend Spring real cambiando `.env.development`:

**Modo mock (default — recomendado para desarrollo)**:

```env
VITE_ENABLE_MSW=true
VITE_API_BASE_URL=/api/v1
```

**Modo backend real**:

```env
VITE_ENABLE_MSW=false
VITE_API_BASE_URL=http://localhost:8080/api
```

> El archivo `.env.example` permanece siempre en modo mock como plantilla segura del repositorio.

## Scripts disponibles

| Script              | Propósito                                    |
| ------------------- | -------------------------------------------- |
| `pnpm dev`          | Servidor de desarrollo con HMR               |
| `pnpm build`        | Build de producción                          |
| `pnpm preview`      | Servir el build localmente                   |
| `pnpm test`         | Tests en modo watch                          |
| `pnpm test:run`     | Tests en una corrida (CI)                    |
| `pnpm test:ui`      | UI interactiva de Vitest                     |
| `pnpm type-check`   | `tsc --noEmit` (validación de tipos)         |
| `pnpm lint`         | ESLint en todo el proyecto                   |
| `pnpm format`       | Aplicar Prettier                             |
| `pnpm format:check` | Verificar formato sin modificar archivos     |

## Convenciones de desarrollo

- **Feature-first** con capas internas `schemas → hooks → components → pages` (screaming architecture).
- **Container-presentational**: las páginas orquestan; los componentes son puros.
- **Strict TDD** para hooks críticos y páginas: tests escritos antes de la implementación.
- **Conventional commits** en español para mensajes de commit.
- **Contrato de API** como única fuente de verdad: tipos en `src/api/types.ts`; los handlers de MSW reflejan exactamente las rutas que expondrá el backend.

## Spec-Driven Development

El proyecto utiliza un flujo SDD (Spec-Driven Development) cuyos artefactos viven en `openspec/changes/`. Cada cambio significativo pasa por las fases: exploración → propuesta → especificación → diseño → tasks → implementación → verificación → archivo.

## Estado del proyecto

| Change | Feature                       | Estado     |
| ------ | ----------------------------- | ---------- |
| 1      | Foundation + Login            | ✅ Completo |
| 2      | Empresas CRUD                 | ✅ Completo |
| 3      | Usuarios (solo admin)         | ⏳ Pendiente |
| 4      | Prospectos                    | ⏳ Pendiente |
| 5      | Clientes                      | ⏳ Pendiente |
| 6      | Tratos + Tareas               | ⏳ Pendiente |
| 7      | Tableros Kanban genéricos     | ⏳ Pendiente |
| 8      | Etiquetas + Comentarios       | ⏳ Pendiente |

## Licencia

Proyecto académico — sin licencia pública definida. Contactar al autor para permisos de uso.
