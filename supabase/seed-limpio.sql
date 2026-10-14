-- Seed LIMPIO para producción — NO carga datos demo.
-- Solo crea el usuario (si no existe) y su gimnasio vacío con planes
-- de arranque editables desde la app.
--
-- USO POR CADA CLIENTE NUEVO (SQL Editor de Supabase):
--   1. Reemplaza :owner_email por el correo del dueño.
--   2. Ejecuta. Crea el gym con planes Mensual/Trimestral/Anual/Estudiante.
--   3. Crea el usuario en Authentication → Users → Add user (Auto Confirm)
--      con ESE correo.
-- Todo lo demás (socios, membresías, etc.) se registra desde la app.

insert into public.gyms (id, nombre, yape_numero, plin_numero)
values (
  gen_random_uuid(),
  'Mi Gimnasio',
  null,
  null
)
returning id, nombre;

-- Asociar el dueño (ejecutar DESPUÉS de crear el usuario en Authentication):
--
-- update public.gyms
-- set owner_id = (select id from auth.users where email = 'dueno@migym.pe')
-- where owner_id is null;
--
-- Planes de arranque (ya insertados arriba vía el bloque siguiente):

insert into public.planes (gym_id, nombre, precio, duracion_dias)
select g.id, p.nombre, p.precio, p.duracion
from public.gyms g
cross join (values
  ('Mensual', 80, 30),
  ('Trimestral', 210, 90),
  ('Anual', 660, 365),
  ('Estudiante', 55, 30)
) as p(nombre, precio, duracion)
where g.owner_id is null
  and not exists (
    select 1 from public.planes pl where pl.gym_id = g.id
  );
