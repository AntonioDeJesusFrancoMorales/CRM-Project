# Reconciliación de contrato API — Front (CRM-Project) vs Back (AR-CRM)

> **Estado:** Pendiente de decisión de equipo.
> **Fecha del análisis:** 2026-05-26
> **Alcance:** comparación del contrato HTTP que consume el front (React + MSW)
> contra el que expone el back (Spring Boot, arquitectura hexagonal).

## TL;DR (para leer en 30 segundos)

Esto **no es un renombrado de rutas**. Front y back se construyeron contra
**dos modelos de dominio distintos** y con **dos estilos de API distintos**.
Hay además **una capa de autenticación que el front asume y el back no tiene**.

Tres bloqueantes a resolver **en equipo** antes de tocar código:

1. 🔴 **No hay autenticación en el back.** El front entero depende de login + JWT.
2. 🔴 **El dominio diverge.** `prospecto` + `cliente` (front) = una sola entidad
   `Contacto` con `estadoRelacion` (back).
3. 🔴 **El `Trato` no tiene `estado`** en el back: no existen las acciones
   `ganar` / `perder` que el front usa.

El estilo REST vs RPC es secundario y corregible. Lo de arriba, no.

---

## 1. Diferencia de estilo (afecta a TODOS los recursos)

El back usa un estilo **RPC sobre HTTP** (verbo en la URL, id por query param).
El front usa **REST** (recurso en el path, id en el path, verbo HTTP semántico).

| Operación | Front (REST) | Back (RPC) |
|---|---|---|
| Prefijo | `/api/v1/{recurso}` | `/api/{recurso}` *(sin versionado)* |
| Listar | `GET /{recurso}` | `GET /{recurso}/get-all` |
| Detalle | `GET /{recurso}/{id}` | `GET /{recurso}/get-by-id?id={uuid}` |
| Crear | `POST /{recurso}` | `POST /{recurso}/create` |
| Editar | `PATCH /{recurso}/{id}` | `PUT /{recurso}/edit?id={uuid}` |
| Eliminar | `DELETE /{recurso}/{id}` | `DELETE /{recurso}/delete?id={uuid}` |

Confirmado idéntico en: `Trato`, `Tarea`, `Tablero`, `Empresa`, `Contacto`, `Usuario`.
El id viaja **siempre** como `@RequestParam` (query), nunca en el path.

**Por qué importa:** REST da cacheabilidad por verbo, idempotencia clara
(PUT/DELETE) y predecibilidad. El estilo `/create`, `/edit`, `/delete` es
RPC: válido en su contexto (p. ej. gRPC), pero no es la convención para una
API HTTP de recursos y rompe el contrato que el front ya tiene implementado.

---

## 2. Mapa recurso por recurso

| Front | Back | Estado |
|---|---|---|
| `usuarios` (CRUD) | `/api/usuarios` (CRUD) | ✅ existe — distinto estilo |
| `usuarios/:id/desactivar` | — | ❌ no existe (entra en `edit`) |
| `empresas` (CRUD) | `/api/empresas` (sin `get-by-id`) | ⚠️ parcial |
| `empresas/:id/prospectos`, `/clientes` | — | ❌ no existe (nested) |
| `tratos` (CRUD) | `/api/tratos` (CRUD) | ⚠️ campos divergen (ver §4) |
| `tratos/:id/ganar`, `/perder` | — | 🔴 no existe (`Trato` sin `estado`) |
| `tratos/:id/tareas` | — | ❌ no existe (nested) |
| `tareas` (CRUD) | `/api/tareas` (CRUD) | ✅ existe — distinto estilo |
| `tareas/:id/completar` | — | ❌ no existe (entra en `edit`) |
| `tableros` (CRUD + columnas) | `/api/tableros` (CRUD + columnas) | ✅ existe — distinto estilo |
| `columnas`, `fichas` | `/api/columnas`, `/api/fichas` | ⚠️ modelo de columnas distinto |
| `prospectos` | `/api/contactos` (estadoRelacion=PROSPECTO) | 🔴 otro concepto (ver §4) |
| `clientes` | `/api/contactos` (estadoRelacion=ACTIVO) | 🔴 otro concepto (ver §4) |
| `auth/login`, `auth/me`, `auth/logout`, `me/password` | — | 🔴 NO EXISTE (ver §3) |
| `etiquetas`, `comentarios` | — | ❌ controllers ausentes |
| — | `/api/roles`, `/api/superusuarios` | el back expone de más |

Endpoints de columnas del back (estilo propio, sobre `/api/tableros`):
`/agregar-columna`, `/eliminar-columna`, `/asignar-columna`, `/reordenar-columnas`
(todos con `?id=` del tablero y body).

---

## 3. 🔴 Bloqueante #1 — No hay autenticación en el back

