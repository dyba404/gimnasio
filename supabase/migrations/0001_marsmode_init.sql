create extension if not exists pgcrypto;

create table public.gyms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users (id) on delete set null,
  nombre text not null,
  yape_numero text,
  plin_numero text,
  link_pago_culqi text,
  link_resena_google text,
  qr_permitir_legado boolean not null default false,
  creado_en timestamptz not null default now()
);

create or replace function public.accede_gym(p_gym_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.gyms
    where id = p_gym_id
      and owner_id = auth.uid()
  )
$$;

revoke all on function public.accede_gym(uuid) from public;
grant execute on function public.accede_gym(uuid) to authenticated;

alter table public.gyms enable row level security;

create policy "select_gym_propio" on public.gyms
  for select to authenticated
  using (owner_id = auth.uid());

create policy "insert_gym_propio" on public.gyms
  for insert to authenticated
  with check (owner_id = auth.uid());

create policy "update_gym_propio" on public.gyms
  for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "delete_gym_propio" on public.gyms
  for delete to authenticated
  using (owner_id = auth.uid());

create table public.planes (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms (id) on delete cascade,
  nombre text not null,
  precio numeric(10, 2) not null check (precio >= 0),
  duracion_dias integer not null check (duracion_dias > 0),
  creado_en timestamptz not null default now(),
  unique (gym_id, nombre)
);

create table public.socios (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms (id) on delete cascade,
  codigo text not null,
  nombre text not null,
  dni text not null,
  telefono text not null,
  plan_id uuid not null references public.planes (id) on delete restrict,
  estado text not null check (estado in ('activo', 'moroso', 'congelado')),
  fecha_registro date not null default current_date,
  creado_en timestamptz not null default now(),
  unique (gym_id, codigo)
);

create table public.membresias (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms (id) on delete cascade,
  socio_id uuid not null references public.socios (id) on delete cascade,
  plan_id uuid not null references public.planes (id) on delete restrict,
  fecha_inicio date not null,
  fecha_fin date not null,
  monto numeric(10, 2) not null check (monto >= 0),
  estado text not null check (estado in ('vigente', 'por-vencer', 'vencida')),
  congelada_desde date,
  congelada_hasta date,
  check ((congelada_desde is null and congelada_hasta is null)
    or (congelada_desde is not null and congelada_hasta is not null)),
  check (fecha_fin >= fecha_inicio),
  creado_en timestamptz not null default now()
);

create table public.pagos (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms (id) on delete cascade,
  socio_id uuid not null references public.socios (id) on delete cascade,
  plan_id uuid not null references public.planes (id) on delete restrict,
  fecha date not null default current_date,
  monto numeric(10, 2) not null check (monto >= 0),
  metodo text not null check (metodo in ('efectivo', 'yape', 'plin')),
  estado text not null check (estado in ('completado', 'pendiente', 'anulado')),
  concepto text not null check (concepto in ('membresia', 'inscripcion')),
  creado_en timestamptz not null default now()
);

create table public.gastos (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms (id) on delete cascade,
  categoria text not null check (categoria in ('alquiler', 'servicios', 'sueldos', 'equipamiento', 'marketing', 'otros')),
  descripcion text not null,
  proveedor text not null,
  monto numeric(10, 2) not null check (monto >= 0),
  fecha date not null default current_date,
  creado_en timestamptz not null default now()
);

create table public.movimientos_caja (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms (id) on delete cascade,
  fecha date not null default current_date,
  hora text not null,
  socio_nombre text not null,
  concepto text not null check (concepto in ('membresia', 'inscripcion', 'producto')),
  metodo text not null check (metodo in ('efectivo', 'yape', 'plin')),
  monto numeric(10, 2) not null check (monto >= 0),
  creado_en timestamptz not null default now()
);

