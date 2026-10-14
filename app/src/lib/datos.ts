import { clienteSupabase } from '@/lib/supabase'
import type { Clase, DiaSemana, Reserva } from '@/mocks/clases'
import type { MovimientoCaja } from '@/mocks/caja-data'
import type { GestionCobranza } from '@/mocks/bitacora'
import type { Gasto } from '@/mocks/gastos'
import type { Pago } from '@/mocks/pagos'
import type { Referido } from '@/mocks/referidos'
import type { Prospecto } from '@/mocks/prospectos'
import type { Medicion } from '@/mocks/mediciones'
import type { LogroDefinido, LogroSocio } from '@/mocks/logros'
import type { CuentaFamiliar, FacturaGrupo } from '@/mocks/familias'
import type { SolicitudResena } from '@/mocks/resenas'
import type { Asistencia } from '@/mocks/asistencias'
import type { LineaVenta, Producto, Venta } from '@/mocks/pos'
import type { Ingreso } from '@/mocks/caja-data'
import type { ConfigGym, Membresia, Plan, Socio } from '@/mocks/types'

export async function cargarGymId(): Promise<string | null> {
  const cliente = clienteSupabase()
  if (!cliente) return null
  const { data, error } = await cliente.from('gyms').select('id').limit(1)
  if (error || data === null || data.length === 0) return null
  return (data as { id: string }[])[0].id
}

type FilaSocio = {
  id: string
  codigo: string
  nombre: string
  dni: string
  telefono: string
  plan_id: string
  estado: string
  fecha_registro: string
}

function filaASocio(fila: FilaSocio): Socio {
  return {
    id: fila.id,
    codigo: fila.codigo,
    nombre: fila.nombre,
    dni: fila.dni,
    telefono: fila.telefono,
    planId: fila.plan_id,
    estado: fila.estado as Socio['estado'],
    fechaRegistro: fila.fecha_registro,
  }
}

export async function cargarSocios(): Promise<Socio[] | null> {
  const cliente = clienteSupabase()
  if (!cliente) return null
  const { data, error } = await cliente
    .from('socios')
    .select('id,codigo,nombre,dni,telefono,plan_id,estado,fecha_registro')
    .order('nombre')
  if (error || data === null) return null
  return (data as FilaSocio[]).map(filaASocio)
}

type SocioNuevo = {
  codigo: string
  nombre: string
  dni: string
  telefono: string
  planId: string
  estado: string
}

export async function crearSocio(socio: SocioNuevo): Promise<Socio | null> {
  const cliente = clienteSupabase()
  if (!cliente) return null
  const gymId = await cargarGymId()
  if (gymId === null) return null
  const { data, error } = await cliente
    .from('socios')
    .insert({
      gym_id: gymId,
      codigo: socio.codigo,
      nombre: socio.nombre,
      dni: socio.dni,
      telefono: socio.telefono,
      plan_id: socio.planId,
      estado: socio.estado,
    })
    .select('id,codigo,nombre,dni,telefono,plan_id,estado,fecha_registro')
    .single()
  if (error || data === null) return null
  return filaASocio(data as FilaSocio)
}

export async function actualizarSocio(
  id: string,
  cambios: Partial<SocioNuevo>,
): Promise<boolean> {
  const cliente = clienteSupabase()
  if (!cliente) return false
  const { error } = await cliente
    .from('socios')
    .update({
      ...(cambios.nombre !== undefined && { nombre: cambios.nombre }),
      ...(cambios.dni !== undefined && { dni: cambios.dni }),
      ...(cambios.telefono !== undefined && { telefono: cambios.telefono }),
      ...(cambios.planId !== undefined && { plan_id: cambios.planId }),
      ...(cambios.estado !== undefined && { estado: cambios.estado }),
    })
    .eq('id', id)
  return error === null
}

export async function registrarPago(input: {
  socioId: string
  planId: string
  monto: number
  metodo: string
  estado: string
  concepto: string
  socioNombre: string
  hora: string
}): Promise<boolean> {
  const cliente = clienteSupabase()
  if (!cliente) return false
  const gymId = await cargarGymId()
  if (gymId === null) return false
  const { error: errorPago } = await cliente.from('pagos').insert({
    gym_id: gymId,
    socio_id: input.socioId,
    plan_id: input.planId,
    monto: input.monto,
    metodo: input.metodo,
    estado: input.estado,
    concepto: input.concepto,
  })
  if (errorPago) return false
  const { error: errorCaja } = await cliente.from('movimientos_caja').insert({
    gym_id: gymId,
    socio_nombre: input.socioNombre,
    concepto: input.concepto,
    metodo: input.metodo,
    monto: input.monto,
    hora: input.hora,
  })
  return errorCaja === null
}

export async function registrarGasto(input: {
  categoria: string
  descripcion: string
  proveedor: string
  monto: number
}): Promise<boolean> {
  const cliente = clienteSupabase()
  if (!cliente) return false
  const gymId = await cargarGymId()
  if (gymId === null) return false
  const { error } = await cliente.from('gastos').insert({
    gym_id: gymId,
    categoria: input.categoria,
    descripcion: input.descripcion,
    proveedor: input.proveedor,
    monto: input.monto,
  })
  return error === null
}

