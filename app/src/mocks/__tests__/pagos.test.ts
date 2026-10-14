import { describe, expect, it } from 'vitest'
import { pagosMock, etiquetaEstadoPago } from '../pagos'
import { planesMock, sociosMock } from '@/mocks/data'
import type { EstadoPago, Pago } from '../pagos'

const estadosValidos: readonly EstadoPago[] = ['completado', 'pendiente', 'anulado']
const HOY = new Date()
HOY.setHours(0, 0, 0, 0)

describe('pagosMock (seed determinista)', () => {
  it('genera ~25 pagos (24-36) cubriendo los 12 socios', () => {
    expect(pagosMock.length).toBeGreaterThanOrEqual(24)
    expect(pagosMock.length).toBeLessThanOrEqual(36)
    const sociosEnPagos = new Set(pagosMock.map((pago) => pago.socioId))
    expect(sociosEnPagos.size).toBe(sociosMock.length)
  })

  it('es determinista: el módulo produce la misma lista (ids únicos y orden fijo)', () => {
    const ids = pagosMock.map((pago) => pago.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (let i = 1; i < pagosMock.length; i++) {
      expect(pagosMock[i - 1]!.fecha >= pagosMock[i]!.fecha).toBe(true)
    }
  })

  it('cada pago tiene socio real (join por socioId) y plan coherente', () => {
    for (const pago of pagosMock) {
      const socio = sociosMock.find((s) => s.id === pago.socioId)
      expect(socio).toBeDefined()
      expect(pago.nombre).toBe(socio?.nombre)
      expect(pago.codigo).toBe(socio?.codigo)
      expect(pago.dni).toBe(socio?.dni)
      expect(pago.planId).toBe(socio?.planId)
      const plan = planesMock.find((p) => p.id === pago.planId)
      expect(pago.planNombre).toBe(plan?.nombre)
    }
  })

  it('monto = precio del plan (membresía) o inscripción fija', () => {
    for (const pago of pagosMock) {
      if (pago.concepto === 'inscripcion') {
        expect(pago.monto).toBe(30)
      } else {
        const plan = planesMock.find((p) => p.id === pago.planId)
        expect(pago.monto).toBe(plan?.precio ?? 0)
      }
      expect(pago.monto).toBeGreaterThan(0)
    }
  })

  it('estados y métodos siempre válidos, mayoría completado', () => {
    for (const pago of pagosMock) {
      expect(estadosValidos).toContain(pago.estado)
      expect(['efectivo', 'yape', 'plin']).toContain(pago.metodo)
    }
    const completados = pagosMock.filter((pago) => pago.estado === 'completado').length
    expect(completados / pagosMock.length).toBeGreaterThan(0.6)
  })

  it('fechas ISO dentro de los últimos 6 meses', () => {
    const limite = new Date(HOY)
    limite.setDate(limite.getDate() - 180)
    for (const pago of pagosMock) {
      expect(pago.fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      const fecha = new Date(`${pago.fecha}T00:00:00`)
      expect(fecha.getTime()).toBeLessThanOrEqual(HOY.getTime())
      expect(fecha.getTime()).toBeGreaterThanOrEqual(limite.getTime())
    }
  })

  it('etiquetas de estado en español', () => {
    expect(etiquetaEstadoPago).toEqual({
      completado: 'Completado',
      pendiente: 'Pendiente',
      anulado: 'Anulado',
    })
  })

  it('los pagos son buscables por nombre/código/dni (contrato con buscarSocios)', () => {
    for (const pago of pagosMock satisfies readonly Pago[]) {
      expect(typeof pago.nombre).toBe('string')
      expect(pago.codigo).toMatch(/^MS-\d{3}$/)
      expect(pago.dni).toMatch(/^\d{8}$/)
    }
  })
})
