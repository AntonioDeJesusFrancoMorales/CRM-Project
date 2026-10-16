# Pipely — CRM local

Guía breve para levantar el frontend React y el backend Spring del CRM desde cero. El frontend vive en este repositorio y el backend se mantiene en el repositorio hermano `AR-CRM`.

> **Solo desarrollo local:** las cuentas de demo y sus contraseñas están documentadas en [`docs/credenciales-demo.md`](docs/credenciales-demo.md). Son ficticias, no son secretos de producción y nunca deben reutilizarse fuera de un entorno local.

## 1. Requisitos

- Node.js **20 o superior**.
- pnpm **10.33.2** (el `package.json` fija esta versión mediante `packageManager`).
- Java **21** para el backend.
- Docker Desktop con Docker Compose.
- Git.

Comprueba las herramientas antes de continuar:

```bash
node --version
pnpm --version
java --version
docker-compose --version
```

## 2. Clonar y organizar los repositorios

El backend no es una subcarpeta de este repositorio. Usa una carpeta de trabajo común para que ambos queden como hermanos:

```bash
mkdir pipely-local
cd pipely-local
git clone https://github.com/AntonioDeJesusFrancoMorales/CRM-Project.git CRM-Project
git clone https://github.com/ARTECTEAM/AR-CRM.git AR-CRM
cd CRM-Project
```

Resultado esperado:

```text
pipely-local/
├── CRM-Project/   # frontend React + Vite
└── AR-CRM/        # backend Spring Boot + Docker Compose
```

## 3. Instalar el frontend

Desde `CRM-Project/`:

```bash
corepack enable
corepack prepare pnpm@10.33.2 --activate
pnpm install
```

El repositorio sólo incluye `.env.development.example`; el archivo `.env.development` se crea localmente a partir de esa plantilla:

```bash
cp .env.development.example .env.development
```

En PowerShell, usa `Copy-Item .env.development.example .env.development`.

## 4. Levantar la infraestructura local

Desde `AR-CRM/`:

```bash
docker-compose up -d postgres keycloak-db keycloak
docker-compose ps
```

Si tu instalación sólo reconoce el plugin moderno, reemplaza `docker-compose` por `docker compose` en estos comandos.

Espera a que PostgreSQL y `keycloak-db` estén saludables y confirma que el realm responde:

```bash
curl -fsS http://localhost:8180/realms/crm2-local/.well-known/openid-configuration
```

Con el `docker-compose.yml` local actual, `crm2-keycloak` puede aparecer como `unhealthy` aunque este endpoint responda `200`: el healthcheck consulta `/health/ready` en el puerto HTTP `8180`, mientras la imagen expone ese endpoint en su interfaz de gestión. Para esta guía, toma como señales operativas el endpoint `.well-known` y un inicio de sesión correcto; no borres los volúmenes por ese estado.

La configuración local usa PostgreSQL en `localhost:5433`, Keycloak en `localhost:8180` y el backend en `localhost:8080`. No uses `docker-compose down -v` salvo que quieras borrar deliberadamente los volúmenes locales.

## 5. Preparar y arrancar el backend

El backend usa los valores locales de `AR-CRM/boot/src/main/resources/application.yml`. Con la infraestructura arriba, desde `AR-CRM/` ejecuta:

```powershell
.\mvnw.cmd -pl boot -am spring-boot:run
```

En macOS/Linux:

```bash
./mvnw -pl boot -am spring-boot:run
```

Verifica que responde:

```bash
curl -i http://localhost:8080/v3/api-docs
```

### Datos de demo

El clon no contiene una migración ni un seed reproducible para las cinco cuentas, roles, permisos y filas de negocio de esta demo. La guía de credenciales presupone que el runtime local ya fue provisionado; si una instalación nueva no tiene los datos, hay que provisionarlos en el runtime local antes de iniciar sesión. No copies esta configuración a producción.

## 6. Elegir mock o backend real en el frontend

### API simulada con MSW

Úsala para trabajar la interfaz sin consumir los endpoints Spring:

```env
VITE_ENABLE_MSW=true
VITE_API_BASE_URL=/api
VITE_KEYCLOAK_URL=http://localhost:8180
VITE_KEYCLOAK_REALM=crm2-local
VITE_KEYCLOAK_CLIENT_ID=crm2-frontend
```

Los fixtures de MSW contienen perfiles realistas, pero MSW no simula Keycloak: el flujo actual del navegador sigue usando Keycloak salvo que se habilite explícitamente el bypass de autenticación de desarrollo.

### Backend Spring real

```env
VITE_ENABLE_MSW=false
VITE_API_BASE_URL=http://localhost:8080/api
VITE_KEYCLOAK_URL=http://localhost:8180
VITE_KEYCLOAK_REALM=crm2-local
VITE_KEYCLOAK_CLIENT_ID=crm2-frontend
```

No uses `/api/v1`: el contrato actual del backend comienza en `/api`.

## 7. Iniciar el frontend y entrar

Desde `CRM-Project/`:

```bash
pnpm dev
```

Abre <http://localhost:5173> y utiliza una cuenta de [`docs/credenciales-demo.md`](docs/credenciales-demo.md). El backend real necesita que la cuenta exista simultáneamente en Keycloak y en PostgreSQL.

## 8. Verificación y pruebas

Desde `CRM-Project/`:

```bash
pnpm type-check
pnpm test:run
pnpm format:check
```

Otros comandos útiles:

```bash
pnpm lint
pnpm build
pnpm preview
```

Para revisar únicamente el estado de la infraestructura:

```bash
cd ../AR-CRM
docker-compose ps
```

## 9. Solución de problemas

| Síntoma                               | Comprobación                                                                                                                                                                                     |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Keycloak redirige o devuelve `401`    | Confirma el realm `crm2-local`, `VITE_KEYCLOAK_URL`, el cliente `crm2-frontend` y que el endpoint `.well-known` responda 200. Cierra una sesión vieja del navegador si cambiaste una contraseña. |
| El backend no inicia                  | Comprueba Java 21, que PostgreSQL y Keycloak estén arriba y que los puertos `5433`, `8180` y `8080` estén disponibles.                                                                           |
| La SPA devuelve `404` para la API     | Usa `VITE_API_BASE_URL=/api` con MSW o `http://localhost:8080/api` con backend real; no agregues `/v1`.                                                                                          |
| No aparecen las cuentas de demo       | El provisionamiento de datos no se ejecuta al clonar. Verifica que estés usando el runtime local provisionado y que los contenedores conserven sus volúmenes.                                    |
| Docker muestra un contenedor detenido | Ejecuta `docker-compose ps` y `docker-compose logs <servicio>` desde `AR-CRM/`; no borres volúmenes como primer intento.                                                                         |

## Estructura principal

```text
src/api/          # tipos y cliente del contrato HTTP
src/features/     # funcionalidades por dominio
src/mocks/        # handlers y fixtures MSW
src/components/   # layout y primitives UI
src/routes/       # router de la SPA
docs/             # guías de demo y QA
```

La documentación de perfiles, permisos y credenciales está en [`docs/credenciales-demo.md`](docs/credenciales-demo.md).
