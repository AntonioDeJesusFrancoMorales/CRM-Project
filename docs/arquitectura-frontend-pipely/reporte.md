# Arquitectura implementada del frontend de Pipely

El diagrama documenta la integración con la API real, no el modo de simulación de desarrollo. Los nodos agrupan responsabilidades comprobadas; no representan servicios desplegados por separado. Azul: frontend ejecutado en el navegador. Ocre y borde discontinuo: sistemas externos. Las flechas indican dependencias o comunicaciones; no una secuencia temporal ni la dirección exclusiva de las respuestas.

## Figura

Fuente editable: [arquitectura.mmd](arquitectura.mmd). Imágenes del mismo diagrama: [PNG](arquitectura.png) y [SVG](arquitectura.svg). El PNG se generó a 2400 × 1520 píxeles mediante renderizado local de Mermaid; el SVG conservó el formato vectorial. Se revisaron las nueve flechas y la imagen final. No se modificó código de la aplicación.

Figura X. Arquitectura implementada del frontend de Pipely. Fuente: elaboración propia

## Texto para Resultados

La arquitectura implementada del frontend de Pipely se organizó como una aplicación React ejecutada en el navegador. La navegación utilizó React Router y una estructura compartida con menú lateral, barra superior y área de contenido. Las pantallas agruparon las funciones comerciales de empresas, contactos, tratos, tareas, tableros y agenda, junto con inicio, usuarios y configuración. La sesión se gestionó mediante AuthProvider, Zustand y la integración con Keycloak, que intervino en la autenticación y renovación de tokens. Los permisos comerciales se resolvieron consultando el usuario y su rol en la API, de manera independiente de la autenticación. Los hooks por funcionalidad utilizaron React Query y un cliente REST compartido para intercambiar datos JSON con credenciales Bearer. Esta organización distinguió las responsabilidades de navegación, sesión y acceso a datos, y separó visualmente el frontend de los sistemas externos, sin representar detalles internos del backend.

## Evidencia y revisión de las flechas

| Relación del diagrama | Archivos consultados y evidencia |
| --- | --- |
| Navegación → sesión | `src/routes/router.tsx:23-55`: AuthLayout incorpora AuthProvider y ProtectedRoute; `src/components/layout/ProtectedRoute.tsx:5-14`: comprueba autenticación. |
| Navegación → permisos | `src/routes/router.tsx:31-127`: PermissionsProvider y PermissionRoute; `src/features/permissions/components/PermissionRoute.tsx:15-26`: control de ruta; `src/components/layout/Sidebar.tsx:112-122`: visibilidad del menú. |
| Navegación → pantallas | `src/routes/router.tsx:39-127`: rutas y páginas importadas; `src/components/layout/AppShell.tsx:22-83`: Sidebar, Topbar y Outlet. |
| Pantallas → hooks / React Query | `src/features/tratos/pages/TratosListPage.tsx` y `src/features/tratos/hooks/useTratos.ts:39-47`: ejemplo concreto del patrón por funcionalidad; `src/App.tsx:8-15` y `src/lib/query-client.ts:3-19`: proveedor y caché compartidos. El nodo resume un patrón, no afirma que todas las pantallas tengan idéntico flujo. |
| Hooks → cliente REST | `src/features/tratos/hooks/useTratos.ts:39-47`: consulta con apiClient y endpoints. |
| Permisos → cliente REST | `src/features/permissions/context.tsx:74-82` y `src/features/permissions/lib/resolver.ts:16-27`: carga del usuario, consulta del rol y obtención de sus permisos. |
| Sesión → cliente REST | `src/api/client.ts:9-22,49-76`: obtiene token del almacén y solicita renovación; `src/store/authStore.ts`: estado y operaciones de sesión. La flecha representa la provisión de credenciales, no una petición iniciada por AuthProvider. |
| Sesión → Keycloak | `src/features/auth/components/AuthProvider.tsx:27-67`, `src/lib/keycloak.ts:63-115`, `src/features/auth/hooks/useTokenRefresh.ts` y `src/store/authStore.ts:54-79`: inicialización, PKCE, inicio, cierre y renovación. |
| Cliente REST → API externa | `src/api/client.ts:9-34`: base configurable, fetch y Authorization Bearer; `src/api/endpoints.ts`: recursos. Confirmación puntual en `../AR-CRM/infrastructure/src/main/java/com/ar/crm2/adapter/in/rest/TratoController.java:52-54,82-114` y `../AR-CRM/infrastructure/src/main/java/com/ar/crm2/security/SecurityConfig.java:24-30,65-85`: recurso /api/tratos y autenticación JWT. |

## Alcance, matices y documentación

- Las rutas con detalle `/:id` se agruparon con su listado para reducir la densidad visual. `/prospectos` y `/clientes` son redirecciones hacia Contactos, no módulos independientes.
- Los permisos del CRM no se dedujeron de los roles del token de Keycloak. Los controles del frontend no equivalen a autorización de seguridad en el servidor. Cuando no se resuelven las capacidades, PermissionRoute deja pasar el contenido y Sidebar conserva enlaces; por ello no se presenta como un bloqueo incondicional.
- Se excluyeron inteligencia artificial y WhatsApp por el alcance solicitado. No se representaron almacenamiento ni componentes internos del backend.
- La sección 6 de `README.md` coincidió con el código respecto de `/api`, Keycloak y la existencia de un modo simulado. No se identificó una contradicción arquitectónica en los apartados consultados. El diagrama seleccionó la integración real; no pretendió representar todos los modos de desarrollo.

## Versiones revisadas

- Frontend `CRM-Project`: rama `main`, commit `3c9e28313d7f8c813675baa80e772a28ed4eb858`.
- Backend `AR-CRM`, consulta puntual: rama `main`, commit base `2c380bebc04391f79120752a026e5cc581ea0196`.
- La revisión se hizo sobre los archivos del árbol de trabajo, no sobre copias inmutables. El frontend ya contenía `docs/avances-crm-desde-2026-09-22.md` sin seguimiento. El backend tenía cambios locales previos, incluido `SecurityConfig.java`; esa confirmación corresponde al archivo local y no exclusivamente al commit base. No se modificaron esos archivos.
- No se ejecutó la aplicación ni se comprobó un despliegue: las relaciones se verificaron estáticamente en código.

## Inserción en Google Docs

Usar la imagen completa, sin recortar. Preferir A4 horizontal, márgenes de 1.5 cm y ancho de imagen de aproximadamente 26.7 cm. Mantener el pie de figura fuera de la imagen. El SVG permite conservar el original vectorial; para Google Docs se entrega PNG.
