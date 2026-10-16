# Credenciales y perfiles de la demo local

Estas cuentas pertenecen **únicamente al entorno local** de Pipely. Las contraseñas son ficticias, están versionadas a propósito para facilitar una demo y **no deben reutilizarse en producción ni en ningún entorno con datos reales**. El archivo no contiene credenciales del administrador maestro de Keycloak.

## Cuentas disponibles

| Perfil              | Nombre         | Correo / usuario                   | Contraseña local           | ID de usuario CRM                      | ID de Keycloak                         |
| ------------------- | -------------- | ---------------------------------- | -------------------------- | -------------------------------------- | -------------------------------------- |
| Administrador       | Ana Torres     | `admin@pipely.local`               | `Pipely-Admin-2026!`       | `b2000000-0000-4000-8000-000000000001` | `8b43ac67-3c03-4804-ab09-40e3b7476940` |
| Consulta            | Laura Méndez   | `consulta@pipely.local`            | `Pipely-Consulta-2026!`    | `b2000000-0000-4000-8000-000000000002` | `4edb4abf-63bb-47f7-8e29-543d8bb67c78` |
| Ejecutivo Comercial | Andrés Navarro | `ventas@pipely.local`              | `Pipely-Ventas-2026!`      | `b2000000-0000-4000-8000-000000000003` | `6d0000ce-4aab-42d1-967d-3eef51ea580d` |
| Dirección Comercial | Mariana López  | `direccion.comercial@pipely.local` | `Pipely-Direccion-2026!`   | `b2000000-0000-4000-8000-000000000004` | `87c93483-344a-4c47-9c2a-730f63053978` |
| Operaciones CRM     | Valentina Cruz | `operaciones.crm@pipely.local`     | `Pipely-Operaciones-2026!` | `b2000000-0000-4000-8000-000000000005` | `84b7eae7-5e87-4509-848c-d33bde9881b0` |

Todas las cuentas están activas, tienen el correo verificado y reciben el rol técnico de Keycloak `USUARIO`. Solo Ana Torres recibe además `SUPER_USUARIO` y tiene una fila activa en `super_usuarios`. El rol técnico de Keycloak y el rol CRM de PostgreSQL son capas separadas: el segundo determina los permisos sobre los recursos del CRM.

## Perfiles y permisos efectivos

Abreviaturas: **L** = `LEER`, **C** = `CREAR`, **A** = `ACTUALIZAR`, **E** = `ELIMINAR`, **ADM** = `ADMINISTRAR`.

| Perfil              | Recursos y acciones                                                                                                                                         | Alcance                                                                                                                      | Campos sensibles                                                                                                                                                     |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Administrador       | Todos: `TABLERO`, `COLUMNA`, `FICHA`, `TRATO`, `TAREA`, `CONTACTO`, `EMPRESA`, `ETIQUETA`, `AGENDA`, `ROL`, `USUARIO` → **L/C/A/E/ADM**                     | `TODO_COMPARTIDO`                                                                                                            | Lee y escribe `FINANCIERO` y `CONTACTO_PRIVADO`                                                                                                                      |
| Dirección Comercial | Recursos de negocio (`TABLERO`, `COLUMNA`, `FICHA`, `TRATO`, `TAREA`, `CONTACTO`, `EMPRESA`, `ETIQUETA`, `AGENDA`) → **L/C/A/E**; `ROL` y `USUARIO` → **L** | `TODO_COMPARTIDO`                                                                                                            | Lee y escribe `FINANCIERO` en tableros/tratos y `CONTACTO_PRIVADO` en contactos/empresas; puede leer el correo de usuarios, pero `USUARIO` permanece de solo lectura |
| Ejecutivo Comercial | `TABLERO`, `COLUMNA`, `FICHA` → **L**; `TRATO`, `TAREA`, `CONTACTO`, `EMPRESA`, `AGENDA` → **L/C/A**; `ETIQUETA` → **L/C/A**; `ROL` y `USUARIO` → **L**     | Tableros permitidos para los tres recursos Kanban; `PROPIOS_O_ASIGNADOS` para cartera; compartido para etiquetas y catálogos | Sin grupos sensibles                                                                                                                                                 |
| Operaciones CRM     | `TABLERO`, `COLUMNA`, `FICHA`, `TAREA`, `AGENDA`, `CONTACTO`, `EMPRESA`, `TRATO`, `ETIQUETA` → **L/C/A**; `ROL` y `USUARIO` → **L**                         | `TODO_COMPARTIDO`                                                                                                            | Sin grupos sensibles                                                                                                                                                 |
| Consulta            | Todos los recursos → **L**                                                                                                                                  | `TODO_COMPARTIDO`                                                                                                            | Sin grupos sensibles                                                                                                                                                 |

El Ejecutivo Comercial puede consultar únicamente estos dos tableros retenidos:

- `02367727-0e7d-44b5-bb7e-d5cd75c0bfea` — Pipeline de Tratos.
- `36cf746a-475c-4816-9a02-f7bc231fe9b7` — Pipeline de Tareas.

## Convención del backend

En PostgreSQL, `rol_permisos` guarda acciones y grupos como cadenas separadas por comas, ordenadas alfabéticamente por el backend. Un alcance compartido guarda `ids_permitidos` vacío; `TABLEROS_PERMITIDOS` guarda los UUID separados por comas. En las respuestas JSON del backend, permisos, acciones, grupos e IDs se serializan como arreglos; los arreglos vacíos representan la ausencia de IDs o grupos.

## Backend frente a MSW

- **Backend real**: el inicio de sesión ocurre en Keycloak (`crm2-local`) y estas son las credenciales que se deben usar en el frontend. La base PostgreSQL, los roles y los enlaces de identidad deben estar provisionados previamente en el runtime local.
- **MSW**: `src/mocks/fixtures/usuarios.ts` conserva estas cinco identidades y contraseñas como datos de fixture para pruebas y handlers. MSW simula la API del CRM, pero no reemplaza el login de Keycloak en el flujo actual del navegador.
- Un clon nuevo no ejecuta una migración o seed reproducible de estas cuentas. Si el runtime no fue provisionado, sigue la sección de preparación del `README.md` y solicita la provisión local antes de probar el login real.

> **Recordatorio:** este documento es seguro para una demo local, no es un almacén de secretos. Elimina o rota estas credenciales antes de conectar el proyecto a servicios, datos o redes que no sean locales.
