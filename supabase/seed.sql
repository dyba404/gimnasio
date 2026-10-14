insert into public.gyms (id, nombre, yape_numero, plin_numero, link_pago_culqi, link_resena_google, qr_permitir_legado)
values (
  '11111111-1111-1111-1111-111111111111',
  'Marsmode Fitness',
  '999 999 999',
  '999 999 999',
  'https://express.culqi.com/DEMOMARS01',
  'https://g.page/r/DEMOMARS01/review',
  false
);

insert into public.planes (id, gym_id, nombre, precio, duracion_dias) values
  ('21111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Mensual', 80, 30),
  ('21111111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111111', 'Trimestral', 210, 90),
  ('21111111-1111-1111-1111-111111111113', '11111111-1111-1111-1111-111111111111', 'Anual', 660, 365),
  ('21111111-1111-1111-1111-111111111114', '11111111-1111-1111-1111-111111111111', 'Estudiante', 55, 30);

insert into public.socios (id, gym_id, codigo, nombre, dni, telefono, plan_id, estado, fecha_registro) values
  ('31111111-1111-1111-1111-111111111101', '11111111-1111-1111-1111-111111111111', 'MS-001', 'Rosa Ñahui Quispe', '45782136', '987 214 503', '21111111-1111-1111-1111-111111111111', 'activo', current_date - 240),
  ('31111111-1111-1111-1111-111111111102', '11111111-1111-1111-1111-111111111111', 'MS-002', 'Jorge Luis Ccahuana Ríos', '40112958', '954 780 126', '21111111-1111-1111-1111-111111111112', 'activo', current_date - 410),
  ('31111111-1111-1111-1111-111111111103', '11111111-1111-1111-1111-111111111111', 'MS-003', 'María Gracia Belaúnde', '44120765', '902 335 841', '21111111-1111-1111-1111-111111111113', 'activo', current_date - 680),
  ('31111111-1111-1111-1111-111111111104', '11111111-1111-1111-1111-111111111111', 'MS-004', 'Kevin Rodrigo Muñoz', '47890312', '976 118 240', '21111111-1111-1111-1111-111111111114', 'moroso', current_date - 150),
  ('31111111-1111-1111-1111-111111111105', '11111111-1111-1111-1111-111111111111', 'MS-005', 'Ana Sofía Rojas Paredes', '42331874', '933 640 715', '21111111-1111-1111-1111-111111111111', 'activo', current_date - 95),
  ('31111111-1111-1111-1111-111111111106', '11111111-1111-1111-1111-111111111111', 'MS-006', 'Luis Fernando Huamán', '41552709', '918 072 334', '21111111-1111-1111-1111-111111111112', 'activo', current_date - 320),
  ('31111111-1111-1111-1111-111111111107', '11111111-1111-1111-1111-111111111111', 'MS-007', 'Carmen Rosa Ñaupari', '46998123', '945 509 682', '21111111-1111-1111-1111-111111111111', 'congelado', current_date - 210),
  ('31111111-1111-1111-1111-111111111108', '11111111-1111-1111-1111-111111111111', 'MS-008', 'Piero Alessandro Ghibelli', '43012876', '921 887 456', '21111111-1111-1111-1111-111111111113', 'activo', current_date - 540),
  ('31111111-1111-1111-1111-111111111109', '11111111-1111-1111-1111-111111111111', 'MS-009', 'Gabriela Sánchez León', '48771045', '968 243 519', '21111111-1111-1111-1111-111111111114', 'moroso', current_date - 120),
  ('31111111-1111-1111-1111-111111111110', '11111111-1111-1111-1111-111111111111', 'MS-010', 'Jhon Fredy Rodríguez', '40996231', '989 466 027', '21111111-1111-1111-1111-111111111111', 'activo', current_date - 75),
  ('31111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'MS-011', 'Yessenia Marilú Poma', '45226780', '907 521 993', '21111111-1111-1111-1111-111111111112', 'congelado', current_date - 275),
  ('31111111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111111', 'MS-012', 'Álvaro Nunura Sifuentes', '43441892', '913 380 158', '21111111-1111-1111-1111-111111111111', 'moroso', current_date - 60),
  ('31111111-1111-1111-1111-111111111113', '11111111-1111-1111-1111-111111111111', 'MS-013', 'Fiorella Mendívil Anaya', '44501237', '958 301 774', '21111111-1111-1111-1111-111111111111', 'moroso', current_date - 30),
  ('31111111-1111-1111-1111-111111111114', '11111111-1111-1111-1111-111111111111', 'MS-014', 'Diego Velarde Quiroz', '43879015', '947 662 018', '21111111-1111-1111-1111-111111111111', 'moroso', current_date - 45),
  ('31111111-1111-1111-1111-111111111115', '11111111-1111-1111-1111-111111111111', 'MS-015', 'Milagros Pastor Carbajal', '42108873', '936 445 20', '21111111-1111-1111-1111-111111111114', 'moroso', current_date - 20);

insert into public.membresias (gym_id, socio_id, plan_id, fecha_inicio, fecha_fin, monto, estado, congelada_desde, congelada_hasta)
select '11111111-1111-1111-1111-111111111111', s.id, p.id,
        current_date + (f.dias_para_fin) - p.duracion_dias, current_date + (f.dias_para_fin), p.precio, f.estado,
       f.pausa_desde, f.pausa_hasta
from (values
  ('MS-001', 'Mensual', 12, 'vigente', null, null),
  ('MS-002', 'Trimestral', 45, 'vigente', null, null),
  ('MS-003', 'Anual', 180, 'vigente', null, null),
  ('MS-004', 'Estudiante', -6, 'vencida', null, null),
  ('MS-005', 'Mensual', 5, 'por-vencer', null, null),
  ('MS-006', 'Trimestral', 3, 'por-vencer', null, null),
  ('MS-007', 'Mensual', 20, 'vigente', current_date - 2, current_date + 13),
  ('MS-008', 'Anual', 90, 'vigente', null, null),
  ('MS-009', 'Estudiante', -15, 'vencida', null, null),
  ('MS-010', 'Mensual', 7, 'por-vencer', null, null),
  ('MS-011', 'Trimestral', 60, 'vigente', current_date - 10, current_date + 5),
  ('MS-012', 'Mensual', -2, 'vencida', null, null),
  ('MS-013', 'Mensual', 0, 'vencida', null, null),
  ('MS-014', 'Mensual', -8, 'vencida', null, null),
  ('MS-015', 'Estudiante', -12, 'vencida', null, null)
) as f(codigo, plan, dias_para_fin, estado, pausa_desde, pausa_hasta)
join public.socios s on s.gym_id = '11111111-1111-1111-1111-111111111111' and s.codigo = f.codigo
join public.planes p on p.gym_id = '11111111-1111-1111-1111-111111111111' and p.nombre = f.plan;

insert into public.pagos (gym_id, socio_id, plan_id, fecha, monto, metodo, estado, concepto)
select '11111111-1111-1111-1111-111111111111', s.id, pl.id, current_date - g.dias_atras, g.monto, g.metodo, g.estado, g.concepto
from (values
  ('MS-001', 'Mensual', 3, 30, 'efectivo', 'completado', 'inscripcion'),
  ('MS-001', 'Mensual', 12, 80, 'yape', 'completado', 'membresia'),
  ('MS-001', 'Mensual', 42, 80, 'yape', 'completado', 'membresia'),
  ('MS-002', 'Trimestral', 20, 210, 'plin', 'completado', 'membresia'),
  ('MS-002', 'Trimestral', 110, 210, 'efectivo', 'completado', 'membresia'),
  ('MS-003', 'Anual', 185, 660, 'yape', 'completado', 'membresia'),
  ('MS-004', 'Estudiante', 8, 55, 'efectivo', 'pendiente', 'membresia'),
  ('MS-004', 'Estudiante', 38, 55, 'efectivo', 'completado', 'membresia'),
  ('MS-005', 'Mensual', 5, 80, 'yape', 'completado', 'membresia'),
  ('MS-005', 'Mensual', 35, 30, 'plin', 'completado', 'inscripcion'),
  ('MS-006', 'Trimestral', 15, 210, 'efectivo', 'completado', 'membresia'),
  ('MS-006', 'Trimestral', 40, 80, 'yape', 'anulado', 'membresia'),
  ('MS-007', 'Mensual', 25, 80, 'plin', 'completado', 'membresia'),
  ('MS-008', 'Anual', 90, 660, 'yape', 'completado', 'membresia'),
  ('MS-009', 'Estudiante', 10, 55, 'efectivo', 'pendiente', 'membresia'),
  ('MS-009', 'Estudiante', 45, 55, 'yape', 'completado', 'membresia'),
  ('MS-010', 'Mensual', 7, 80, 'yape', 'completado', 'membresia'),
  ('MS-011', 'Trimestral', 30, 210, 'efectivo', 'completado', 'membresia'),
  ('MS-012', 'Mensual', 2, 80, 'efectivo', 'pendiente', 'membresia'),
  ('MS-012', 'Mensual', 32, 30, 'plin', 'completado', 'inscripcion'),
  ('MS-013', 'Mensual', 28, 80, 'yape', 'completado', 'membresia'),
  ('MS-014', 'Mensual', 39, 80, 'efectivo', 'completado', 'membresia'),
  ('MS-015', 'Estudiante', 20, 55, 'plin', 'completado', 'membresia')
) as g(codigo, plan, dias_atras, monto, metodo, estado, concepto)
join public.socios s on s.gym_id = '11111111-1111-1111-1111-111111111111' and s.codigo = g.codigo
join public.planes pl on pl.gym_id = '11111111-1111-1111-1111-111111111111' and pl.nombre = g.plan;

insert into public.gastos (gym_id, categoria, descripcion, proveedor, monto, fecha)
select '11111111-1111-1111-1111-111111111111', categoria, descripcion, proveedor, monto, current_date - dias_atras
from (values
  ('alquiler', 'Alquiler del local', 'Inmobiliaria Salazar', 3500, 3),
  ('sueldos', 'Sueldo recepcionista María Flores', 'María Flores Quispe', 1200, 5),
  ('sueldos', 'Sueldo recepcionista Carlos Ramos', 'Carlos Ramos Vilca', 1200, 5),
  ('marketing', 'Pauta de Instagram Ads', 'Meta Platforms Ireland', 200, 6),
  ('servicios', 'Recibo de luz del local', 'Luz del Sur', 450, 8),
  ('servicios', 'Limpieza semanal del gym', 'Brillo Total S.A.C.', 300, 10),
  ('servicios', 'Recibo de agua del local', 'SEDAPAL', 180, 12),
  ('otros', 'Insumos de limpieza e higiene', 'Comercial Sport S.A.C.', 150, 15),
  ('servicios', 'Internet dedicado del gym', 'Movistar Empresas', 120, 16),
  ('equipamiento', 'Mantenimiento de cintas y máquinas', 'Fitness Service E.I.R.L.', 350, 20),
  ('alquiler', 'Alquiler del local', 'Inmobiliaria Salazar', 3500, 33),
  ('sueldos', 'Sueldo recepcionista María Flores', 'María Flores Quispe', 1200, 36),
  ('sueldos', 'Sueldo recepcionista Carlos Ramos', 'Carlos Ramos Vilca', 1200, 36),
  ('servicios', 'Recibo de luz del local', 'Luz del Sur', 465, 37),
  ('equipamiento', 'Repuesto de bici de spinning', 'Refacción Deportiva E.I.R.L.', 260, 55),
  ('alquiler', 'Alquiler del local', 'Inmobiliaria Salazar', 3500, 63)
) as g(categoria, descripcion, proveedor, monto, dias_atras);

insert into public.movimientos_caja (gym_id, fecha, hora, socio_nombre, concepto, metodo, monto) values
  ('11111111-1111-1111-1111-111111111111', current_date, '08:32', 'Kevin Rodrigo Muñoz', 'membresia', 'efectivo', 55),
  ('11111111-1111-1111-1111-111111111111', current_date, '08:10', 'Ana Sofía Rojas Paredes', 'membresia', 'yape', 80),
  ('11111111-1111-1111-1111-111111111111', current_date, '07:18', 'Rosa Ñahui Quispe', 'producto', 'efectivo', 12.5);

insert into public.asistencias (gym_id, socio_id, fecha, hora)
select '11111111-1111-1111-1111-111111111111', s.id, current_date - t.dias, t.hora
from (values
  (0, '07:05'::text),
  (2, '07:20'::text),
  (3, '06:58'::text),
  (7, '07:12'::text)
) as t(dias, hora)
join public.socios s on s.gym_id = '11111111-1111-1111-1111-111111111111' and s.codigo = 'MS-001';

insert into public.asistencias (gym_id, socio_id, fecha)
select '11111111-1111-1111-1111-111111111111', s.id, current_date - t.dias
from (values (9), (10), (14), (16), (17), (21), (23), (24), (28)) as t(dias)
join public.socios s on s.gym_id = '11111111-1111-1111-1111-111111111111' and s.codigo = 'MS-001';

insert into public.asistencias (gym_id, socio_id, fecha)
select '11111111-1111-1111-1111-111111111111', s.id, current_date - t.dias
from (values (1), (2), (4), (5), (8), (9), (11), (12), (15), (16), (18), (19), (22), (23), (26), (29)) as t(dias)
join public.socios s on s.gym_id = '11111111-1111-1111-1111-111111111111' and s.codigo = 'MS-002';

insert into public.asistencias (gym_id, socio_id, fecha)
select '11111111-1111-1111-1111-111111111111', s.id, current_date - t.dias
from (values (0), (1), (3), (5), (8), (10), (12), (15), (17), (19), (22), (24), (26), (29)) as t(dias)
join public.socios s on s.gym_id = '11111111-1111-1111-1111-111111111111' and s.codigo = 'MS-003';

insert into public.asistencias (gym_id, socio_id, fecha)
select '11111111-1111-1111-1111-111111111111', s.id, current_date - t.dias
from (values (15), (16), (18), (20), (22), (25), (27), (31)) as t(dias)
join public.socios s on s.gym_id = '11111111-1111-1111-1111-111111111111' and s.codigo = 'MS-004';

insert into public.asistencias (gym_id, socio_id, fecha)
select '11111111-1111-1111-1111-111111111111', s.id, current_date - t.dias
from (values (0), (2), (4), (6), (9), (11), (13), (16), (18), (20), (23), (25), (27)) as t(dias)
join public.socios s on s.gym_id = '11111111-1111-1111-1111-111111111111' and s.codigo = 'MS-005';

insert into public.asistencias (gym_id, socio_id, fecha)
select '11111111-1111-1111-1111-111111111111', s.id, current_date - t.dias
from (values (1), (3), (6), (8), (12), (14), (17), (21), (24), (28)) as t(dias)
join public.socios s on s.gym_id = '11111111-1111-1111-1111-111111111111' and s.codigo = 'MS-006';

insert into public.asistencias (gym_id, socio_id, fecha)
select '11111111-1111-1111-1111-111111111111', s.id, current_date - t.dias
from (values (4), (9), (16), (24)) as t(dias)
join public.socios s on s.gym_id = '11111111-1111-1111-1111-111111111111' and s.codigo = 'MS-007';

insert into public.asistencias (gym_id, socio_id, fecha)
select '11111111-1111-1111-1111-111111111111', s.id, current_date - t.dias
from (values (0), (1), (4), (6), (8), (11), (13), (15), (18), (20), (22), (25), (27)) as t(dias)
join public.socios s on s.gym_id = '11111111-1111-1111-1111-111111111111' and s.codigo = 'MS-008';

insert into public.asistencias (gym_id, socio_id, fecha)
select '11111111-1111-1111-1111-111111111111', s.id, current_date - t.dias
from (values (18), (19), (21), (24), (26), (29)) as t(dias)
join public.socios s on s.gym_id = '11111111-1111-1111-1111-111111111111' and s.codigo = 'MS-009';

insert into public.asistencias (gym_id, socio_id, fecha)
select '11111111-1111-1111-1111-111111111111', s.id, current_date - t.dias
from (values (0), (3), (5), (7), (10), (12), (14), (17), (19)) as t(dias)
join public.socios s on s.gym_id = '11111111-1111-1111-1111-111111111111' and s.codigo = 'MS-010';

insert into public.asistencias (gym_id, socio_id, fecha)
select '11111111-1111-1111-1111-111111111111', s.id, current_date - t.dias
from (values (6), (13), (20), (27)) as t(dias)
join public.socios s on s.gym_id = '11111111-1111-1111-1111-111111111111' and s.codigo = 'MS-011';

insert into public.asistencias (gym_id, socio_id, fecha)
select '11111111-1111-1111-1111-111111111111', s.id, current_date - t.dias
from (values (12), (13), (15), (17), (19), (22)) as t(dias)
join public.socios s on s.gym_id = '11111111-1111-1111-1111-111111111111' and s.codigo = 'MS-012';

insert into public.gestiones_bitacora (gym_id, socio_id, tipo, nota, resultado, fecha)
select '11111111-1111-1111-1111-111111111111', s.id, g.tipo, g.nota, g.resultado, current_date - g.dias_atras
from (values
  ('MS-004', 'whatsapp', 'Recordatorio de membresía vencida, sin respuesta.', 'no-responde', 5),
  ('MS-004', 'llamada', 'Contestó, prometió pasar a ponerse al día el viernes.', 'prometio', 2),
  ('MS-004', 'whatsapp', 'Seguimiento del compromiso del viernes.', 'pendiente', 0),
  ('MS-009', 'llamada', 'Tres intentos, buzón de voz.', 'no-responde', 9),
  ('MS-009', 'whatsapp', 'Enviado detalle de la deuda de dos meses.', 'no-responde', 6),
  ('MS-009', 'visita', 'La vio el profe en clase de spinning, pide prorratear.', 'negocia', 3),
  ('MS-009', 'recordatorio', 'Recordatorio de propuesta de pago parcial.', 'prometio', 1),
  ('MS-012', 'whatsapp', 'Primer aviso de vencimiento hace 2 días.', 'no-responde', 10),
  ('MS-012', 'llamada', 'Prometió renovar con plan mensual esta semana.', 'prometio', 7),
  ('MS-012', 'visita', 'Se le dejó nota impresa en caseta.', 'prometio', 4),
  ('MS-012', 'whatsapp', 'Pide esperarlo a la quincena, se pactó el 15.', 'negocia', 2),
  ('MS-012', 'recordatorio', 'Confirmó que pasa hoy a pagar.', 'pagara-hoy', 0),
  ('MS-014', 'whatsapp', 'Primer recordatorio tras el vencimiento.', 'no-responde', 7),
  ('MS-015', 'whatsapp', 'Recordatorio amigable de renovación.', 'prometio', 8)
) as g(codigo, tipo, nota, resultado, dias_atras)
join public.socios s on s.gym_id = '11111111-1111-1111-1111-111111111111' and s.codigo = g.codigo;

insert into public.prospectos (gym_id, nombre, telefono, fuente, estado, interes, valor_potencial_mensual, notas_gestion, proxima_accion, creado_en)
values
  ('11111111-1111-1111-1111-111111111111', 'Luis Ramírez', '987123456', 'walk-in', 'negociacion', 'mensual', 99,
   jsonb_build_array(
     jsonb_build_object('fecha', (current_date - 3)::text, 'nota', 'Pasó a preguntar precios, entrena en otro gym cerca.', 'tipo', 'visita'),
     jsonb_build_object('fecha', (current_date - 1)::text, 'nota', 'Le envié propuesta del plan fundador, pide pensar el fin de semana.', 'tipo', 'whatsapp')
   ),
   jsonb_build_object('fecha', (current_date + 2)::text, 'detalle', 'Confirmar cierre del plan fundador'),
   current_date - 3),
  ('11111111-1111-1111-1111-111111111111', 'Carla Flores', '934567812', 'instagram', 'demo', 'estudiante', 55,
   jsonb_build_array(
     jsonb_build_object('fecha', (current_date - 2)::text, 'nota', 'Escribió por DM, es universitaria.', 'tipo', 'whatsapp'),
     jsonb_build_object('fecha', (current_date - 1)::text, 'nota', 'Agendó clase de prueba, vino a ver las instalaciones.', 'tipo', 'visita')
   ),
   jsonb_build_object('fecha', (current_date + 1)::text, 'detalle', 'Clase de prueba a las 7 pm'),
   current_date - 2),
  ('11111111-1111-1111-1111-111111111111', 'Jorge Salas', '954321876', 'referido', 'ganado', 'anual', 66,
   jsonb_build_array(
     jsonb_build_object('fecha', (current_date - 6)::text, 'nota', 'Lo refirió Carlos Rojas.', 'tipo', 'llamada'),
     jsonb_build_object('fecha', (current_date - 4)::text, 'nota', 'Probó una clase sin costo.', 'tipo', 'visita'),
     jsonb_build_object('fecha', (current_date - 2)::text, 'nota', 'Cerró el plan fundador (S/ 99/mes).', 'tipo', 'otro')
   ),
   null,
   current_date - 6),
  ('11111111-1111-1111-1111-111111111111', 'María Torres', '965874123', 'facebook', 'ganado', 'mensual', 99,
   jsonb_build_array(
     jsonb_build_object('fecha', (current_date - 9)::text, 'nota', 'Comentó en la publicación de anuncios.', 'tipo', 'whatsapp'),
     jsonb_build_object('fecha', (current_date - 7)::text, 'nota', 'Visitó el gym con su hermana.', 'tipo', 'visita'),
     jsonb_build_object('fecha', (current_date - 5)::text, 'nota', 'Cerró el plan fundador (S/ 99/mes).', 'tipo', 'otro')
   ),
   null,
   current_date - 9),
  ('11111111-1111-1111-1111-111111111111', 'Diego Herrera', '912345678', 'marketplace', 'nuevo', 'mensual', 99, '[]'::jsonb, null, current_date - 1),
  ('11111111-1111-1111-1111-111111111111', 'Ana Quispe', '976543210', 'walk-in', 'nuevo', 'trimestral', 79, '[]'::jsonb, null, current_date - 12),
  ('11111111-1111-1111-1111-111111111111', 'Pedro Sánchez', '98765', 'referido', 'contactado', 'mensual', 99,
   jsonb_build_array(
     jsonb_build_object('fecha', (current_date - 8)::text, 'nota', 'Número incompleto en el formulario, contestó un tercero.', 'tipo', 'llamada')
   ),
   null,
   current_date - 10),
  ('11111111-1111-1111-1111-111111111111', 'Rosa García', '945612378', 'instagram', 'contactado', 'mensual', 99,
   jsonb_build_array(
     jsonb_build_object('fecha', (current_date - 2)::text, 'nota', 'Respondió el primer contacto, pide horarios de la mañana.', 'tipo', 'whatsapp')
   ),
   null,
   current_date - 4),
  ('11111111-1111-1111-1111-111111111111', 'Miguel Chávez', '923456789', 'facebook', 'demo', 'anual', 66,
   jsonb_build_array(
     jsonb_build_object('fecha', (current_date - 5)::text, 'nota', 'Quiere entrenar en las noches, evaluamos el plan anual.', 'tipo', 'llamada'),
     jsonb_build_object('fecha', (current_date - 4)::text, 'nota', 'Probó la sala de musculación.', 'tipo', 'visita')
   ),
   null,
   current_date - 5),
  ('11111111-1111-1111-1111-111111111111', 'Lucía Mendoza', '967891234', 'referido', 'negociacion', 'anual', 66,
   jsonb_build_array(
     jsonb_build_object('fecha', (current_date - 4)::text, 'nota', 'Pide descuento por pago al contado del plan anual.', 'tipo', 'whatsapp'),
     jsonb_build_object('fecha', (current_date - 3)::text, 'nota', 'Le ofrecí incluir la inscripción sin costo, lo evalúa.', 'tipo', 'whatsapp')
   ),
   null,
   current_date - 6),
  ('11111111-1111-1111-1111-111111111111', 'Raúl Castro', '938765412', 'marketplace', 'perdido', 'mensual', 99,
   jsonb_build_array(
     jsonb_build_object('fecha', (current_date - 7)::text, 'nota', 'Consultó por el precio mensual.', 'tipo', 'whatsapp'),
     jsonb_build_object('fecha', (current_date - 6)::text, 'nota', 'Perdido: encontró un gimnasio más barato en su cuadra.', 'tipo', 'otro')
   ),
   null,
   current_date - 7),
  ('11111111-1111-1111-1111-111111111111', 'Fiorella Díaz', '956789123', 'otra', 'perdido', 'estudiante', 55,
   jsonb_build_array(
     jsonb_build_object('fecha', (current_date - 9)::text, 'nota', 'Perdido: se mudó de distrito, quedó lejos del gym.', 'tipo', 'otro')
   ),
   null,
   current_date - 9),
  ('11111111-1111-1111-1111-111111111111', 'Carlos Rojas', '981234567', 'walk-in', 'ganado', 'mensual', 99,
   jsonb_build_array(
     jsonb_build_object('fecha', (current_date - 3)::text, 'nota', 'Walk-in directo, entrenó el mismo día.', 'tipo', 'visita'),
     jsonb_build_object('fecha', (current_date - 1)::text, 'nota', 'Cerró el plan fundador (S/ 99/mes).', 'tipo', 'otro')
   ),
   null,
   current_date - 3),
  ('11111111-1111-1111-1111-111111111111', 'Beatriz Luna', '945123678', 'facebook', 'ganado', 'trimestral', 79,
   jsonb_build_array(
     jsonb_build_object('fecha', (current_date - 5)::text, 'nota', 'Escribió por Messenger, quiere clases grupales.', 'tipo', 'whatsapp'),
     jsonb_build_object('fecha', (current_date - 3)::text, 'nota', 'Cerró el plan fundador (S/ 99/mes).', 'tipo', 'otro')
   ),
   null,
   current_date - 5);

insert into public.referidos (gym_id, referidor_id, referido_id, fecha, estado)
select '11111111-1111-1111-1111-111111111111', r.id, d.id, current_date - g.dias_atras, g.estado
from (values
  ('MS-002', 'MS-001', 95, 'pendiente'),
  ('MS-003', 'MS-008', 80, 'pendiente'),
  ('MS-005', 'MS-006', 60, 'pendiente'),
  ('MS-001', 'MS-003', 150, 'aplicado'),
  ('MS-006', 'MS-002', 120, 'aplicado'),
  ('MS-008', 'MS-004', 40, 'pendiente'),
  ('MS-010', 'MS-012', 25, 'pendiente'),
  ('MS-005', 'MS-007', 15, 'pendiente')
) as g(referidor, referido, dias_atras, estado)
join public.socios r on r.gym_id = '11111111-1111-1111-1111-111111111111' and r.codigo = g.referidor
join public.socios d on d.gym_id = '11111111-1111-1111-1111-111111111111' and d.codigo = g.referido;

insert into public.clases (gym_id, nombre, instructor, dias, hora_inicio, duracion_min, cupo, es_prueba) values
  ('11111111-1111-1111-1111-111111111111', 'Funcional', 'Coach Bruno Salas', '["lun","mie","vie","sab"]'::jsonb, '06:00', 45, 12, false),
  ('11111111-1111-1111-1111-111111111111', 'CrossFit', 'Coach Marco Huamán', '["lun","mar","mie","jue","vie"]'::jsonb, '19:30', 60, 13, false),
  ('11111111-1111-1111-1111-111111111111', 'Spinning', 'Profe Daniela Ríos', '["mar","jue","sab","dom"]'::jsonb, '18:30', 45, 20, false),
  ('11111111-1111-1111-1111-111111111111', 'Zumba', 'Profe Valeria Campos', '["lun","mie","vie"]'::jsonb, '18:30', 60, 24, true),
  ('11111111-1111-1111-1111-111111111111', 'Yoga', 'Profe Lucía Paredes', '["mar","jue","dom"]'::jsonb, '19:30', 60, 12, false),
  ('11111111-1111-1111-1111-111111111111', 'Boxeo', 'Coach Renzo Quispe', '["vie","sab","dom"]'::jsonb, '19:30', 60, 13, false);

insert into public.reservas (gym_id, clase_id, socio_id, fecha, estado, es_prueba)
select '11111111-1111-1111-1111-111111111111', c.id, s.id::text, current_date + 1, 'confirmada', false
from (values ('MS-001'), ('MS-002'), ('MS-003'), ('MS-004'), ('MS-005'), ('MS-006'), ('MS-007'), ('MS-008'), ('MS-009'), ('MS-010'), ('MS-011'), ('MS-012')) as t(codigo)
join public.socios s on s.gym_id = '11111111-1111-1111-1111-111111111111' and s.codigo = t.codigo
join public.clases c on c.gym_id = '11111111-1111-1111-1111-111111111111' and c.nombre = 'Funcional';

insert into public.reservas (gym_id, clase_id, socio_id, fecha, estado, es_prueba) values
  ('11111111-1111-1111-1111-111111111111', (select id from public.clases where nombre = 'Funcional'), 'inv-01', current_date + 1, 'espera', false),
  ('11111111-1111-1111-1111-111111111111', (select id from public.clases where nombre = 'Funcional'), 'inv-02', current_date + 1, 'espera', false);

insert into public.reservas (gym_id, clase_id, socio_id, fecha, estado, es_prueba)
select '11111111-1111-1111-1111-111111111111', c.id, s.id::text, current_date + 1, 'confirmada', false
from (values ('MS-001'), ('MS-002'), ('MS-003'), ('MS-004'), ('MS-005'), ('MS-006'), ('MS-007'), ('MS-008')) as t(codigo)
join public.socios s on s.gym_id = '11111111-1111-1111-1111-111111111111' and s.codigo = t.codigo
join public.clases c on c.gym_id = '11111111-1111-1111-1111-111111111111' and c.nombre = 'CrossFit';

insert into public.reservas (gym_id, clase_id, socio_id, fecha, estado, es_prueba)
select '11111111-1111-1111-1111-111111111111', c.id, s.id::text, current_date + 1, 'confirmada', false
from (values ('MS-002'), ('MS-003'), ('MS-005'), ('MS-008'), ('MS-010')) as t(codigo)
join public.socios s on s.gym_id = '11111111-1111-1111-1111-111111111111' and s.codigo = t.codigo
join public.clases c on c.gym_id = '11111111-1111-1111-1111-111111111111' and c.nombre = 'Zumba';

insert into public.reservas (gym_id, clase_id, socio_id, fecha, estado, es_prueba)
select '11111111-1111-1111-1111-111111111111', c.id, s.id::text, current_date + 2, 'confirmada', true
from (values ('MS-004'), ('MS-009')) as t(codigo)
join public.socios s on s.gym_id = '11111111-1111-1111-1111-111111111111' and s.codigo = t.codigo
join public.clases c on c.gym_id = '11111111-1111-1111-1111-111111111111' and c.nombre = 'Boxeo';

insert into public.productos (gym_id, sku, nombre, precio, stock, min_stock, categoria) values
  ('11111111-1111-1111-1111-111111111111', 'SUP-001', 'Proteína Whey 2 lb', 189, 8, 3, 'suplementos'),
  ('11111111-1111-1111-1111-111111111111', 'SUP-002', 'Creatina Monohidratada 300 g', 95, 4, 5, 'suplementos'),
  ('11111111-1111-1111-1111-111111111111', 'SUP-003', 'Barra proteica', 8, 24, 10, 'suplementos'),
  ('11111111-1111-1111-1111-111111111111', 'BEB-001', 'Agua San Mateo 625 ml', 2.5, 48, 24, 'bebidas'),
  ('11111111-1111-1111-1111-111111111111', 'BEB-002', 'Gatorade 500 ml', 6, 18, 12, 'bebidas'),
  ('11111111-1111-1111-1111-111111111111', 'ACC-001', 'Guantes de entrenamiento', 35, 6, 3, 'accesorios'),
  ('11111111-1111-1111-1111-111111111111', 'ACC-002', 'Banda de resistencia', 15, 0, 4, 'accesorios'),
  ('11111111-1111-1111-1111-111111111111', 'ACC-003', 'Toalla deportiva', 20, 10, 4, 'accesorios'),
  ('11111111-1111-1111-1111-111111111111', 'ROP-001', 'Camiseta dry-fit', 45, 15, 5, 'ropa'),
  ('11111111-1111-1111-1111-111111111111', 'ACC-004', 'Shaker 700 ml', 18, 14, 6, 'accesorios');

insert into public.ventas (gym_id, socio_id, fecha, hora, lineas, total, metodo)
select '11111111-1111-1111-1111-111111111111', v.socio_id, current_date, v.hora, v.lineas,
       (select coalesce(sum((l->>'cantidad')::numeric * (l->>'precioUnitario')::numeric), 0) from jsonb_array_elements(v.lineas) l),
       v.metodo
from (values
  (null::uuid, '09:15'::text, jsonb_build_array(
    jsonb_build_object('productoId', (select id from public.productos where sku = 'SUP-003'), 'nombre', 'Barra proteica', 'cantidad', 2, 'precioUnitario', 8),
    jsonb_build_object('productoId', (select id from public.productos where sku = 'BEB-001'), 'nombre', 'Agua San Mateo 625 ml', 'cantidad', 1, 'precioUnitario', 2.5)
  ), 'efectivo'::text),
  ((select id from public.socios where codigo = 'MS-005'), '10:05', jsonb_build_array(
    jsonb_build_object('productoId', (select id from public.productos where sku = 'SUP-001'), 'nombre', 'Proteína Whey 2 lb', 'cantidad', 1, 'precioUnitario', 189)
  ), 'yape'),
  (null::uuid, '10:40', jsonb_build_array(
    jsonb_build_object('productoId', (select id from public.productos where sku = 'ACC-001'), 'nombre', 'Guantes de entrenamiento', 'cantidad', 1, 'precioUnitario', 35),
    jsonb_build_object('productoId', (select id from public.productos where sku = 'ACC-002'), 'nombre', 'Banda de resistencia', 'cantidad', 1, 'precioUnitario', 15)
  ), 'plin'),
  (null::uuid, '11:20', jsonb_build_array(
    jsonb_build_object('productoId', (select id from public.productos where sku = 'BEB-002'), 'nombre', 'Gatorade 500 ml', 'cantidad', 3, 'precioUnitario', 6),
    jsonb_build_object('productoId', (select id from public.productos where sku = 'ACC-004'), 'nombre', 'Shaker 700 ml', 'cantidad', 1, 'precioUnitario', 18)
  ), 'efectivo'),
  (null::uuid, '12:10', jsonb_build_array(
    jsonb_build_object('productoId', (select id from public.productos where sku = 'ROP-001'), 'nombre', 'Camiseta dry-fit', 'cantidad', 1, 'precioUnitario', 45),
    jsonb_build_object('productoId', (select id from public.productos where sku = 'ACC-003'), 'nombre', 'Toalla deportiva', 'cantidad', 1, 'precioUnitario', 20)
  ), 'yape')
) as v(socio_id, hora, lineas, metodo);

insert into public.mediciones (gym_id, socio_id, fecha, peso_kg, grasa_pct, altura_cm, cuello_cm, pecho_cm, cintura_cm, brazo_cm, muslo_cm)
select '11111111-1111-1111-1111-111111111111', s.id, current_date - m.dias_atras, m.peso_kg, m.grasa_pct, m.altura_cm, m.cuello_cm, m.pecho_cm, m.cintura_cm, m.brazo_cm, m.muslo_cm
from (values
  ('MS-001', 90, 85, 24, 165, 40, 104, 96, 35, 58),
  ('MS-001', 60, 83, 22.5, 165, 39.5, 103, 93, 35.5, 57),
  ('MS-001', 30, 81, 20.5, 165, 39, 102, 91, 36, 56.5),
  ('MS-001', 0, 79, 19, 165, 38.5, 101, 90, 36.5, 56),
  ('MS-002', 45, 72, 15, 175, null, null, 80, 33, null),
  ('MS-002', 5, 74, 15.5, 175, null, null, 81, 34, null),
  ('MS-003', 10, 58, 22, 160, null, null, 74, 28, 52)
) as m(codigo, dias_atras, peso_kg, grasa_pct, altura_cm, cuello_cm, pecho_cm, cintura_cm, brazo_cm, muslo_cm)
join public.socios s on s.gym_id = '11111111-1111-1111-1111-111111111111' and s.codigo = m.codigo;

insert into public.logros_definidos (gym_id, nombre, emoji, metrica, umbral) values
  ('11111111-1111-1111-1111-111111111111', 'Racha 7', '🔥', 'racha', 7),
  ('11111111-1111-1111-1111-111111111111', 'Racha 30', '🔥🔥', 'racha', 30),
  ('11111111-1111-1111-1111-111111111111', '100 asistencias', '💯', 'total-asistencias', 100),
  ('11111111-1111-1111-1111-111111111111', 'Madrugador', '🌅', 'tempranero', 10),
  ('11111111-1111-1111-1111-111111111111', 'Constante', '💪', 'asistencias-mes', 12),
  ('11111111-1111-1111-1111-111111111111', 'Veterano', '🏆', 'total-asistencias', 200),
  ('11111111-1111-1111-1111-111111111111', 'Puntual', '🎯', 'tempranero', 30),
  ('11111111-1111-1111-1111-111111111111', 'Frecuente', '⚡', 'asistencias-mes', 20);

insert into public.logros_socio (gym_id, socio_id, logro_id, fecha_conseguido)
select '11111111-1111-1111-1111-111111111111', s.id, l.id, current_date - g.dias_atras
from (values
  ('MS-002', 'Racha 7', 5),
  ('MS-003', '100 asistencias', 20),
  ('MS-008', 'Veterano', 60),
  ('MS-005', 'Constante', 2)
) as g(codigo, logro, dias_atras)
join public.socios s on s.gym_id = '11111111-1111-1111-1111-111111111111' and s.codigo = g.codigo
join public.logros_definidos l on l.gym_id = '11111111-1111-1111-1111-111111111111' and l.nombre = g.logro;

insert into public.cuentas_familiares (gym_id, head_socio_id, miembros)
select '11111111-1111-1111-1111-111111111111', h.id,
  jsonb_build_array(
    jsonb_build_object('socioId', (select id from public.socios where gym_id = '11111111-1111-1111-1111-111111111111' and codigo = 'MS-001'), 'parentesco', 'conyuge'),
    jsonb_build_object('socioId', (select id from public.socios where gym_id = '11111111-1111-1111-1111-111111111111' and codigo = 'MS-010'), 'parentesco', 'hijo'),
    jsonb_build_object('socioId', (select id from public.socios where gym_id = '11111111-1111-1111-1111-111111111111' and codigo = 'MS-006'), 'parentesco', 'hijo')
  )
from public.socios h where h.gym_id = '11111111-1111-1111-1111-111111111111' and h.codigo = 'MS-002';

insert into public.cuentas_familiares (gym_id, head_socio_id, miembros)
select '11111111-1111-1111-1111-111111111111', h.id,
  jsonb_build_array(
    jsonb_build_object('socioId', (select id from public.socios where gym_id = '11111111-1111-1111-1111-111111111111' and codigo = 'MS-004'), 'parentesco', 'conyuge')
  )
from public.socios h where h.gym_id = '11111111-1111-1111-1111-111111111111' and h.codigo = 'MS-005';

insert into public.cuentas_familiares (gym_id, head_socio_id, miembros)
select '11111111-1111-1111-1111-111111111111', h.id,
  jsonb_build_array(
    jsonb_build_object('socioId', (select id from public.socios where gym_id = '11111111-1111-1111-1111-111111111111' and codigo = 'MS-008'), 'parentesco', 'conyuge')
  )
from public.socios h where h.gym_id = '11111111-1111-1111-1111-111111111111' and h.codigo = 'MS-003';

insert into public.facturas_grupo (gym_id, cuenta_id, fecha, items, estado)
select '11111111-1111-1111-1111-111111111111', c.id, current_date - 6,
  jsonb_build_array(
    jsonb_build_object('socioId', (select id from public.socios where gym_id = '11111111-1111-1111-1111-111111111111' and codigo = 'MS-004'), 'concepto', 'membresia', 'monto', 55),
    jsonb_build_object('socioId', (select id from public.socios where gym_id = '11111111-1111-1111-1111-111111111111' and codigo = 'MS-005'), 'concepto', 'membresia', 'monto', 80)
  ),
  'abierta'
from public.cuentas_familiares c
where c.gym_id = '11111111-1111-1111-1111-111111111111'
  and c.head_socio_id = (select id from public.socios where gym_id = '11111111-1111-1111-1111-111111111111' and codigo = 'MS-005');

insert into public.facturas_grupo (gym_id, cuenta_id, fecha, items, estado)
select '11111111-1111-1111-1111-111111111111', c.id, current_date - 90,
  jsonb_build_array(
    jsonb_build_object('socioId', (select id from public.socios where gym_id = '11111111-1111-1111-1111-111111111111' and codigo = 'MS-003'), 'concepto', 'membresia', 'monto', 660),
    jsonb_build_object('socioId', (select id from public.socios where gym_id = '11111111-1111-1111-1111-111111111111' and codigo = 'MS-008'), 'concepto', 'membresia', 'monto', 660)
  ),
  'cobrada'
from public.cuentas_familiares c
where c.gym_id = '11111111-1111-1111-1111-111111111111'
  and c.head_socio_id = (select id from public.socios where gym_id = '11111111-1111-1111-1111-111111111111' and codigo = 'MS-003');

insert into public.solicitudes_resena (gym_id, socio_id, fecha, gatillo)
select '11111111-1111-1111-1111-111111111111', s.id, current_date - g.dias_atras, g.gatillo
from (values
  ('MS-001', 30, 'renovacion'),
  ('MS-003', 120, 'renovacion'),
  ('MS-008', 200, 'renovacion'),
  ('MS-010', 95, 'renovacion')
) as g(codigo, dias_atras, gatillo)
join public.socios s on s.gym_id = '11111111-1111-1111-1111-111111111111' and s.codigo = g.codigo;