export async function registrarMovimientoCaja(input: {
  socioNombre: string
  concepto: string
  metodo: string
  monto: number
  hora: string
}): Promise<boolean> {
  const cliente = clienteSupabase()
  if (!cliente) return false
  const gymId = await cargarGymId()
  if (gymId === null) return false
  const { error } = await cliente.from('movimientos_caja').insert({
    gym_id: gymId,
    socio_nombre: input.socioNombre,
    concepto: input.concepto,
    metodo: input.metodo,
    monto: input.monto,
    hora: input.hora,
  })
  return error === null
}

export async function registrarAsistencia(input: {
  socioId: string
  hora: string
}): Promise<boolean> {
  const cliente = clienteSupabase()
  if (!cliente) return false
  const gymId = await cargarGymId()
  if (gymId === null) return false
  const { error } = await cliente.from('asistencias').insert({
    gym_id: gymId,
    socio_id: input.socioId,
    hora: input.hora,
  })
  return error === null
}

export async function registrarGestion(input: {
  socioId: string
  tipo: string
  nota: string
  resultado: string
}): Promise<boolean> {
  const cliente = clienteSupabase()
  if (!cliente) return false
  const gymId = await cargarGymId()
  if (gymId === null) return false
  const { error } = await cliente.from('gestiones_bitacora').insert({
    gym_id: gymId,
    socio_id: input.socioId,
    tipo: input.tipo,
    nota: input.nota,
    resultado: input.resultado,
  })
  return error === null
}

export async function congelarSocio(
  socioId: string,
  congelar: boolean,
): Promise<boolean> {
  const cliente = clienteSupabase()
  if (!cliente) return false
  const { error } = await cliente
    .from('socios')
    .update({ estado: congelar ? 'congelado' : 'activo' })
    .eq('id', socioId)
  return error === null
}

export async function registrarVenta(input: {
  socioId: string | null
  lineas: { productoId: string; nombre: string; cantidad: number; precioUnitario: number }[]
  total: number
  metodo: string
  hora: string
  stockUpdates: { id: string; stock: number }[]
}): Promise<boolean> {
  const cliente = clienteSupabase()
  if (!cliente) return false
  const gymId = await cargarGymId()
  if (gymId === null) return false
  const { error } = await cliente.from('ventas').insert({
    gym_id: gymId,
    socio_id: input.socioId,
    lineas: input.lineas,
    total: input.total,
    metodo: input.metodo,
    hora: input.hora,
  })
  if (error) return false
  for (const s of input.stockUpdates) {
    const { error: errorStock } = await cliente
      .from('productos')
      .update({ stock: s.stock })
      .eq('id', s.id)
    if (errorStock) return false
  }
  return true
}

export async function renovarMembresia(input: {
  membresiaId: string
  fechaFin: string
  estado: string
}): Promise<boolean> {
  const cliente = clienteSupabase()
  if (!cliente) return false
  const { error } = await cliente
    .from('membresias')
    .update({ fecha_fin: input.fechaFin, estado: input.estado })
    .eq('id', input.membresiaId)
  return error === null
}

export async function congelarMembresia(input: {
  membresiaId: string
  desde: string
  hasta: string
}): Promise<boolean> {
  const cliente = clienteSupabase()
  if (!cliente) return false
  const { error } = await cliente
    .from('membresias')
    .update({ congelada_desde: input.desde, congelada_hasta: input.hasta })
    .eq('id', input.membresiaId)
  return error === null
}

export async function reanudarMembresia(input: {
  membresiaId: string
  fechaFin: string
}): Promise<boolean> {
  const cliente = clienteSupabase()
  if (!cliente) return false
  const { error } = await cliente
    .from('membresias')
    .update({
      congelada_desde: null,
      congelada_hasta: null,
      fecha_fin: input.fechaFin,
      estado: calcularEstadoDesde(input.fechaFin),
    })
    .eq('id', input.membresiaId)
  return error === null
}

function calcularEstadoDesde(fechaFin: string): 'vigente' | 'por-vencer' | 'vencida' {
  const [anio, mes, dia] = fechaFin.split('-').map(Number)
  const fin = new Date(anio, (mes ?? 1) - 1, dia ?? 1)
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const dias = Math.round((fin.getTime() - hoy.getTime()) / 86_400_000)
  if (dias < 0) return 'vencida'
  if (dias <= 7) return 'por-vencer'
  return 'vigente'
}

export async function registrarReserva(input: {
  claseId: string
  socioId: string
  fecha: string
  estado: string
  esPrueba: boolean
}): Promise<boolean> {
  const cliente = clienteSupabase()
  if (!cliente) return false
  const gymId = await cargarGymId()
  if (gymId === null) return false
  const { error } = await cliente.from('reservas').insert({
    gym_id: gymId,
    clase_id: input.claseId,
    socio_id: input.socioId,
    fecha: input.fecha,
    estado: input.estado,
    es_prueba: input.esPrueba,
  })
  return error === null
}

export async function registrarReservaCompleta(input: {
  claseId: string
  socioId: string
  fecha: string
  estado: string
  esPrueba: boolean
}): Promise<Reserva | null> {
  const cliente = clienteSupabase()
  if (!cliente) return null
  const gymId = await cargarGymId()
  if (gymId === null) return null
  const { data, error } = await cliente
    .from('reservas')
    .insert({
      gym_id: gymId,
      clase_id: input.claseId,
      socio_id: input.socioId,
      fecha: input.fecha,
      estado: input.estado,
      es_prueba: input.esPrueba,
    })
    .select('id,clase_id,socio_id,fecha,estado,es_prueba')
    .single()
  if (error || data === null) return null
  return filaAReserva(data as FilaReserva)
}

