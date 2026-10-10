# Checklist rápido para probar permisos CRM

Este documento es para probar a mano que la autorización del frontend funciona contra el backend local. La idea es entrar con cada usuario, probar lo que debería poder hacer y confirmar que lo que no corresponde desaparece o devuelve `403`.

## Antes de empezar

- [ ] Tener levantados PostgreSQL, Keycloak y el backend local.
- [ ] Abrir el frontend en `http://localhost:5173`.
- [ ] Abrir DevTools → **Network**. Ahí se puede confirmar si una acción realmente envió una request.
- [ ] No ejecutar `docker-compose down -v`, porque borra estos usuarios de prueba.

Después de iniciar sesión, deberían aparecer estas dos requests:

- `GET /api/usuarios/get-by-id?id=...` → `200`.
- `GET /api/roles/get-by-id?id=...` → `200` con `permisos`.

Todos los usuarios de abajo tienen el rol técnico Keycloak `USUARIO`. Ninguno usa `SUPER_USUARIO`.

## Usuarios para probar

| Usuario | Credencial local | Qué representa |
|---|---|---|
| `qa.crm.admin@crm2.local` | Configurada fuera del repositorio | Administrador CRM completo |
| `qa.crm.readonly@crm2.local` | Configurada fuera del repositorio | Solo lectura |
| `qa.crm.operativo@crm2.local` | Configurada fuera del repositorio | Crear y actualizar, sin eliminar |
| `qa.crm.sensible@crm2.local` | Configurada fuera del repositorio | Puede leer datos sensibles, no escribirlos |
| `qa.crm.kanban@crm2.local` | Configurada fuera del repositorio | Kanban limitado a un tablero |
| `qa.crm.sin-permisos@crm2.local` | Configurada fuera del repositorio | Sin permisos sobre módulos de trabajo |

## 1. Administrador CRM

Entrar con `qa.crm.admin@crm2.local`.

- [ ] Puede entrar a Roles y Usuarios.
- [ ] Puede crear, editar y eliminar roles.
- [ ] Puede crear, editar y eliminar usuarios.
- [ ] Puede crear, editar y eliminar datos de trabajo.
- [ ] Ve los campos financieros y privados.
- [ ] En Network, las requests permitidas responden `200`, `201` o `204` según corresponda.

## 2. Usuario de solo lectura

Entrar con `qa.crm.readonly@crm2.local`.

- [ ] Puede consultar los módulos de trabajo.
- [ ] Puede ver Roles y Usuarios, pero solo en modo lectura.
- [ ] No aparecen botones de crear, editar o eliminar.
- [ ] Intentar eliminar un rol de prueba debe devolver `403`.
- [ ] En contactos, `correo` y `telefono` llegan como `null`.
- [ ] En tratos, `valorEstimado`, `probabilidad` y `fechaCierreEsperada` llegan como `null`.
- [ ] Buscar o filtrar por un campo financiero/privado no debería permitir acceder a esos valores.

## 3. Usuario operativo

Entrar con `qa.crm.operativo@crm2.local`.

- [ ] Puede crear y editar datos de trabajo.
- [ ] No puede eliminar.
- [ ] No puede administrar roles ni usuarios.
- [ ] Los botones de eliminar/administrar no deberían aparecer.
- [ ] Si se fuerza una request no permitida, el backend debe responder `403`.
- [ ] Un `403` no debe cerrar la sesión.

## 4. Usuario con datos sensibles

Entrar con `qa.crm.sensible@crm2.local`.

- [ ] Puede ver `correo` y `telefono` de contactos.
- [ ] Puede ver valores financieros de tratos.
- [ ] Puede ver los datos sensibles, pero no debería poder modificarlos.
- [ ] Al editar un campo sensible, una falta de permiso debe mostrar error y no cerrar la sesión.
- [ ] Revisar también dashboard, búsqueda global, filtros y exportaciones.

## 5. Usuario Kanban limitado

Entrar con `qa.crm.kanban@crm2.local`.

- [ ] Solo aparece el tablero **Pipely de Prueba**.
- [ ] Los otros tableros no deberían aparecer.
- [ ] Puede mover fichas si tiene `FICHA.ACTUALIZAR` y `COLUMNA.LEER`.
- [ ] Puede reordenar columnas si tiene `TABLERO.ACTUALIZAR` y `COLUMNA.LEER`.
- [ ] Puede crear/editar según los botones disponibles.
- [ ] No puede eliminar tarjetas porque no tiene `FICHA.ELIMINAR`.
- [ ] Si se quita cualquiera de los permisos compuestos, la acción debe bloquearse y no enviar request.

## 6. Usuario sin permisos de trabajo

Entrar con `qa.crm.sin-permisos@crm2.local`.

- [ ] La aplicación no se rompe después de resolver Usuario → Rol.
- [ ] No puede consultar tableros, tratos, tareas, contactos ni empresas.
- [ ] `GET /api/tableros/get-all` debe devolver `403`.
- [ ] No aparecen acciones de trabajo.
- [ ] La sesión sigue activa aunque una request sea rechazada.

## 7. Roles y matriz de permisos

Con el usuario administrador:

- [ ] Crear o editar un rol de prueba.
- [ ] Verificar que las acciones se guardan: `LEER`, `CREAR`, `ACTUALIZAR`, `ELIMINAR`, `ADMINISTRAR`.
- [ ] Probar `PROPIOS_O_ASIGNADOS` en recursos que lo soportan.
- [ ] Probar `TABLEROS_PERMITIDOS` en `TABLERO`, `COLUMNA` o `FICHA`.
- [ ] Confirmar que `TABLEROS_PERMITIDOS` exige al menos un UUID válido.
- [ ] Confirmar que un alcance incompatible con el recurso muestra error de validación.

## 8. Estados de error

- [ ] Simular un `403` en Network.
  - Debe mostrarse un error entendible.
  - No debe cerrarse la sesión.
  - No debe quedar una mutación optimista fingiendo éxito.

- [ ] Simular un error al resolver Usuario o Rol.
  - Debe aparecer el estado de permisos no disponible.
  - La aplicación no debe crashear.
  - Recordar que la seguridad real sigue estando en el backend.

## Resultado final

- [ ] Probé los seis usuarios.
- [ ] Probé al menos una operación permitida y una rechazada por usuario.
- [ ] Revisé Network y no solo lo que muestra u oculta la pantalla.
- [ ] Revisé que los datos sensibles no aparezcan cuando no corresponden.
- [ ] Revisé Kanban con permisos compuestos.
- [ ] No quedaron errores inesperados en la consola.

### Si algo falla

Anotar estas cuatro cosas antes de corregir:

1. Usuario usado.
2. Pantalla y acción.
3. Request exacta y código HTTP.
4. Qué esperaba que pasara y qué pasó realmente.
