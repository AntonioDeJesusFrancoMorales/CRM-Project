# app-shell Specification

## Purpose

Provee la cáscara visual y de navegación de la app post-login: rutas protegidas que requieren sesión, guardas por rol, layout con Sidebar+Topbar+Outlet, y la organización del routing entre features.

## Requirements

### Requirement: Ruta protegida por autenticación

El sistema MUST envolver todas las rutas internas (excepto `/login`) en un `ProtectedRoute` que verifica la presencia de un token válido en `authStore`. Si no lo hay, MUST redirigir a `/login` preservando la ruta destino en `state.from`.

#### Scenario: Acceso sin sesión

- GIVEN no hay token en `authStore`
- WHEN el usuario navega a `/empresas`
- THEN el sistema redirige a `/login`
- AND guarda `/empresas` en `location.state.from`

#### Scenario: Acceso con sesión

- GIVEN hay un token válido en `authStore`
- WHEN el usuario navega a `/empresas`
- THEN el sistema renderiza `AppShell` con la página de Empresas en el `Outlet`

#### Scenario: Redirect post-login

- GIVEN el usuario fue redirigido a `/login` desde `/tratos`
- WHEN inicia sesión exitosamente
- THEN el sistema redirige a `/tratos` (la ruta original guardada en `state.from`)

### Requirement: Guarda por rol

El sistema MUST proveer un `RoleGuard` que envuelva rutas restringidas a roles específicos. Si el usuario no cumple el rol, MUST redirigir a `/empresas` (ruta por defecto post-login).

#### Scenario: Usuario no admin intenta acceder a /usuarios

- GIVEN el usuario tiene `rol_sistema = 'usuario'`
- WHEN navega a `/usuarios`
- THEN el sistema redirige a `/empresas`
- AND muestra toast "No tienes permisos para esta sección"

#### Scenario: Admin accede a /usuarios

- GIVEN el usuario tiene `rol_sistema = 'admin'`
- WHEN navega a `/usuarios`
- THEN el sistema renderiza la página de Usuarios

### Requirement: Layout con Sidebar y Topbar

El sistema MUST renderizar `AppShell` como layout raíz post-login con un Sidebar fijo de 240px a la izquierda, un Topbar fijo de 56px arriba y un área principal con `<Outlet />` para el contenido de la ruta activa.

#### Scenario: Renderizado del shell

- GIVEN el usuario navega a una ruta protegida cualquiera
- WHEN el layout monta
- THEN se ven simultáneamente Sidebar (izquierda), Topbar (arriba) y contenido (derecha-abajo)

### Requirement: Navegación lateral con estados

El Sidebar MUST mostrar enlaces a todas las features del CRM: Empresas, Prospectos, Clientes, Tratos, Tableros, Usuarios. Los items que aún no están implementados (Changes 2–8) MUST mostrarse con badge "Próximamente" y estar deshabilitados (no navegables). El item de Usuarios MUST estar oculto si `rol_sistema !== 'admin'`.

#### Scenario: Sidebar con items mixtos

- GIVEN el usuario es admin y solo Change 1 está completo
- WHEN ve el Sidebar
- THEN "Empresas" se ve normal pero también deshabilitado (Change 2 aún no implementado)
- AND el resto de items se ven con badge "Próximamente" y deshabilitados

#### Scenario: Sidebar oculta Usuarios para no-admin

- GIVEN el usuario tiene `rol_sistema = 'usuario'`
- WHEN ve el Sidebar
- THEN el item "Usuarios" NO aparece en absoluto

### Requirement: Menú de usuario en Topbar

El Topbar MUST mostrar el avatar del usuario autenticado a la derecha y, al hacer click, abrir un DropdownMenu con: nombre del usuario, correo, separador, opción "Cerrar sesión".

#### Scenario: Logout desde Topbar

- GIVEN el usuario está autenticado y ve el Topbar
- WHEN hace click en su avatar y selecciona "Cerrar sesión"
- THEN el sistema ejecuta el flujo de logout
- AND redirige a `/login`

### Requirement: Ruta raíz redirige según sesión

El sistema MUST redirigir la ruta `/`: a `/empresas` si hay sesión activa, o a `/login` si no.

#### Scenario: Visita a la raíz sin sesión

- GIVEN no hay token
- WHEN el usuario abre `/`
- THEN el sistema redirige a `/login`

#### Scenario: Visita a la raíz con sesión

- GIVEN hay token válido
- WHEN el usuario abre `/`
- THEN el sistema redirige a `/empresas`

## API Contract Reference

Esta capability NO consume endpoints directamente. Lee `authStore.usuario.rol_sistema` que fue poblado por la capability `auth`.

## Out of Scope

- Breadcrumbs dinámicos (futuro)
- Búsqueda global en Topbar (futuro)
- Notificaciones / inbox en Topbar (futuro)
- Dark mode toggle (diferido al post-MVP)
- Layout responsive mobile/tablet (post-MVP)