export function siguienteCodigoSocio(codigos: readonly string[]): string {
  const maximo = codigos.reduce((acumulado, codigo) => {
    const coincidencia = /^MS-(\d+)$/.exec(codigo)
    const numero = coincidencia === null ? 0 : Number(coincidencia[1])
    return Math.max(acumulado, numero)
  }, 0)
  return `MS-${String(maximo + 1).padStart(3, '0')}`
}

type FilaPlan = {
  id: string
  nombre: string
  precio: number
  duracion_dias: number
}

export function filaAPlan(fila: FilaPlan): Plan {
  return {
    id: fila.id,
    nombre: fila.nombre,
    precio: Number(fila.precio),
    duracionDias: fila.duracion_dias,
  }
}

export async function cargarPlanes(): Promise<Plan[] | null> {
  const cliente = clienteSupabase()
  if (!cliente) return null
  const { data, error } = await cliente
    .from('planes')
    .select('id,nombre,precio,duracion_dias')
    .order('creado_en')
  if (error || data === null) return null
  return (data as FilaPlan[]).map(filaAPlan)
}

type FilaMembresia = {
  id: string
  socio_id: string
  plan_id: string
  fecha_inicio: string
  fecha_fin: string
  monto: number
  estado: string
  congelada_desde: string | null
  congelada_hasta: string | null
}

export function filaAMembresia(fila: FilaMembresia): Membresia {
  return {
    id: fila.id,
    socioId: fila.socio_id,
    planId: fila.plan_id,
    fechaInicio: fila.fecha_inicio,
    fechaFin: fila.fecha_fin,
    monto: Number(fila.monto),
    estado: fila.estado as Membresia['estado'],
    ...(fila.congelada_desde !== null &&
    fila.congelada_hasta !== null && {
      congelada: { desde: fila.congelada_desde, hasta: fila.congelada_hasta },
    }),
  }
}

export async function cargarMembresias(): Promise<Membresia[] | null> {
  const cliente = clienteSupabase()
  if (!cliente) return null
  const { data, error } = await cliente
    .from('membresias')
    .select(
      'id,socio_id,plan_id,fecha_inicio,fecha_fin,monto,estado,congelada_desde,congelada_hasta',
    )
    .order('fecha_fin')
  if (error || data === null) return null
  return (data as FilaMembresia[]).map(filaAMembresia)
}

type FilaMovimientoCaja = {
  id: string
  hora: string
  socio_nombre: string
  concepto: string
  metodo: string
  monto: number
}

export function filaAMovimientoCaja(fila: FilaMovimientoCaja): MovimientoCaja {
  return {
    id: fila.id,
    hora: fila.hora,
    socioNombre: fila.socio_nombre,
    concepto: fila.concepto as MovimientoCaja['concepto'],
    metodo: fila.metodo as MovimientoCaja['metodo'],
    monto: Number(fila.monto),
  }
}

function fechaHoyIso(): string {
  const hoy = new Date()
  const mes = String(hoy.getMonth() + 1).padStart(2, '0')
  const dia = String(hoy.getDate()).padStart(2, '0')
  return `${hoy.getFullYear()}-${mes}-${dia}`
}

export async function cargarMovimientosCaja(): Promise<MovimientoCaja[] | null> {
  const cliente = clienteSupabase()
  if (!cliente) return null
  const { data, error } = await cliente
    .from('movimientos_caja')
    .select('id,hora,socio_nombre,concepto,metodo,monto')
    .eq('fecha', fechaHoyIso())
    .order('creado_en', { ascending: false })
  if (error || data === null) return null
  return (data as FilaMovimientoCaja[]).map(filaAMovimientoCaja)
}

type FilaGasto = {
  id: string
  categoria: string
  descripcion: string
  proveedor: string
  monto: number
  fecha: string
}

export function filaAGasto(fila: FilaGasto): Gasto {
  return {
    id: fila.id,
    categoria: fila.categoria as Gasto['categoria'],
    descripcion: fila.descripcion,
    proveedor: fila.proveedor,
    monto: Number(fila.monto),
    fecha: fila.fecha,
  }
}

export async function cargarGastos(): Promise<Gasto[] | null> {
  const cliente = clienteSupabase()
  if (!cliente) return null
  const { data, error } = await cliente
    .from('gastos')
    .select('id,categoria,descripcion,proveedor,monto,fecha')
    .order('fecha', { ascending: false })
  if (error || data === null) return null
  return (data as FilaGasto[]).map(filaAGasto)
}

type FilaPago = {
  id: string
  fecha: string
  socio_id: string
  plan_id: string
  monto: number
  metodo: string
  estado: string
  concepto: string
  socios: { nombre: string; codigo: string; dni: string }
  planes: { nombre: string }
}

export function filaAPago(fila: FilaPago): Pago {
  return {
    id: fila.id,
    fecha: fila.fecha,
    socioId: fila.socio_id,
    nombre: fila.socios.nombre,
    codigo: fila.socios.codigo,
    dni: fila.socios.dni,
    planId: fila.plan_id,
    planNombre: fila.planes.nombre,
    monto: Number(fila.monto),
    metodo: fila.metodo as Pago['metodo'],
    estado: fila.estado as Pago['estado'],
    concepto: fila.concepto as Pago['concepto'],
  }
}

export async function cargarPagos(): Promise<Pago[] | null> {
  const cliente = clienteSupabase()
  if (!cliente) return null
  const { data, error } = await cliente
    .from('pagos')
    .select(
      'id,fecha,socio_id,plan_id,monto,metodo,estado,concepto,socios(nombre,codigo,dni),planes(nombre)',
    )
    .order('fecha', { ascending: false })
  if (error || data === null) return null
  return (data as unknown as FilaPago[]).map(filaAPago)
}

