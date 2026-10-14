import type { EstadoPago, MetodoPago, Pago } from '@/mocks/pagos'

export type IngresoMes = {
  clave: string
  etiqueta: string
  total: number
  cantidad: number
}

export type ResumenMetodo = {
  metodo: MetodoPago
  cantidad: number
  total: number
  porcentaje: number
}

export type ResumenPlan = {
  planId: string
  planNombre: string
  cantidad: number
  total: number
}

const MESES = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
] as const

export function esIngreso(pago: Pago): boolean {
  return pago.estado === 'completado'
}

export function filtrarPorDias(
  pagos: readonly Pago[],
  dias: number,
  hoy: Date = new Date(),
): Pago[] {
  const limite = new Date(hoy)
  limite.setHours(0, 0, 0, 0)
  limite.setDate(limite.getDate() - dias)
  return pagos.filter((pago) => new Date(`${pago.fecha}T00:00:00`) >= limite)
}

export function agregarPorMes(pagos: readonly Pago[]): IngresoMes[] {
  const acumulado = new Map<string, { total: number; cantidad: number; anio: number; mes: number }>()
  for (const pago of pagos) {
    if (!esIngreso(pago)) continue
    const [anio, mes] = pago.fecha.split('-').map(Number)
    const clave = `${anio}-${String(mes).padStart(2, '0')}`
    const previo = acumulado.get(clave) ?? { total: 0, cantidad: 0, anio: anio ?? 0, mes: mes ?? 1 }
    previo.total += pago.monto
    previo.cantidad += 1
    acumulado.set(clave, previo)
  }
  return [...acumulado.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([clave, dato]) => ({
      clave,
      etiqueta: `${MESES[dato.mes - 1] ?? 'Ene'} ${String(dato.anio).slice(2)}`,
      total: dato.total,
      cantidad: dato.cantidad,
    }))
}

const metodos: readonly MetodoPago[] = ['efectivo', 'yape', 'plin']

export function agregarPorMetodo(pagos: readonly Pago[]): ResumenMetodo[] {
  const ingresos = pagos.filter(esIngreso)
  const totalGeneral = ingresos.reduce((suma, pago) => suma + pago.monto, 0)
  return metodos.map((metodo) => {
    const delMetodo = ingresos.filter((pago) => pago.metodo === metodo)
    const total = delMetodo.reduce((suma, pago) => suma + pago.monto, 0)
    return {
      metodo,
      cantidad: delMetodo.length,
      total,
      porcentaje: totalGeneral > 0 ? Math.round((total / totalGeneral) * 100) : 0,
    }
  })
}

export function agregarPorPlan(pagos: readonly Pago[]): ResumenPlan[] {
  const acumulado = new Map<string, ResumenPlan>()
  for (const pago of pagos) {
    if (!esIngreso(pago)) continue
    const previo =
      acumulado.get(pago.planId) ??
      { planId: pago.planId, planNombre: pago.planNombre, cantidad: 0, total: 0 }
    previo.cantidad += 1
    previo.total += pago.monto
    acumulado.set(pago.planId, previo)
  }
  return [...acumulado.values()].sort((a, b) => b.total - a.total)
}

export function totalMesEnCurso(pagos: readonly Pago[], hoy: Date = new Date()): number {
  const clave = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`
  return pagos
    .filter((pago) => esIngreso(pago) && pago.fecha.startsWith(clave))
    .reduce((suma, pago) => suma + pago.monto, 0)
}

export function ticketPromedio(pagos: readonly Pago[]): number {
  const ingresos = pagos.filter(esIngreso)
  if (ingresos.length === 0) return 0
  const total = ingresos.reduce((suma, pago) => suma + pago.monto, 0)
  return total / ingresos.length
}

export function contarPorEstado(pagos: readonly Pago[], estado: EstadoPago): number {
  return pagos.filter((pago) => pago.estado === estado).length
}

function escaparCsv(valor: string): string {
  if (/[",\n\r]/.test(valor)) {
    return `"${valor.replace(/"/g, '""')}"`
  }
  return valor
}

export function aCsv(pagos: readonly Pago[]): string {
  const cabecera = ['Fecha', 'Socio', 'Codigo', 'Plan', 'Metodo', 'Monto', 'Estado', 'Concepto']
  const lineas = pagos.map((pago) =>
    [
      pago.fecha,
      pago.nombre,
      pago.codigo,
      pago.planNombre,
      pago.metodo,
      pago.monto.toFixed(2),
      pago.estado,
      pago.concepto,
    ]
      .map((campo) => escaparCsv(String(campo)))
      .join(','),
  )
  return [cabecera.join(','), ...lineas].join('\r\n')
}

export function descargarCsv(nombre: string, contenido: string): void {
  const blob = new Blob([`\uFEFF${contenido}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombre
  enlace.click()
  URL.revokeObjectURL(url)
}