Búsqueda de `login`, `jwt`, `token`, `SecurityFilterChain`: **sin resultados**
de seguridad. Lo único presente es `OpenApiConfig` (Swagger), `CorsConfig` y
`WiringConfig` (inyección de dependencias). No hay `AuthController` ni filtro
de seguridad.

**Impacto en el front:** `src/api/client.ts` inyecta `Authorization: Bearer
${token}` y dispara logout automático en `401`. Existen `useLogin`, `useMe`,
`authStore`, y rutas protegidas. **Nada de eso tiene endpoint contra el cual
operar.** No es un endpoint que falta — es una capa entera ausente.

**A decidir en equipo:**
- ¿El back va a implementar auth (login + JWT + filtro)? ¿Con qué contrato?
- ¿O el front trabaja sin auth por ahora (modo demo) y se agrega después?

---

## 4. 🔴 Bloqueante #2 y #3 — El dominio diverge

### 4.1 Contacto unificado vs Prospecto/Cliente separados

El back tiene **una** entidad `Contacto` con un enum `EstadoRelacion`
(`PROSPECTO`, `ACTIVO`, `INACTIVO`) y reglas de negocio reales:
- No se puede volver a `PROSPECTO` una vez que se salió de ese estado.
- No se puede pasar a `INACTIVO` si tiene tratos activos.

El front, en cambio, modela **dos recursos separados**: `prospectos` y
`clientes`, cada uno con sus endpoints, hooks y vistas.

```
Front:  prospectos  ─┐
                     ├─► back: Contacto (1 entidad)
        clientes    ─┘        estadoRelacion: PROSPECTO | ACTIVO | INACTIVO
```

> Nota honesta: el modelo del back acá es **más limpio**. Un contacto que
> transiciona de prospecto a cliente con invariantes protegidas es mejor diseño
> de dominio que partirlo en dos recursos. Pero es **distinto** a lo que el
> front implementó, y reconciliarlo es trabajo de diseño, no de renombrado.

**A decidir en equipo:**
- ¿El front adopta el modelo `Contacto + estadoRelacion`? (impacta vistas,
  hooks, tipos, mocks y navegación)
- ¿O el back expone `prospectos`/`clientes` como proyecciones del contacto?

### 4.2 El Trato no tiene `estado`

| Campo | Front `Trato` | Back `Trato` |
|---|---|---|
| Relación con contacto | `prospecto_id` + `cliente_id` | `contactoId` (uno solo) |
| Estado | `estado: abierto \| ganado \| perdido` | **no existe** |
| Motivo de pérdida | `motivo_perdida` | `motivoPerdida` ✅ |
| Acciones | `PATCH /:id/ganar`, `/:id/perder` | **no existen** |

El back tiene `motivoPerdida` pero **ningún campo `estado`** y ninguna acción
de dominio para ganar/perder. El concepto de ciclo de vida del trato que el
front asume, en el back no está modelado.

**A decidir en equipo:**
- ¿El back agrega `estado` + endpoints `ganar`/`perder`?
- ¿O el estado se deriva de otra cosa y el front se adapta?

---

## 5. Opciones de implementación (una vez decidido el contrato)

1. **Capa anti-corrupción (recomendada si el back queda como está).**
   Un adapter en `src/api/client.ts` traduce REST↔RPC en UN solo lugar. El
   resto del front sigue limpio y REST. Aísla el desajuste de estilo.
   *No resuelve auth ni la divergencia de dominio — esos son cambios reales.*

2. **Adaptar el front al back.** Reescribir hooks + mocks + tests al estilo
   RPC y al modelo de dominio del back. Alto costo, rompe features (login,
   ganar/perder), deuda permanente si el back no es el contrato final.

3. **Alinear el back a un contrato acordado.** Lo ideal de ingeniería: el
   equipo define UN contrato (idealmente OpenAPI versionado) y ambos lados lo
   implementan. Más caro al inicio, más barato para siempre.

---

## 6. Recomendación

1. **Frená el cambio de rutas a ciegas.** No es el problema real.
2. **Definí el contrato como equipo** — idealmente un OpenAPI/Swagger único
   como fuente de verdad (el back ya tiene `OpenApiConfig`, hay base).
3. **Resolvé los 3 bloqueantes** (auth, contacto-vs-prospecto/cliente,
   estado-del-trato) **antes** de escribir adaptadores.
4. Recién entonces elegí la estrategia de implementación de §5.

> Mejora estructural sugerida para el front, independiente de lo anterior:
> centralizar los paths en `src/api/endpoints.ts` (única fuente de verdad que
> importen hooks y handlers del mock). Hoy cada path está duplicado en hook +
> handler + test; por eso "cambiar una ruta" duele tanto.