type FilaProducto = {
  id: string
  sku: string
  nombre: string
  precio: number
  stock: number
  min_stock: number
  categoria: string
}

export function filaAProducto(fila: FilaProducto): Producto {
  return {
    id: fila.id,
    sku: fila.sku,
    nombre: fila.nombre,
    precio: Number(fila.precio),
    stock: fila.stock,
    minStock: fila.min_stock,
    categoria: fila.categoria as Producto['categoria'],
  }
}

export async function cargarProductos(): Promise<Producto[] | null> {
  const cliente = clienteSupabase()
  if (!cliente) return null
  const { data, error } = await cliente
    .from('productos')
    .select('id,sku,nombre,precio,stock,min_stock,categoria')
    .order('sku')
  if (error || data === null) return null
  return (data as FilaProducto[]).map(filaAProducto)
}

type FilaVenta = {
  id: string
  socio_id: string | null
  fecha: string
  hora: string
  lineas: unknown
  total: number
  metodo: string
}

export function filaAVenta(fila: FilaVenta): Venta {
  return {
    id: fila.id,
    fecha: fila.fecha,
    hora: fila.hora,
    ...(fila.socio_id !== null && { socioId: fila.socio_id }),
    lineas: fila.lineas as LineaVenta[],
    total: Number(fila.total),
    metodo: fila.metodo as Venta['metodo'],
  }
}

export async function cargarVentasHoy(): Promise<Venta[] | null> {
  const cliente = clienteSupabase()
  if (!cliente) return null
  const { data, error } = await cliente
    .from('ventas')
    .select('id,socio_id,fecha,hora,lineas,total,metodo')
    .eq('fecha', fechaHoyIso())
    .order('creado_en', { ascending: false })
  if (error || data === null) return null
  return (data as FilaVenta[]).map(filaAVenta)
}

type FilaClase = {
  id: string
  nombre: string
  instructor: string
  dias: string[]
  hora_inicio: string
  duracion_min: number
  cupo: number
  es_prueba: boolean | null
}

export function filaAClase(fila: FilaClase): Clase {
  return {
    id: fila.id,
    nombre: fila.nombre,
    instructor: fila.instructor,
    dias: fila.dias as readonly DiaSemana[],
    horaInicio: fila.hora_inicio,
    duracionMin: fila.duracion_min,
    cupo: fila.cupo,
    ...(fila.es_prueba === true ? { esPrueba: true } : {}),
  }
}

export async function cargarClases(): Promise<Clase[] | null> {
  const cliente = clienteSupabase()
  if (!cliente) return null
  const { data, error } = await cliente
    .from('clases')
    .select('id,nombre,instructor,dias,hora_inicio,duracion_min,cupo,es_prueba')
    .order('hora_inicio')
  if (error || data === null) return null
  return (data as unknown as FilaClase[]).map(filaAClase)
}

type FilaReserva = {
  id: string
  clase_id: string
  socio_id: string
  fecha: string
  estado: string
  es_prueba: boolean
}

export function filaAReserva(fila: FilaReserva): Reserva {
  return {
    id: fila.id,
    claseId: fila.clase_id,
    socioId: fila.socio_id,
    fecha: fila.fecha,
    estado: fila.estado as Reserva['estado'],
    ...(fila.es_prueba ? { esPrueba: true } : {}),
  }
}

export async function cargarReservas(): Promise<Reserva[] | null> {
  const cliente = clienteSupabase()
  if (!cliente) return null
  const { data, error } = await cliente
    .from('reservas')
    .select('id,clase_id,socio_id,fecha,estado,es_prueba')
    .order('creado_en')
  if (error || data === null) return null
  return (data as FilaReserva[]).map(filaAReserva)
}

export async function cancelarReserva(backend: {
  reservaId: string
}): Promise<boolean> {
  const cliente = clienteSupabase()
  if (!cliente) return false
  const { error } = await cliente
    .from('reservas')
    .update({ estado: 'cancelada' })
    .eq('id', backend.reservaId)
  return error === null
}

export async function confirmarReserva(backend: {
  reservaId: string
}): Promise<boolean> {
  const cliente = clienteSupabase()
  if (!cliente) return false
  const { error } = await cliente
    .from('reservas')
    .update({ estado: 'confirmada' })
    .eq('id', backend.reservaId)
  return error === null
}

type FilaGestion = {
  id: string
  socio_id: string
  tipo: string
  nota: string
  resultado: string
  fecha: string
}

export function filaAGestion(fila: FilaGestion): GestionCobranza {
  return {
    id: fila.id,
    socioId: fila.socio_id,
    tipo: fila.tipo as GestionCobranza['tipo'],
    nota: fila.nota,
    resultado: fila.resultado as GestionCobranza['resultado'],
    fecha: fila.fecha,
  }
}

export async function cargarGestiones(): Promise<GestionCobranza[] | null> {
  const cliente = clienteSupabase()
  if (!cliente) return null
  const { data, error } = await cliente
    .from('gestiones_bitacora')
    .select('id,socio_id,tipo,nota,resultado,fecha')
    .order('fecha', { ascending: false })
  if (error || data === null) return null
  return (data as FilaGestion[]).map(filaAGestion)
}

