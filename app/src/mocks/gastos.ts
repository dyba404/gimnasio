export type CategoriaGasto =
  | 'alquiler'
  | 'servicios'
  | 'sueldos'
  | 'equipamiento'
  | 'marketing'
  | 'otros'

export type Gasto = {
  id: string
  categoria: CategoriaGasto
  descripcion: string
  proveedor: string
  monto: number
  fecha: string
}

export type ResumenCategoriaGasto = {
  categoria: CategoriaGasto
  etiqueta: string
  cantidad: number
  total: number
}

export type GastoMes = {
  clave: string
  etiqueta: string
  total: number
  cantidad: number
}

export const CATEGORIAS_GASTO: readonly CategoriaGasto[] = [
  'alquiler',
  'servicios',
  'sueldos',
  'equipamiento',
  'marketing',
  'otros',
]

export const etiquetaCategoria: Record<CategoriaGasto, string> = {
  alquiler: 'Alquiler',
  servicios: 'Servicios',
  sueldos: 'Sueldos',
  equipamiento: 'Equipamiento',
  marketing: 'Marketing',
  otros: 'Otros',
}

export const coloresCategoria: Record<CategoriaGasto, string> = {
  alquiler: '#0ea5e9',
  servicios: '#14b8a6',
  sueldos: '#8b5cf6',
  equipamiento: '#f59e0b',
  marketing: '#ec4899',
  otros: '#64748b',
}

const HOY = new Date()
HOY.setHours(0, 0, 0, 0)

function aIso(fecha: Date): string {
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

function haceDias(dias: number): string {
  const fecha = new Date(HOY)
  fecha.setDate(fecha.getDate() - dias)
  return aIso(fecha)
}

type SemillaGasto = Omit<Gasto, 'fecha'> & { diasAtras: number }

const SEMILLA: readonly SemillaGasto[] = [
  { id: 'gasto-001', categoria: 'alquiler', descripcion: 'Alquiler del local', proveedor: 'Inmobiliaria Salazar', monto: 3500, diasAtras: 3 },
  { id: 'gasto-002', categoria: 'sueldos', descripcion: 'Sueldo recepcionista María Flores', proveedor: 'María Flores Quispe', monto: 1200, diasAtras: 5 },
  { id: 'gasto-003', categoria: 'sueldos', descripcion: 'Sueldo recepcionista Carlos Ramos', proveedor: 'Carlos Ramos Vilca', monto: 1200, diasAtras: 5 },
  { id: 'gasto-004', categoria: 'marketing', descripcion: 'Pauta de Instagram Ads', proveedor: 'Meta Platforms Ireland', monto: 200, diasAtras: 6 },
  { id: 'gasto-005', categoria: 'servicios', descripcion: 'Recibo de luz del local', proveedor: 'Luz del Sur', monto: 450, diasAtras: 8 },
  { id: 'gasto-006', categoria: 'servicios', descripcion: 'Limpieza semanal del gym', proveedor: 'Brillo Total S.A.C.', monto: 300, diasAtras: 10 },
  { id: 'gasto-007', categoria: 'servicios', descripcion: 'Recibo de agua del local', proveedor: 'SEDAPAL', monto: 180, diasAtras: 12 },
  { id: 'gasto-008', categoria: 'otros', descripcion: 'Insumos de limpieza e higiene', proveedor: 'Comercial Sport S.A.C.', monto: 150, diasAtras: 15 },
  { id: 'gasto-009', categoria: 'servicios', descripcion: 'Internet dedicado del gym', proveedor: 'Movistar Empresas', monto: 120, diasAtras: 16 },
  { id: 'gasto-010', categoria: 'equipamiento', descripcion: 'Mantenimiento de cintas y máquinas', proveedor: 'Fitness Service E.I.R.L.', monto: 350, diasAtras: 20 },
  { id: 'gasto-011', categoria: 'alquiler', descripcion: 'Alquiler del local', proveedor: 'Inmobiliaria Salazar', monto: 3500, diasAtras: 33 },
  { id: 'gasto-012', categoria: 'sueldos', descripcion: 'Sueldo recepcionista María Flores', proveedor: 'María Flores Quispe', monto: 1200, diasAtras: 36 },
  { id: 'gasto-013', categoria: 'sueldos', descripcion: 'Sueldo recepcionista Carlos Ramos', proveedor: 'Carlos Ramos Vilca', monto: 1200, diasAtras: 36 },
  { id: 'gasto-014', categoria: 'servicios', descripcion: 'Recibo de luz del local', proveedor: 'Luz del Sur', monto: 465, diasAtras: 37 },
  { id: 'gasto-015', categoria: 'equipamiento', descripcion: 'Repuesto de bici de spinning', proveedor: 'Refacción Deportiva E.I.R.L.', monto: 260, diasAtras: 55 },
  { id: 'gasto-016', categoria: 'alquiler', descripcion: 'Alquiler del local', proveedor: 'Inmobiliaria Salazar', monto: 3500, diasAtras: 63 },
]

function generarGastos(): Gasto[] {
  return SEMILLA.map((semilla) => ({
    id: semilla.id,
    categoria: semilla.categoria,
    descripcion: semilla.descripcion,
    proveedor: semilla.proveedor,
    monto: semilla.monto,
    fecha: haceDias(semilla.diasAtras),
  })).sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0))
}

export const gastosMock: readonly Gasto[] = generarGastos()

export function filtrarGastosPorDias(
  gastos: readonly Gasto[],
  dias: number,
  hoy: Date = new Date(),
): Gasto[] {
  const limite = new Date(hoy)
  limite.setHours(0, 0, 0, 0)
  limite.setDate(limite.getDate() - dias)
  return gastos.filter((gasto) => new Date(`${gasto.fecha}T00:00:00`) >= limite)
}

export function totalGastos(gastos: readonly Gasto[], rangoDias?: number): number {
  const lista =
    rangoDias === undefined ? gastos : filtrarGastosPorDias(gastos, rangoDias)
  return lista.reduce((suma, gasto) => suma + gasto.monto, 0)
}

export function gastosPorCategoria(gastos: readonly Gasto[]): ResumenCategoriaGasto[] {
  const acumulado = new Map<CategoriaGasto, { cantidad: number; total: number }>()
  for (const gasto of gastos) {
    const previo = acumulado.get(gasto.categoria) ?? { cantidad: 0, total: 0 }
    previo.cantidad += 1
    previo.total += gasto.monto
    acumulado.set(gasto.categoria, previo)
  }
  return [...acumulado.entries()]
    .map(([categoria, dato]) => ({
      categoria,
      etiqueta: etiquetaCategoria[categoria],
      cantidad: dato.cantidad,
      total: dato.total,
    }))
    .sort((a, b) => b.total - a.total)
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

export function gastosPorMes(gastos: readonly Gasto[]): GastoMes[] {
  const acumulado = new Map<string, { total: number; cantidad: number; anio: number; mes: number }>()
  for (const gasto of gastos) {
    const [anio, mes] = gasto.fecha.split('-').map(Number)
    const clave = `${anio}-${String(mes).padStart(2, '0')}`
    const previo = acumulado.get(clave) ?? { total: 0, cantidad: 0, anio: anio ?? 0, mes: mes ?? 1 }
    previo.total += gasto.monto
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