create table public.asistencias (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms (id) on delete cascade,
  socio_id uuid not null references public.socios (id) on delete cascade,
  fecha date not null default current_date,
  hora text,
  creado_en timestamptz not null default now(),
  unique (socio_id, fecha, hora)
);

create table public.gestiones_bitacora (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms (id) on delete cascade,
  socio_id uuid not null references public.socios (id) on delete cascade,
  tipo text not null check (tipo in ('whatsapp', 'llamada', 'visita', 'recordatorio')),
  nota text not null,
  resultado text not null check (resultado in ('pendiente', 'prometio', 'pagara-hoy', 'no-responde', 'negocia')),
  fecha date not null default current_date,
  creado_en timestamptz not null default now()
);

create table public.prospectos (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms (id) on delete cascade,
  nombre text not null,
  telefono text not null,
  fuente text not null check (fuente in ('walk-in', 'referido', 'facebook', 'instagram', 'marketplace', 'otra')),
  estado text not null check (estado in ('nuevo', 'contactado', 'demo', 'negociacion', 'ganado', 'perdido')),
  interes text check (interes in ('mensual', 'trimestral', 'anual', 'estudiante')),
  valor_potencial_mensual numeric(10, 2) not null default 0 check (valor_potencial_mensual >= 0),
  notas_gestion jsonb not null default '[]'::jsonb,
  proxima_accion jsonb,
  creado_en date not null default current_date
);

create table public.referidos (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms (id) on delete cascade,
  referidor_id uuid not null references public.socios (id) on delete cascade,
  referido_id uuid not null references public.socios (id) on delete cascade,
  fecha date not null default current_date,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'elegible', 'aplicado', 'invalido')),
  check (referidor_id <> referido_id),
  creado_en timestamptz not null default now()
);

create table public.clases (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms (id) on delete cascade,
  nombre text not null,
  instructor text not null,
  dias jsonb not null default '[]'::jsonb,
  hora_inicio text not null,
  duracion_min integer not null check (duracion_min > 0),
  cupo integer not null check (cupo > 0),
  es_prueba boolean not null default false,
  creado_en timestamptz not null default now(),
  unique (gym_id, nombre)
);

create table public.reservas (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms (id) on delete cascade,
  clase_id uuid not null references public.clases (id) on delete cascade,
  socio_id text not null,
  fecha date not null,
  estado text not null check (estado in ('confirmada', 'espera', 'cancelada')),
  es_prueba boolean not null default false,
  creado_en timestamptz not null default now()
);

create table public.productos (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms (id) on delete cascade,
  sku text not null,
  nombre text not null,
  precio numeric(10, 2) not null check (precio >= 0),
  stock integer not null default 0 check (stock >= 0),
  min_stock integer not null default 0 check (min_stock >= 0),
  categoria text not null check (categoria in ('suplementos', 'bebidas', 'accesorios', 'ropa')),
  creado_en timestamptz not null default now(),
  unique (gym_id, sku)
);

create table public.ventas (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms (id) on delete cascade,
  socio_id uuid references public.socios (id) on delete set null,
  fecha date not null default current_date,
  hora text not null,
  lineas jsonb not null default '[]'::jsonb,
  total numeric(10, 2) not null check (total >= 0),
  metodo text not null check (metodo in ('efectivo', 'yape', 'plin')),
  creado_en timestamptz not null default now()
);

create table public.mediciones (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms (id) on delete cascade,
  socio_id uuid not null references public.socios (id) on delete cascade,
  fecha date not null default current_date,
  peso_kg numeric(5, 1) check (peso_kg is null or peso_kg > 0),
  grasa_pct numeric(4, 1) check (grasa_pct is null or grasa_pct >= 0),
  altura_cm numeric(5, 1) check (altura_cm is null or altura_cm > 0),
  cuello_cm numeric(4, 1) check (cuello_cm is null or cuello_cm > 0),
  pecho_cm numeric(4, 1) check (pecho_cm is null or pecho_cm > 0),
  cintura_cm numeric(4, 1) check (cintura_cm is null or cintura_cm > 0),
  brazo_cm numeric(4, 1) check (brazo_cm is null or brazo_cm > 0),
  muslo_cm numeric(4, 1) check (muslo_cm is null or muslo_cm > 0),
  creado_en timestamptz not null default now()
);