export async function actualizarReferido(
  referidoId: string,
  estado: string,
): Promise<boolean> {
  const cliente = clienteSupabase()
  if (!cliente) return false
  const { error } = await cliente
    .from('referidos')
    .update({ estado })
    .eq('id', referidoId)
  return error === null
}

type FilaSolicitudResena = {
  id: string
  socio_id: string
  fecha: string
  gatillo: string
}

export function filaASolicitudResena(
  fila: FilaSolicitudResena,
): SolicitudResena {
  return {
    id: fila.id,
    socioId: fila.socio_id,
    fecha: fila.fecha,
    gatillo: fila.gatillo as SolicitudResena['gatillo'],
  }
}

export async function cargarSolicitudesResena(): Promise<
  SolicitudResena[] | null
> {
  const cliente = clienteSupabase()
  if (!cliente) return null
  const { data, error } = await cliente
    .from('solicitudes_resena')
    .select('id,socio_id,fecha,gatillo')
    .order('fecha', { ascending: false })
  if (error || data === null) return null
  return (data as FilaSolicitudResena[]).map(filaASolicitudResena)
}

type FilaConfigGym = {
  nombre: string | null
  yape_numero: string | null
  plin_numero: string | null
  link_pago_culqi: string | null
  link_resena_google: string | null
  qr_permitir_legado: boolean | null
}

export function filaAConfigGym(fila: FilaConfigGym): ConfigGym {
  return {
    ...(fila.nombre !== null && { nombre: fila.nombre }),
    ...(fila.yape_numero !== null && { yapeNumero: fila.yape_numero }),
    ...(fila.plin_numero !== null && { plinNumero: fila.plin_numero }),
    ...(fila.link_pago_culqi !== null && { linkPagoCulqi: fila.link_pago_culqi }),
    ...(fila.link_resena_google !== null && {
      linkResenaGoogle: fila.link_resena_google,
    }),
    ...(fila.qr_permitir_legado !== null && {
      qrPermitirLegado: fila.qr_permitir_legado,
    }),
  }
}

export async function cargarConfigGym(): Promise<ConfigGym | null> {
  const cliente = clienteSupabase()
  if (!cliente) return null
  const { data, error } = await cliente
    .from('gyms')
    .select(
      'nombre,yape_numero,plin_numero,link_pago_culqi,link_resena_google,qr_permitir_legado',
    )
    .limit(1)
  if (error || data === null || data.length === 0) return null
  return filaAConfigGym((data as FilaConfigGym[])[0])
}

export async function actualizarConfigGym(
  cambios: {
    nombre?: string | null
    yapeNumero?: string | null
    plinNumero?: string | null
    linkPagoCulqi?: string | null
    linkResenaGoogle?: string | null
  },
): Promise<boolean> {
  const cliente = clienteSupabase()
  if (!cliente) return false
  const gymId = await cargarGymId()
  if (gymId === null) return false
  const { error } = await cliente
    .from('gyms')
    .update({
      ...(cambios.nombre !== undefined && { nombre: cambios.nombre }),
      ...(cambios.yapeNumero !== undefined && {
        yape_numero: cambios.yapeNumero,
      }),
      ...(cambios.plinNumero !== undefined && {
        plin_numero: cambios.plinNumero,
      }),
      ...(cambios.linkPagoCulqi !== undefined && {
        link_pago_culqi: cambios.linkPagoCulqi,
      }),
      ...(cambios.linkResenaGoogle !== undefined && {
        link_resena_google: cambios.linkResenaGoogle,
      }),
    })
    .eq('id', gymId)
  return error === null
}

export async function contarAsistenciasHoy(): Promise<number | null> {
  const cliente = clienteSupabase()
  if (!cliente) return null
  const { count, error } = await cliente
    .from('asistencias')
    .select('id', { count: 'exact', head: true })
    .eq('fecha', fechaHoyIso())
  if (error || count === null) return null
  return count
}

type FilaIngresoHoy = {
  hora: string | null
  socios: { nombre: string; codigo: string } | null
}

type FilaPagoHoy = {
  creado_en: string
  socios: { nombre: string; codigo: string } | null
}

function horaDeTimestamp(iso: string): string {
  const fecha = new Date(iso)
  return `${String(fecha.getHours()).padStart(2, '0')}:${String(
    fecha.getMinutes(),
  ).padStart(2, '0')}`
}

/**
 * Feed del check-in: ingresos reales de hoy. Asistencias → "aceptado",
 * pagos de hoy → "cobrado", gestiones con nota de denegado → "denegado".
 * Orden descendente por hora (más reciente primero).
 */
