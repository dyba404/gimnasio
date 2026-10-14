import { describe, expect, it } from 'vitest'
import { combinarFlujo } from '../logica-flujo'
import type { GastoMes } from '@/mocks/gastos'
import type { IngresoMes } from '@/components/pagos/logica-pagos'

const ingreso = (clave: string, etiqueta: string, total: number, cantidad = 1): IngresoMes => ({
  clave,
  etiqueta,
  total,
  cantidad,
})

const gasto = (clave: string, etiqueta: string, total: number, cantidad = 1): GastoMes => ({
  clave,
  etiqueta,
  total,
  cantidad,
})

describe('combinarFlujo', () => {
  it('mezcla ingresos y gastos por clave de mes, calcula utilidad', () => {
    const ingresos = [ingreso('2026-08', 'Ago 26', 100), ingreso('2026-09', 'Sep 26', 300, 2)]
    const gastos = [gasto('2026-09', 'Sep 26', 150, 3)]
    expect(combinarFlujo(ingresos, gastos)).toEqual([
      { clave: '2026-08', etiqueta: 'Ago 26', ingresos: 100, gastos: 0, utilidad: 100 },
      { clave: '2026-09', etiqueta: 'Sep 26', ingresos: 300, gastos: 150, utilidad: 150 },
    ])
  })

  it('mes con gastos y sin ingresos da utilidad negativa', () => {
    const ingresos = [ingreso('2026-08', 'Ago 26', 500)]
    const gastos = [gasto('2026-09', 'Sep 26', 200)]
    const flujo = combinarFlujo(ingresos, gastos)
    const septiembre = flujo.find((mes) => mes.clave === '2026-09')
    expect(septiembre).toEqual({
      clave: '2026-09',
      etiqueta: 'Sep 26',
      ingresos: 0,
      gastos: 200,
      utilidad: -200,
    })
  })

  it('orden ascendente por clave aunque las listas vengan desordenadas', () => {
    const ingresos = [ingreso('2026-09', 'Sep 26', 10), ingreso('2026-07', 'Jul 26', 20)]
    const gastos = [gasto('2026-08', 'Ago 26', 5)]
    expect(combinarFlujo(ingresos, gastos).map((mes) => mes.clave)).toEqual([
      '2026-07',
      '2026-08',
      '2026-09',
    ])
  })

  it('devuelve [] sin movimientos', () => {
    expect(combinarFlujo([], [])).toEqual([])
  })
})