create table public.logros_definidos (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms (id) on delete cascade,
  nombre text not null,
  emoji text not null,
  metrica text not null check (metrica in ('racha', 'asistencias-mes', 'total-asistencias', 'tempranero')),
  umbral integer not null check (umbral > 0),
  creado_en timestamptz not null default now(),
  unique (gym_id, nombre)
);

create table public.logros_socio (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms (id) on delete cascade,
  socio_id uuid not null references public.socios (id) on delete cascade,
  logro_id uuid not null references public.logros_definidos (id) on delete cascade,
  fecha_conseguido date not null default current_date,
  creado_en timestamptz not null default now(),
  unique (socio_id, logro_id)
);

create table public.cuentas_familiares (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms (id) on delete cascade,
  head_socio_id uuid not null references public.socios (id) on delete cascade,
  miembros jsonb not null default '[]'::jsonb,
  creado_en timestamptz not null default now()
);

create table public.facturas_grupo (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms (id) on delete cascade,
  cuenta_id uuid not null references public.cuentas_familiares (id) on delete cascade,
  fecha date not null default current_date,
  items jsonb not null default '[]'::jsonb,
  estado text not null check (estado in ('abierta', 'cobrada')),
  creado_en timestamptz not null default now()
);

create table public.solicitudes_resena (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms (id) on delete cascade,
  socio_id uuid not null references public.socios (id) on delete cascade,
  fecha date not null default current_date,
  gatillo text not null check (gatillo in ('renovacion', 'asistencia')),
  creado_en timestamptz not null default now()
);

create index idx_planes_gym on public.planes (gym_id);
create index idx_socios_gym on public.socios (gym_id);
create index idx_socios_plan on public.socios (plan_id);
create index idx_membresias_gym on public.membresias (gym_id);
create index idx_membresias_socio on public.membresias (socio_id);
create index idx_membresias_fin on public.membresias (gym_id, fecha_fin);
create index idx_pagos_gym on public.pagos (gym_id);
create index idx_pagos_socio on public.pagos (socio_id, fecha);
create index idx_gastos_gym on public.gastos (gym_id, fecha);
create index idx_movimientos_caja_gym on public.movimientos_caja (gym_id, fecha);
create index idx_asistencias_gym on public.asistencias (gym_id);
create index idx_asistencias_socio on public.asistencias (socio_id, fecha);
create index idx_gestiones_gym on public.gestiones_bitacora (gym_id);
create index idx_gestiones_socio on public.gestiones_bitacora (socio_id, fecha);
create index idx_prospectos_gym on public.prospectos (gym_id);
create index idx_referidos_gym on public.referidos (gym_id);
create index idx_referidos_referidor on public.referidos (referidor_id);
create index idx_referidos_referido on public.referidos (referido_id);
create index idx_clases_gym on public.clases (gym_id);
create index idx_reservas_gym on public.reservas (gym_id);
create index idx_reservas_clase on public.reservas (clase_id, fecha);
create index idx_productos_gym on public.productos (gym_id);
create index idx_ventas_gym on public.ventas (gym_id, fecha);
create index idx_mediciones_gym on public.mediciones (gym_id);
create index idx_mediciones_socio on public.mediciones (socio_id, fecha);
create index idx_logros_definidos_gym on public.logros_definidos (gym_id);
create index idx_logros_socio_gym on public.logros_socio (gym_id);
create index idx_logros_socio_socio on public.logros_socio (socio_id);
create index idx_cuentas_familiares_gym on public.cuentas_familiares (gym_id);
create index idx_facturas_grupo_gym on public.facturas_grupo (gym_id);
create index idx_facturas_grupo_cuenta on public.facturas_grupo (cuenta_id);
create index idx_solicitudes_resena_gym on public.solicitudes_resena (gym_id);
create index idx_solicitudes_resena_socio on public.solicitudes_resena (socio_id);

