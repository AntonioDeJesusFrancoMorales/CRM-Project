# ===== Stage 1: build =====
# Vite genera estáticos. Node solo se usa para BUILDEAR, no para servir.
FROM node:20-alpine AS build
WORKDIR /app

# --- Variables horneadas en el bundle (todo VITE_ es PÚBLICO, no son secretos) ---
# Vite (loadEnv) levanta las VITE_* de process.env y las prioriza sobre los .env,
# así que declararlas como ENV acá equivale a tenerlas en un .env.production.
# Si algún día cambian, las editás acá o las pisás con build-args desde Easypanel.
ARG VITE_API_BASE_URL=https://antonio-crm2-backend.zhwiib.easypanel.host/api
ARG VITE_KEYCLOAK_URL=https://antonio-keycloak.zhwiib.easypanel.host
ARG VITE_KEYCLOAK_REALM=crm2-local
ARG VITE_KEYCLOAK_CLIENT_ID=crm2-frontend
ARG VITE_ENABLE_MSW=false
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_KEYCLOAK_URL=$VITE_KEYCLOAK_URL \
    VITE_KEYCLOAK_REALM=$VITE_KEYCLOAK_REALM \
    VITE_KEYCLOAK_CLIENT_ID=$VITE_KEYCLOAK_CLIENT_ID \
    VITE_ENABLE_MSW=$VITE_ENABLE_MSW

# pnpm vía corepack, clavado a la versión del package.json (packageManager)
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate

# Deps primero para aprovechar la cache de capas de Docker:
# si no cambian package.json ni el lockfile, este RUN no se vuelve a ejecutar.
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Resto del código + build (tsc --noEmit && vite build).
COPY . .
RUN pnpm build

# ===== Stage 2: serve =====
# nginx liviano sirviendo el dist/. La imagen final NO lleva Node ni node_modules.
FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
