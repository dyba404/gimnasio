# Supabase — conexión de Marsmode

La migración crea el esquema completo (21 tablas, RLS multi-tenant por
`gym_id`). Para un **cliente real** usa `seed-limpio.sql` (gym vacío);
`seed.sql` es SOLO para la demo interna con datos ficticios — nunca lo
corras en la base de un cliente pagante.

## 1. Crear cuenta y proyecto (gratis, ~2 min)

1. Entrar a <https://supabase.com> → **Start your project** (cuenta gratis).
2. **New project** → nombre `marsmode`, contraseña de la base (guardarla),
   región más cercana a Perú (por ejemplo `East US` o `sa-east-1`).
3. Esperar a que el proyecto quede `Active` (plan free: 1 proyecto activo).

## 2. Crear el esquema

1. Menú lateral: **SQL Editor** → **New query**.
2. Pegar el contenido completo de `migrations/0001_marsmode_init.sql` → **Run**.
   Debe terminar sin errores (crea 21 tablas + RLS + índices).

## 3. Cargar datos — DOS OPCIONES

- **Cliente real (producción):** pegar `seed-limpio.sql` → **Run**. Crea un
  gimnasio vacío con 4 planes de arranque (Mensual/Trimestral/Anual/Estudiante,
  editables desde la app). NADA de datos demo.
- **Demo interna:** pegar `seed.sql` → **Run**. Carga el gym "Marsmode
  Fitness" con 15 socios ficticios, pagos, caja, etc. Solo para pruebas de
  venta/demo; las fechas son relativas al día en que lo ejecutas.

## 4. Copiar URL y anon key

**Project Settings** (engranaje) → **API** → copiar:

- **Project URL** → `VITE_SUPABASE_URL`
- **anon / public** (Project API keys) → `VITE_SUPABASE_ANON_KEY`

## 5. Crear las variables de la app

Build de producción (`app/.env.production`, ya configurado para
`gym.marsmode.me`):

```
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...tu-anon-key...
```

Desarrollo local: `app/.env.development.local` con lo mismo (solo carga en
`npm run dev`; NUNCA en `vite build`). **Sin estas variables el build de
producción BLOQUEA el login** (la app no acepta credenciales sin backend).
Para probar la demo con mocks localmente:
`VITE_DEMO_MODE=1 npm run dev` (ver `app/.env.example`).

## 6. Alta de cada cliente nuevo (gimnasio real)

1. Correr `seed-limpio.sql` (crea el gym vacío con planes de arranque).
2. **Authentication** → **Users** → **Add user** → email + contraseña del
   dueño (marca "Auto Confirm User").
3. Asociar el dueño al gym (SQL Editor; ajusta el email — también está en
   `snippets/alta-cliente.sql`):

```sql
update public.gyms
set owner_id = (select id from auth.users where email = 'dueno@migym.pe')
where owner_id is null;
```

A partir de ahí, el dueño entra por `/login` con su correo y la función
`public.accede_gym(gym_id)` (security definer) limita todas las tablas a SU
gym. Socios, membresías, caja y demás se registran desde la app; no se
escribe SQL por cliente.

## 7. Qué espera la app del backend

- **Auth**: email + contraseña (`supabase.auth.signInWithPassword`) con
  `signOut` en el menú del gimnasio. Las rutas están protegidas por
  `RutaProtegida` (sin sesión → `/login`); en producción sin backend la app
  se muestra como "sin configurar" en vez de aceptar cualquier credencial.
- **Multi-tenant**: toda tabla de negocio lleva `gym_id` con policies
  `select/insert/update/delete` gated por `accede_gym(gym_id)` → solo ves y
  escribes filas de tu propio gym.
- **Config del gym** (`gyms`): `yape_numero`, `plin_numero`,
  `link_pago_culqi`, `link_resena_google`, `qr_permitir_legado` se editan
  desde la app (Configuración) y alimentan los mensajes de cobranza
  WhatsApp — no usar los links DEMO de los mocks en producción.

## Decisiones del esquema (para el que mantenga esto)

- **Enums como CHECK constraints** (no tipos Postgres): más simple de
  evolucionar con `alter table ... drop constraint` / `add constraint`.
- **Normalización**: `Pago` repite nombre/código/DNI del socio en los mocks;
  en SQL se resuelven con join, no se duplican.
- **`reservas.socio_id` es `text`**, sin FK: puede ser el uuid de un socio o
  el id de un invitado (`inv-01`) como en `app/src/mocks/clases.ts`.
- **JSONB**: `prospectos.notas_gestion` y `proxima_accion`, `clases.dias`,
  `ventas.lineas`, `cuentas_familiares.miembros`, `facturas_grupo.items`.
- **Congelamiento** (`Membresia.congelada`): dos columnas
  `congelada_desde` / `congelada_hasta` (nulas si no está congelada).
- **RLS**: función `accede_gym(uuid)` `security definer` + 4 policies
  (`select/insert/update/delete`) en cada tabla de negocio con
  `to authenticated`. En `gyms` las policies comparan `owner_id = auth.uid()`
  directamente (sin recursión).

## Checklist de validación

1. `0001_marsmode_init.sql` corre sin errores en el SQL Editor.
2. Cliente real: `seed-limpio.sql` crea 1 gym y 4 planes, CERO socios.
   Demo interna: `seed.sql` → `select count(*) from socios;` = 15.
3. Con un usuario asociado al gym: las queries desde la app devuelven filas
   de SU gym y ninguna de otro gym (RLS).
4. Login con credenciales del dueño funciona; "Cerrar sesión" del menú
   vuelve a `/login`; una ruta inválida muestra 404 real.