alter table public.planes enable row level security;
alter table public.socios enable row level security;
alter table public.membresias enable row level security;
alter table public.pagos enable row level security;
alter table public.gastos enable row level security;
alter table public.movimientos_caja enable row level security;
alter table public.asistencias enable row level security;
alter table public.gestiones_bitacora enable row level security;
alter table public.prospectos enable row level security;
alter table public.referidos enable row level security;
alter table public.clases enable row level security;
alter table public.reservas enable row level security;
alter table public.productos enable row level security;
alter table public.ventas enable row level security;
alter table public.mediciones enable row level security;
alter table public.logros_definidos enable row level security;
alter table public.logros_socio enable row level security;
alter table public.cuentas_familiares enable row level security;
alter table public.facturas_grupo enable row level security;
alter table public.solicitudes_resena enable row level security;

create policy "select_gym_propio" on public.planes
  for select to authenticated
  using (public.accede_gym(gym_id));
create policy "insert_gym_propio" on public.planes
  for insert to authenticated
  with check (public.accede_gym(gym_id));
create policy "update_gym_propio" on public.planes
  for update to authenticated
  using (public.accede_gym(gym_id))
  with check (public.accede_gym(gym_id));
create policy "delete_gym_propio" on public.planes
  for delete to authenticated
  using (public.accede_gym(gym_id));

create policy "select_gym_propio" on public.socios
  for select to authenticated
  using (public.accede_gym(gym_id));
create policy "insert_gym_propio" on public.socios
  for insert to authenticated
  with check (public.accede_gym(gym_id));
create policy "update_gym_propio" on public.socios
  for update to authenticated
  using (public.accede_gym(gym_id))
  with check (public.accede_gym(gym_id));
create policy "delete_gym_propio" on public.socios
  for delete to authenticated
  using (public.accede_gym(gym_id));

create policy "select_gym_propio" on public.membresias
  for select to authenticated
  using (public.accede_gym(gym_id));
create policy "insert_gym_propio" on public.membresias
  for insert to authenticated
  with check (public.accede_gym(gym_id));
create policy "update_gym_propio" on public.membresias
  for update to authenticated
  using (public.accede_gym(gym_id))
  with check (public.accede_gym(gym_id));
create policy "delete_gym_propio" on public.membresias
  for delete to authenticated
  using (public.accede_gym(gym_id));

create policy "select_gym_propio" on public.pagos
  for select to authenticated
  using (public.accede_gym(gym_id));
create policy "insert_gym_propio" on public.pagos
  for insert to authenticated
  with check (public.accede_gym(gym_id));
create policy "update_gym_propio" on public.pagos
  for update to authenticated
  using (public.accede_gym(gym_id))
  with check (public.accede_gym(gym_id));
create policy "delete_gym_propio" on public.pagos
  for delete to authenticated
  using (public.accede_gym(gym_id));

create policy "select_gym_propio" on public.gastos
  for select to authenticated
  using (public.accede_gym(gym_id));
create policy "insert_gym_propio" on public.gastos
  for insert to authenticated
  with check (public.accede_gym(gym_id));
create policy "update_gym_propio" on public.gastos
  for update to authenticated
  using (public.accede_gym(gym_id))
  with check (public.accede_gym(gym_id));
create policy "delete_gym_propio" on public.gastos
  for delete to authenticated
  using (public.accede_gym(gym_id));

create policy "select_gym_propio" on public.movimientos_caja
  for select to authenticated
  using (public.accede_gym(gym_id));
create policy "insert_gym_propio" on public.movimientos_caja
  for insert to authenticated
  with check (public.accede_gym(gym_id));
