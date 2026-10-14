# Checklist de deploy y venta — Marsmode

Estado de "listo para vender" del stack, con los pasos operativos por
cliente. Mantener actualizado al cerrar cada onboarding.

## Qué está listo

- **Frontend**: build de producción (`npm run build` en `app/`) con PWA
  instalable, code-splitting por ruta y service worker autoUpdate.
  Sin backend configurado, el build de producción BLOQUEA el login
  (pantalla "app sin configurar") — nunca se publica una app abierta.
- **Backend**: esquema Supabase completo (21 tablas, RLS multi-tenant por
  `gym_id` gated por `accede_gym(gym_id)` + `owner_id = auth.uid()`); con la
  anon key NO se puede leer ni escribir nada sin sesión del dueño.
- **Auth real**: login con `signInWithPassword`, logout en el menú del
  gimnasio, rutas protegidas (`RutaProtegida`), usuario real en el topbar.
- **Deploy**: la app corre como imagen Docker propia (`marsmode-web`):
  `app/Dockerfile` multi-stage — stage 1 `node:22-alpine` ejecuta `npm ci`
  + `npm run build` recibiendo `VITE_SUPABASE_URL` y
  `VITE_SUPABASE_ANON_KEY` como build ARGs (nunca lee archivos `.env`), y
  stage 2 `nginx:alpine` copia `deploy/nginx.conf` (gzip, security
  headers, `client_max_body_size 10m`) + el dist resultante. Adiós bind
  mount de `app/dist`: el sitio sirve la imagen, inmutable.
  `deploy/docker-compose.yml` (servicio `web` con `build:` sobre el
  contexto raíz del repo + cloudflared) publica `gym.marsmode.me` vía
  tunnel de Cloudflare; nginx proxya `/rest`, `/auth`, `/realtime`,
  `/storage` (locations `^~`, para que el regex de assets no las capture)
  al Kong de Supabase (mismo origen, sin CORS). Compose exige las
  variables (`:?`) → imposible publicar una app sin configurar.
- **Datos**: toda la UI opera sobre Supabase cuando está conectado; los
  mocks solo corren en modo demo explícito (`VITE_DEMO_MODE=1`, desarrollo).

## Alta de un cliente nuevo (procedimiento)

1. Correr `supabase/seed-limpio.sql` en el proyecto (gym vacío + planes).
   NUNCA `seed.sql` (datos ficticios) en un cliente pagante.
2. Authentication → Users → Add user (email + contraseña del dueño, "Auto
   Confirm User").
3. Asociar dueño al gym: `update public.gyms set owner_id = (select id from
   auth.users where email = '...') where owner_id is null;`
   (o `supabase/snippets/alta-cliente.sql`).
4. Verificar login en `https://gym.marsmode.me/login` + "Cerrar sesión".
5. El dueño carga sus planes/socios desde la app (Configuración → Cobros:
   registrar su CulqiLink y link de reseña Google reales).

## Deploy de una nueva versión

1. **Normal** — desde PowerShell: `.\scripts\gym.ps1 deploy` (build de la
   imagen `marsmode-web` + `up -d` + health check de
   `https://gym.marsmode.me`).
   Alternativa manual en WSL:
   `sudo docker compose --env-file app/.env.production -f deploy/docker-compose.yml build web`
   y luego
   `sudo docker compose --env-file app/.env.production -f deploy/docker-compose.yml up -d web`.
2. **Credenciales**: las `VITE_*` se hornean en el bundle durante el build
   de la imagen → si cambian credenciales, rebuild de la imagen ANTES del
   `up -d` (el comando `deploy` ya lo hace en ese orden).
3. **Rollback sin git** — ANTES de cada deploy, etiquetar la imagen actual:
   `sudo docker tag marsmode-web:latest marsmode-web:$(date +%F)` (dentro
   de WSL; listar con `sudo docker images marsmode-web`). Rollback =
   `sudo docker tag marsmode-web:<fecha-buena> marsmode-web:latest` +
   `up -d web` → el sitio vuelve a servir la versión de esa fecha.
4. **Primera vez tras este cambio**: el comando `on` normal ya no
   reconstruye la imagen (solo levanta el stack, ahora pasando
   `--env-file app/.env.production` al compose): usar `deploy` al menos
   una vez.

## Deuda operativa conocida (decidir antes de escalar)

- **El stack corre en una PC de escritorio Windows/WSL** encendida con
  `scripts/gym.ps1 on`: si la PC se apaga, el servicio cae. Para 10 clientes
  fundadores migrar a Supabase Cloud + hosting estático (Netlify/Vercel/
  Cloudflare Pages) o un VPS con backups — la migración ya está lista.
- **Sin git**: inicializar repositorio antes del primer deploy real
  (rollback imposible hoy).
- **Postgres local sin backups**: si se sigue con Supabase local, definir
  `pg_dump` diario a otra máquina/Drive.
- Healthcheck del tunnel: nginx solo prueba archivos estáticos; añadir
  probe de `/rest/v1/` y monitoreo externo del dominio (UptimeRobot).
- **nginx — RESUELTO (2026-09-13)**: gzip, security headers
  (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, HSTS) y
  `client_max_body_size 10m` ya viven en `deploy/nginx.conf`, servido por
  la imagen.
- **Imagen Docker sin registry remoto**: las imágenes `marsmode-web`
  viven solo en la PC; si se migra a VPS, push a GHCR o rebuild allí.

## Variables del build

- `app/.env.production`: `VITE_SUPABASE_URL` (gym.marsmode.me) +
  `VITE_SUPABASE_ANON_KEY`. Es lo ÚNICO que alimenta el build de
  producción: el build corre DENTRO de la imagen (`app/Dockerfile`) con
  las `VITE_*` como build ARGs que `docker compose --env-file
  app/.env.production` interpola — el Dockerfile nunca lee archivos
  `.env` (el `.dockerignore` de la raíz los excluye del contexto).
- `app/.env.development.local` (nuevo): carga SOLO en `npm run dev` —
  Supabase local (`127.0.0.1:54321`) + `VITE_DEMO_MODE=1` para los mocks.
- PROHIBIDO poner `VITE_DEMO_MODE` en `.env`, `.env.local` o
  `.env.production`: cualquiera de ellos se hornea en `vite build` y
  bloquea el login público con "App sin configurar".
- Nunca commitear `.env.local` ni claves de servicio (service_role).
