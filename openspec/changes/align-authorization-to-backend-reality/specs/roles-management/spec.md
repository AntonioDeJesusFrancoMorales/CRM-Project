# Delta: roles-management (align-authorization-to-backend-reality)

## REMOVED Requirements

### Requirement: Area de Configuracion admin-only en Sidebar y router

**Razón de la baja:** el back NO enforza autorización por rol (`/api/**` solo exige
autenticación; ver memoria `back-modelo-permisos-real`). El gate admin-only del front
(`RoleGuard role="admin"` + `Sidebar.adminOnly`) era cosmético y daba falsa sensación de
seguridad. Se elimina el `RoleGuard`; `/configuracion` queda accesible a cualquier usuario
autenticado, coherente con lo que el back permite.

El comportamiento reemplazante queda especificado en la capability `frontend-authorization`
(ítem "Configuración" visible a todo autenticado; ruta `/configuracion` sin guard de rol).