create policy "update_gym_propio" on public.movimientos_caja
  for update to authenticated
  using (public.accede_gym(gym_id))
  with check (public.accede_gym(gym_id));
create policy "delete_gym_propio" on public.movimientos_caja
  for delete to authenticated
  using (public.accede_gym(gym_id));

create policy "select_gym_propio" on public.asistencias
  for select to authenticated
  using (public.accede_gym(gym_id));
create policy "insert_gym_propio" on public.asistencias
  for insert to authenticated
  with check (public.accede_gym(gym_id));
create policy "update_gym_propio" on public.asistencias
  for update to authenticated
  using (public.accede_gym(gym_id))
  with check (public.accede_gym(gym_id));
create policy "delete_gym_propio" on public.asistencias
  for delete to authenticated
  using (public.accede_gym(gym_id));

create policy "select_gym_propio" on public.gestiones_bitacora
  for select to authenticated
  using (public.accede_gym(gym_id));
create policy "insert_gym_propio" on public.gestiones_bitacora
  for insert to authenticated
  with check (public.accede_gym(gym_id));
create policy "update_gym_propio" on public.gestiones_bitacora
  for update to authenticated
  using (public.accede_gym(gym_id))
  with check (public.accede_gym(gym_id));
create policy "delete_gym_propio" on public.gestiones_bitacora
  for delete to authenticated
  using (public.accede_gym(gym_id));

create policy "select_gym_propio" on public.prospectos
  for select to authenticated
  using (public.accede_gym(gym_id));
create policy "insert_gym_propio" on public.prospectos
  for insert to authenticated
  with check (public.accede_gym(gym_id));
create policy "update_gym_propio" on public.prospectos
  for update to authenticated
  using (public.accede_gym(gym_id))
  with check (public.accede_gym(gym_id));
create policy "delete_gym_propio" on public.prospectos
  for delete to authenticated
  using (public.accede_gym(gym_id));

create policy "select_gym_propio" on public.referidos
  for select to authenticated
  using (public.accede_gym(gym_id));
create policy "insert_gym_propio" on public.referidos
  for insert to authenticated
  with check (public.accede_gym(gym_id));
create policy "update_gym_propio" on public.referidos
  for update to authenticated
  using (public.accede_gym(gym_id))
  with check (public.accede_gym(gym_id));
create policy "delete_gym_propio" on public.referidos
  for delete to authenticated
  using (public.accede_gym(gym_id));

create policy "select_gym_propio" on public.clases
  for select to authenticated
  using (public.accede_gym(gym_id));
create policy "insert_gym_propio" on public.clases
  for insert to authenticated
  with check (public.accede_gym(gym_id));
create policy "update_gym_propio" on public.clases
  for update to authenticated
  using (public.accede_gym(gym_id))
  with check (public.accede_gym(gym_id));
create policy "delete_gym_propio" on public.clases
  for delete to authenticated
  using (public.accede_gym(gym_id));

create policy "select_gym_propio" on public.reservas
  for select to authenticated
  using (public.accede_gym(gym_id));
create policy "insert_gym_propio" on public.reservas
  for insert to authenticated
  with check (public.accede_gym(gym_id));
create policy "update_gym_propio" on public.reservas
  for update to authenticated
  using (public.accede_gym(gym_id))
  with check (public.accede_gym(gym_id));
create policy "delete_gym_propio" on public.reservas
  for delete to authenticated
  using (public.accede_gym(gym_id));

create policy "select_gym_propio" on public.productos
  for select to authenticated
  using (public.accede_gym(gym_id));
create policy "insert_gym_propio" on public.productos
  for insert to authenticated
  with check (public.accede_gym(gym_id));
create policy "update_gym_propio" on public.productos
  for update to authenticated
  using (public.accede_gym(gym_id))
  with check (public.accede_gym(gym_id));
