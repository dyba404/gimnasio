# app/Dockerfile — imagen de producción Marsmode (gym.marsmode.me)
#
# Multi-stage: stage 1 compila el SPA (las VITE_* llegan como build ARGs
# desde docker compose --env-file app/.env.production; el .dockerignore
# excluye TODO .env* del contexto, así ningún .env local se hornea jamás),
# stage 2 lo sirve con nginx + deploy/nginx.conf.
#
#   docker compose --env-file app/.env.production -f deploy/docker-compose.yml build web

FROM node:22-alpine AS build
WORKDIR /app

# PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: playwright es devDependency de tests;
# sin esto su postinstall baja ~300 MB de navegadores a la imagen.
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# Capa de dependencias cacheable aparte del código
COPY app/package.json app/package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY app/ ./

ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

RUN npm run build

FROM nginx:alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
