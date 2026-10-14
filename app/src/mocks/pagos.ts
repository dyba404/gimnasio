import { planesMock, sociosMock } from '@/mocks/data'
import type { MetodoPago } from '@/mocks/caja-data'

export type { MetodoPago } from '@/mocks/caja-data'

export type EstadoPago = 'completado' | 'pendiente' | 'anulado'

export type ConceptoPago = 'membresia' | 'inscripcion'

export type Pago = {
  id: string
  fecha: string
  socioId: string
  nombre: string
  codigo: string
  dni: string
  planId: string
  planNombre: string
  monto: number
  metodo: MetodoPago
  estado: EstadoPago
  concepto: ConceptoPago
}

const precioInscripcion = 30

export const etiquetaEstadoPago: Record<EstadoPago, string> = {
  completado: 'Completado',
  pendiente: 'Pendiente',
  anulado: 'Anulado',
}

const HOY = new Date()
HOY.setHours(0, 0, 0, 0)

const DIAS_HISTORIAL = 180

function mulberry32(seed: number): () => number {
  let estado = seed
  return () => {
    estado |= 0
    estado = (estado + 0x6d2b79f5) | 0
    let t = Math.imul(estado ^ (estado >>> 15), 1 | estado)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

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

const metodos: readonly MetodoPago[] = ['efectivo', 'yape', 'plin']

const planesPorId = new Map(planesMock.map((plan) => [plan.id, plan]))

function generarPagos(): Pago[] {
  const rand = mulberry32(20260910)
  const pagos: Pago[] = []
  let secuencia = 0
  for (const [indice, socio] of sociosMock.entries()) {
    const plan = planesPorId.get(socio.planId)
    const cantidad = indice < 4 ? 3 : 2
    for (let i = 0; i < cantidad; i++) {
      const diasAtras = Math.min(DIAS_HISTORIAL - 1, Math.floor(rand() * DIAS_HISTORIAL) + 1)
      const esInscripcion = i === 0 && indice % 4 === 0
      const azar = rand()
      const estado: EstadoPago =
        azar < 0.8 ? 'completado' : azar < 0.92 ? 'pendiente' : 'anulado'
      const metodo = metodos[Math.floor(rand() * metodos.length) % metodos.length]
      secuencia += 1
      pagos.push({
        id: `pago-${String(secuencia).padStart(3, '0')}`,
        fecha: haceDias(diasAtras),
        socioId: socio.id,
        nombre: socio.nombre,
        codigo: socio.codigo,
        dni: socio.dni,
        planId: socio.planId,
        planNombre: plan?.nombre ?? '—',
        monto: esInscripcion ? precioInscripcion : (plan?.precio ?? 0),
        metodo,
        estado,
        concepto: esInscripcion ? 'inscripcion' : 'membresia',
      })
    }
  }
  return pagos.sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0))
}

export const pagosMock: readonly Pago[] = generarPagos()
