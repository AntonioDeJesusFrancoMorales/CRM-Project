# Change: server-side-list-operations

## Intent
Adapt frontend list contracts to backend server-side pagination and ordering for Empresas, Contactos, Tratos, and Tareas.

## Scope
- Add shared `PageResponse<T>` and list query option types.
- Keep existing hooks array-compatible.
- Add paginated hook variants for screens that need total/page metadata.