export async function cargarIngresosDeHoy(): Promise<Ingreso[] | null> {
  const cliente = clienteSupabase()
  if (!cliente) return null
  const hoy = fechaHoyIso()
  const ingresos: Ingreso[] = []

  const filasAsistencia = await cliente
    .from('asistencias')
    .select('hora,socios(nombre,codigo)')
    .eq('fecha', hoy)
  if (filasAsistencia.error) return null
  let indice = 0
  for (const fila of filasAsistencia.data as unknown as FilaIngresoHoy[]) {
    ingresos.push({
      id: `asistencia-${indice++}`,
      hora: fila.hora ?? '',
      socioNombre: fila.socios?.nombre ?? 'Socio',
      socioCodigo: fila.socios?.codigo ?? '',
      resultado: 'aceptado',
    })
  }

  const filasPago = await cliente
    .from('pagos')
    .select('creado_en,socios(nombre,codigo)')
    .eq('fecha', hoy)
  if (!filasPago.error) {
    for (const fila of filasPago.data as unknown as FilaPagoHoy[]) {
      ingresos.push({
        id: `pago-${indice++}`,
        hora: horaDeTimestamp(fila.creado_en),
        socioNombre: fila.socios?.nombre ?? 'Socio',
        socioCodigo: fila.socios?.codigo ?? '',
        resultado: 'cobrado',
      })
    }
  }

  const filasGestion = await cliente
    .from('gestiones_bitacora')
    .select('hora,nota,socios(nombre,codigo)')
    .eq('fecha', hoy)
  if (!filasGestion.error) {
    for (const fila of filasGestion.data as unknown as (FilaIngresoHoy & {
      nota: string | null
    })[]) {
      if ((fila.nota ?? '').includes('denegado')) {
        ingresos.push({
          id: `denegado-${indice++}`,
          hora: fila.hora ?? '',
          socioNombre: fila.socios?.nombre ?? 'Socio',
          socioCodigo: fila.socios?.codigo ?? '',
          resultado: 'denegado',
          motivo: 'Membresía vencida',
        })
      }
    }
  }

  return ingresos.sort((a, b) => b.hora.localeCompare(a.hora))
}

type FilaAsistenciaSocio = {
  fecha: string
  hora: string | null
}