create policy "delete_gym_propio" on public.productos
  for delete to authenticated
  using (public.accede_gym(gym_id));

create policy "select_gym_propio" on public.ventas
  for select to authenticated
  using (public.accede_gym(gym_id));
create policy "insert_gym_propio" on public.ventas
  for insert to authenticated
  with check (public.accede_gym(gym_id));
create policy "update_gym_propio" on public.ventas
  for update to authenticated
  using (public.accede_gym(gym_id))
  with check (public.accede_gym(gym_id));
create policy "delete_gym_propio" on public.ventas
  for delete to authenticated
  using (public.accede_gym(gym_id));

create policy "select_gym_propio" on public.mediciones
  for select to authenticated
  using (public.accede_gym(gym_id));
create policy "insert_gym_propio" on public.mediciones
  for insert to authenticated
  with check (public.accede_gym(gym_id));
create policy "update_gym_propio" on public.mediciones
  for update to authenticated
  using (public.accede_gym(gym_id))
  with check (public.accede_gym(gym_id));
create policy "delete_gym_propio" on public.mediciones
  for delete to authenticated
  using (public.accede_gym(gym_id));

create policy "select_gym_propio" on public.logros_definidos
  for select to authenticated
  using (public.accede_gym(gym_id));
create policy "insert_gym_propio" on public.logros_definidos
  for insert to authenticated
  with check (public.accede_gym(gym_id));
create policy "update_gym_propio" on public.logros_definidos
  for update to authenticated
  using (public.accede_gym(gym_id))
  with check (public.accede_gym(gym_id));
create policy "delete_gym_propio" on public.logros_definidos
  for delete to authenticated
  using (public.accede_gym(gym_id));

create policy "select_gym_propio" on public.logros_socio
  for select to authenticated
  using (public.accede_gym(gym_id));
create policy "insert_gym_propio" on public.logros_socio
  for insert to authenticated
  with check (public.accede_gym(gym_id));
create policy "update_gym_propio" on public.logros_socio
  for update to authenticated
  using (public.accede_gym(gym_id))
  with check (public.accede_gym(gym_id));
create policy "delete_gym_propio" on public.logros_socio
  for delete to authenticated
  using (public.accede_gym(gym_id));

create policy "select_gym_propio" on public.cuentas_familiares
  for select to authenticated
  using (public.accede_gym(gym_id));
create policy "insert_gym_propio" on public.cuentas_familiares
  for insert to authenticated
  with check (public.accede_gym(gym_id));
create policy "update_gym_propio" on public.cuentas_familiares
  for update to authenticated
  using (public.accede_gym(gym_id))
  with check (public.accede_gym(gym_id));
create policy "delete_gym_propio" on public.cuentas_familiares
  for delete to authenticated
  using (public.accede_gym(gym_id));

create policy "select_gym_propio" on public.facturas_grupo
  for select to authenticated
  using (public.accede_gym(gym_id));
create policy "insert_gym_propio" on public.facturas_grupo
  for insert to authenticated
  with check (public.accede_gym(gym_id));
create policy "update_gym_propio" on public.facturas_grupo
  for update to authenticated
  using (public.accede_gym(gym_id))
  with check (public.accede_gym(gym_id));
create policy "delete_gym_propio" on public.facturas_grupo
  for delete to authenticated
  using (public.accede_gym(gym_id));

create policy "select_gym_propio" on public.solicitudes_resena
  for select to authenticated
  using (public.accede_gym(gym_id));
create policy "insert_gym_propio" on public.solicitudes_resena
  for insert to authenticated
  with check (public.accede_gym(gym_id));
create policy "update_gym_propio" on public.solicitudes_resena
  for update to authenticated
  using (public.accede_gym(gym_id))
  with check (public.accede_gym(gym_id));
create policy "delete_gym_propio" on public.solicitudes_resena
  for delete to authenticated
  using (public.accede_gym(gym_id));
