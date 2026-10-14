import { fechaHoyIso } from './bitacora'
import type { ConceptoCobro } from './caja-data'
import { diasParaVencer, membresiasMock, sociosMock, sumarDiasIso } from './data'
import type { Membresia } from './types'

export { membresiasMock, sociosMock }

export type Parentesco = 'conyuge' | 'hijo' | 'otro'

export type MiembroFamiliar = {
  socioId: string
  parentesco: Parentesco
}

export type CuentaFamiliar = {
  id: string
  headSocioId: string
  miembros: readonly MiembroFamiliar[]
}

export type ItemFacturaGrupo = {
  socioId: string
  concepto: ConceptoCobro
  monto: number
}

export type FacturaGrupo = {
  id: string
  cuentaId: string
  fecha: string
  items: readonly ItemFacturaGrupo[]
  estado: 'abierta' | 'cobrada'
}

export const etiquetaParentesco: Record<Parentesco, string> = {
  conyuge: 'Cónyuge',
  hijo: 'Hijo(a)',
  otro: 'Otro',
}

export function cuentaDe(
  familias: readonly CuentaFamiliar[],
  socioId: string,
): CuentaFamiliar | undefined {
  for (const cuenta of familias) {
    if (cuenta.headSocioId === socioId) return cuenta
    if (cuenta.miembros.some((miembro) => miembro.socioId === socioId)) {
      return cuenta
    }
  }
  return undefined
}

export function membresiasDeCuenta(
  cuenta: CuentaFamiliar,
  membresias: readonly Membresia[],
): readonly Membresia[] {
  const ids = new Set([cuenta.headSocioId, ...cuenta.miembros.map((m) => m.socioId)])
  return membresias.filter((membresia) => ids.has(membresia.socioId))
}

export function totalFactura(factura: FacturaGrupo): number {
  return factura.items.reduce((total, item) => total + item.monto, 0)
}

function aFechaLocal(iso: string): Date {
  const [anio, mes, dia] = iso.split('-').map(Number)
  const fecha = new Date(anio ?? 0, (mes ?? 1) - 1, dia ?? 1)
  if (Number.isNaN(fecha.getTime())) {
    throw new RangeError(`fecha inválida: ${iso}`)
  }
  return fecha
}

export function familiaVencida(
  cuenta: CuentaFamiliar,
  membresias: readonly Membresia[],
  hoyIso: string,
): boolean {
  const hoy = aFechaLocal(hoyIso)
  return membresiasDeCuenta(cuenta, membresias).some(
    (membresia) => diasParaVencer(membresia.fechaFin, hoy) < 0,
  )
}

export const familiasMock: readonly CuentaFamiliar[] = [
  {
    id: 'fam-gomez',
    headSocioId: 'soc-02',
    miembros: [
      { socioId: 'soc-01', parentesco: 'conyuge' },
      { socioId: 'soc-10', parentesco: 'hijo' },
      { socioId: 'soc-06', parentesco: 'hijo' },
    ],
  },
  {
    id: 'fam-rojas',
    headSocioId: 'soc-05',
    miembros: [{ socioId: 'soc-04', parentesco: 'conyuge' }],
  },
  {
    id: 'fam-belaunde',
    headSocioId: 'soc-03',
    miembros: [{ socioId: 'soc-08', parentesco: 'conyuge' }],
  },
]

const hoy = fechaHoyIso()

export const facturasMock: readonly FacturaGrupo[] = [
  {
    id: 'fac-rojas-01',
    cuentaId: 'fam-rojas',
    fecha: sumarDiasIso(hoy, -6),
    items: [
      { socioId: 'soc-04', concepto: 'membresia', monto: 55 },
      { socioId: 'soc-05', concepto: 'membresia', monto: 80 },
    ],
    estado: 'abierta',
  },
  {
    id: 'fac-belaunde-01',
    cuentaId: 'fam-belaunde',
    fecha: sumarDiasIso(hoy, -90),
    items: [
      { socioId: 'soc-03', concepto: 'membresia', monto: 660 },
      { socioId: 'soc-08', concepto: 'membresia', monto: 660 },
    ],
    estado: 'cobrada',
  },
]