export function fechaIsoDe(date: Date): string {
  const mes = String(date.getMonth() + 1).padStart(2, '0')
  const dia = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${mes}-${dia}`
}

export function fechaIsoMenosDias(dias: number, desde = new Date()): string {
  const fecha = new Date(desde)
  fecha.setHours(0, 0, 0, 0)
  fecha.setDate(fecha.getDate() - dias)
  return fechaIsoDe(fecha)
}

export async function cargarFechasAsistenciasDeSocio(
  socioId: string,
  dias = 30,
): Promise<string[] | null> {
  const cliente = clienteSupabase()
  if (!cliente) return null
  const limite = fechaIsoMenosDias(Math.max(0, dias - 1))
  const { data, error } = await cliente
    .from('asistencias')
    .select('fecha,hora')
    .eq('socio_id', socioId)
    .gte('fecha', limite)
    .order('fecha', { ascending: false })
  if (error || data === null) return null
  return (data as FilaAsistenciaSocio[]).map((fila) => fila.fecha)
}

export async function cargarUltimaAsistencia(
  socioId: string,
): Promise<string | null> {
  const cliente = clienteSupabase()
  if (!cliente) return null
  const { data, error } = await cliente
    .from('asistencias')
    .select('fecha')
    .eq('socio_id', socioId)
    .order('fecha', { ascending: false })
    .limit(1)
  if (error || data === null || data.length === 0) return null
  return (data as { fecha: string }[])[0].fecha
}

export async function cargarGestionesDeSocio(
  socioId: string,
): Promise<GestionCobranza[] | null> {
  const cliente = clienteSupabase()
  if (!cliente) return null
  const { data, error } = await cliente
    .from('gestiones_bitacora')
    .select('id,socio_id,tipo,nota,resultado,fecha')
    .eq('socio_id', socioId)
    .order('fecha', { ascending: false })
  if (error || data === null) return null
  return (data as FilaGestion[]).map(filaAGestion)
}

export async function crearMembresia(input: {
  socioId: string
  planId: string
  fechaInicio: string
  fechaFin: string
  monto: number
}): Promise<Membresia | null> {
  const cliente = clienteSupabase()
  if (!cliente) return null
  const gymId = await cargarGymId()
  if (gymId === null) return null
  const { data, error } = await cliente
    .from('membresias')
    .insert({
      gym_id: gymId,
      socio_id: input.socioId,
      plan_id: input.planId,
      fecha_inicio: input.fechaInicio,
      fecha_fin: input.fechaFin,
      monto: input.monto,
      estado: 'vigente',
    })
    .select(
      'id,socio_id,plan_id,fecha_inicio,fecha_fin,monto,estado,congelada_desde,congelada_hasta',
    )
    .single()
  if (error || data === null) return null
  return filaAMembresia(data as FilaMembresia)
}

export async function registrarPagoDeSocio(input: {
  socioId: string
  planId: string
  monto: number
  metodo: string
  concepto: string
  socioNombre: string
  hora: string
}): Promise<boolean> {
  const cliente = clienteSupabase()
  if (!cliente) return false
  const gymId = await cargarGymId()
  if (gymId === null) return false
  const { error: errorPago } = await cliente.from('pagos').insert({
    gym_id: gymId,
    socio_id: input.socioId,
    plan_id: input.planId,
    monto: input.monto,
    metodo: input.metodo,
    estado: 'completado',
    concepto: input.concepto,
  })
  if (errorPago) return false
  const { error: errorCaja } = await cliente.from('movimientos_caja').insert({
    gym_id: gymId,
    socio_nombre: input.socioNombre,
    concepto: input.concepto,
    metodo: input.metodo,
    monto: input.monto,
    hora: input.hora,
  })
  return errorCaja === null
}

type FilaReferido = {
  id: string
  referidor_id: string
  referido_id: string
  fecha: string
  estado: string
}

export function filaAReferido(fila: FilaReferido): Referido {
  return {
    id: fila.id,
    referidorId: fila.referidor_id,
    referidoId: fila.referido_id,
    fecha: fila.fecha,
    estado: fila.estado as Referido['estado'],
  }
}

export async function cargarReferidos(): Promise<Referido[] | null> {
  const cliente = clienteSupabase()
  if (!cliente) return null
  const { data, error } = await cliente
    .from('referidos')
    .select('id,referidor_id,referido_id,fecha,estado')
    .order('fecha', { ascending: false })
  if (error || data === null) return null
  return (data as unknown as FilaReferido[]).map(filaAReferido)
}

type FilaProspecto = {
  id: string
  nombre: string
  telefono: string
  fuente: string
  estado: string
  interes: string | null
  valor_potencial_mensual: number
  notas_gestion: unknown
  proxima_accion: unknown
  creado_en: string
}

export function filaAProspecto(fila: FilaProspecto): Prospecto {
  return {
    id: fila.id,
    nombre: fila.nombre,
    telefono: fila.telefono,
    fuente: fila.fuente as Prospecto['fuente'],
    estado: fila.estado as Prospecto['estado'],
    ...(fila.interes !== null && { interes: fila.interes as Prospecto['interes'] }),
    valorPotencialMensual: Number(fila.valor_potencial_mensual),
    notasGestion: (fila.notas_gestion ?? []) as Prospecto['notasGestion'],
    ...(fila.proxima_accion !== null &&
      typeof fila.proxima_accion === 'object' && {
        proximaAccion: fila.proxima_accion as Prospecto['proximaAccion'],
      }),
    creadoEn: fila.creado_en,
  }
}

export async function cargarProspectos(): Promise<Prospecto[] | null> {
  const cliente = clienteSupabase()
  if (!cliente) return null
  const { data, error } = await cliente
    .from('prospectos')
    .select(
      'id,nombre,telefono,fuente,estado,interes,valor_potencial_mensual,notas_gestion,proxima_accion,creado_en',
    )
    .order('creado_en', { ascending: false })
  if (error || data === null) return null
  return (data as FilaProspecto[]).map(filaAProspecto)
}

export async function crearProspecto(borrador: {
  nombre: string
  telefono: string
  fuente: string
  estado: string
  valorPotencialMensual: number
}): Promise<Prospecto | null> {
  const cliente = clienteSupabase()
  if (!cliente) return null
  const gymId = await cargarGymId()
  if (gymId === null) return null
  const { data, error } = await cliente
    .from('prospectos')
    .insert({
      gym_id: gymId,
      nombre: borrador.nombre,
      telefono: borrador.telefono,
      fuente: borrador.fuente,
      estado: borrador.estado,
      valor_potencial_mensual: borrador.valorPotencialMensual,
    })
    .select(
      'id,nombre,telefono,fuente,estado,interes,valor_potencial_mensual,notas_gestion,proxima_accion,creado_en',
    )
    .single()
  if (error || data === null) return null
  return filaAProspecto(data as FilaProspecto)
}

export async function actualizarProspecto(
  id: string,
  cambios: {
    estado?: string
    interes?: string
    notasGestion?: unknown
    proximaAccion?: unknown
  },
): Promise<boolean> {
  const cliente = clienteSupabase()
  if (!cliente) return false
  const { error } = await cliente
    .from('prospectos')
    .update({
      ...(cambios.estado !== undefined && { estado: cambios.estado }),
      ...(cambios.interes !== undefined && { interes: cambios.interes }),
      ...(cambios.notasGestion !== undefined && {
        notas_gestion: cambios.notasGestion,
      }),
      ...(cambios.proximaAccion !== undefined && {
        proxima_accion: cambios.proximaAccion,
      }),
    })
    .eq('id', id)
  return error === null
}

type FilaMedicion = {
  socio_id: string
  fecha: string
  peso_kg: number | null
  grasa_pct: number | null
  altura_cm: number | null
  cuello_cm: number | null
  pecho_cm: number | null
  cintura_cm: number | null
  brazo_cm: number | null
  muslo_cm: number | null
}

export function filaAMedicion(fila: FilaMedicion): Medicion {
  return {
    socioId: fila.socio_id,
    fecha: fila.fecha,
    ...(fila.peso_kg !== null && { pesoKg: Number(fila.peso_kg) }),
    ...(fila.grasa_pct !== null && { grasaPct: Number(fila.grasa_pct) }),
    ...(fila.altura_cm !== null && { alturaCm: Number(fila.altura_cm) }),
    ...(fila.cuello_cm !== null && { cuelloCm: Number(fila.cuello_cm) }),
    ...(fila.pecho_cm !== null && { pechoCm: Number(fila.pecho_cm) }),
    ...(fila.cintura_cm !== null && { cinturaCm: Number(fila.cintura_cm) }),
    ...(fila.brazo_cm !== null && { brazoCm: Number(fila.brazo_cm) }),
    ...(fila.muslo_cm !== null && { musloCm: Number(fila.muslo_cm) }),
  }
}

export async function cargarMedicionesDeSocio(
  socioId: string,
): Promise<Medicion[] | null> {
  const cliente = clienteSupabase()
  if (!cliente) return null
  const { data, error } = await cliente
    .from('mediciones')
    .select(
      'socio_id,fecha,peso_kg,grasa_pct,altura_cm,cuello_cm,pecho_cm,cintura_cm,brazo_cm,muslo_cm',
    )
    .eq('socio_id', socioId)
    .order('fecha', { ascending: true })
  if (error || data === null) return null
  return (data as FilaMedicion[]).map(filaAMedicion)
}

type FilaLogroDefinido = {
  id: string
  nombre: string
  emoji: string
  metrica: string
  umbral: number
}

export function filaALogroDefinido(fila: FilaLogroDefinido): LogroDefinido {
  return {
    id: fila.id,
    nombre: fila.nombre,
    emoji: fila.emoji,
    metrica: fila.metrica as LogroDefinido['metrica'],
    umbral: fila.umbral,
  }
}

type FilaLogroSocio = {
  socio_id: string
  logro_id: string
  fecha_conseguido: string
}

export function filaALogroSocio(fila: FilaLogroSocio): LogroSocio {
  return {
    socioId: fila.socio_id,
    logroId: fila.logro_id,
    fechaConseguido: fila.fecha_conseguido,
  }
}

export async function cargarLogros(): Promise<{
  definidos: LogroDefinido[]
  conseguidos: LogroSocio[]
} | null> {
  const cliente = clienteSupabase()
  if (!cliente) return null
  const [definidosRes, conseguidosRes] = await Promise.all([
    cliente
      .from('logros_definidos')
      .select('id,nombre,emoji,metrica,umbral')
      .order('umbral'),
    cliente
      .from('logros_socio')
      .select('socio_id,logro_id,fecha_conseguido'),
  ])
  if (definidosRes.error || definidosRes.data === null) return null
  if (conseguidosRes.error || conseguidosRes.data === null) return null
  return {
    definidos: (definidosRes.data as FilaLogroDefinido[]).map(filaALogroDefinido),
    conseguidos: (conseguidosRes.data as FilaLogroSocio[]).map(filaALogroSocio),
  }
}

type FilaCuentaFamiliar = {
  id: string
  head_socio_id: string
  miembros: unknown
}

export function filaACuentaFamiliar(fila: FilaCuentaFamiliar): CuentaFamiliar {
  return {
    id: fila.id,
    headSocioId: fila.head_socio_id,
    miembros: (fila.miembros ?? []) as CuentaFamiliar['miembros'],
  }
}

type FilaFacturaGrupo = {
  id: string
  cuenta_id: string
  fecha: string
  items: unknown
  estado: string
}

export function filaAFacturaGrupo(fila: FilaFacturaGrupo): FacturaGrupo {
  return {
    id: fila.id,
    cuentaId: fila.cuenta_id,
    fecha: fila.fecha,
    items: (fila.items ?? []) as FacturaGrupo['items'],
    estado: fila.estado as FacturaGrupo['estado'],
  }
}

export async function cargarFamilias(): Promise<{
  cuentas: CuentaFamiliar[]
  facturas: FacturaGrupo[]
} | null> {
  const cliente = clienteSupabase()
  if (!cliente) return null
  const [cuentasRes, facturasRes] = await Promise.all([
    cliente.from('cuentas_familiares').select('id,head_socio_id,miembros'),
    cliente.from('facturas_grupo').select('id,cuenta_id,fecha,items,estado'),
  ])
  if (cuentasRes.error || cuentasRes.data === null) return null
  if (facturasRes.error || facturasRes.data === null) return null
  return {
    cuentas: (cuentasRes.data as FilaCuentaFamiliar[]).map(filaACuentaFamiliar),
    facturas: (facturasRes.data as FilaFacturaGrupo[]).map(filaAFacturaGrupo),
  }
}

export async function contarPagosDeHoy(): Promise<{
  monto: number
  cantidad: number
} | null> {
  const cliente = clienteSupabase()
  if (!cliente) return null
  const { data, error } = await cliente
    .from('pagos')
    .select('monto,estado')
    .eq('fecha', fechaHoyIso())
  if (error || data === null) return null
  const completados = (data as { monto: number; estado: string }[]).filter(
    (fila) => fila.estado === 'completado',
  )
  return {
    monto: completados.reduce((suma, fila) => suma + Number(fila.monto), 0),
    cantidad: completados.length,
  }
}

export async function registrarCobroMembresia(input: {
  socioId: string
  socioNombre: string
  planId: string
  membresiaId: string
  fechaFin: string
  monto: number
  metodo: string
  hora: string
  estadoSocio: string
}): Promise<boolean> {
  const pagoOk = await registrarPagoDeSocio({
    socioId: input.socioId,
    planId: input.planId,
    monto: input.monto,
    metodo: input.metodo,
    concepto: 'membresia',
    socioNombre: input.socioNombre,
    hora: input.hora,
  })
  if (!pagoOk) return false
  const membresiaOk = await renovarMembresia({
    membresiaId: input.membresiaId,
    fechaFin: input.fechaFin,
    estado: 'vigente',
  })
  if (!membresiaOk) return false
  if (input.estadoSocio === 'moroso') {
    const socioOk = await actualizarSocio(input.socioId, { estado: 'activo' })
    if (!socioOk) return false
  }
  return true
}

type FilaAsistenciaReciente = {
  socio_id: string
  fecha: string
  hora: string | null
}

export function filaAAsistenciaReciente(
  fila: FilaAsistenciaReciente,
): Asistencia {
  return {
    socioId: fila.socio_id,
    fecha: fila.fecha,
    ...(fila.hora !== null && { hora: fila.hora }),
  }
}

export async function cargarAsistenciasRecientes(
  limite = 50,
  desde?: string,
): Promise<Asistencia[] | null> {
  const cliente = clienteSupabase()
  if (!cliente) return null
  let consulta = cliente
    .from('asistencias')
    .select('socio_id,fecha,hora')
    .order('creado_en', { ascending: false })
    .limit(Math.max(1, limite))
  if (desde !== undefined) {
    consulta = consulta.gte('fecha', desde)
  }
  const { data, error } = await consulta
  if (error || data === null) return null
  return (data as FilaAsistenciaReciente[]).map(filaAAsistenciaReciente)
}
