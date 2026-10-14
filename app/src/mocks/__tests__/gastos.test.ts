import { describe, expect, it } from 'vitest'
import {
  coloresCategoria,
  CATEGORIAS_GASTO,
  etiquetaCategoria,
  filtrarGastosPorDias,
  gastosMock,
  gastosPorCategoria,
  gastosPorMes,
  totalGastos,
} from '../gastos'
import type { Gasto } from '../gastos'

const HOY = new Date()
HOY.setHours(0, 0, 0, 0)

function isoHace(dias: number): string {
  const fecha = new Date(HOY)
  fecha.setDate(fecha.getDate() - dias)
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${fecha.getFullYear()}-${mes}-${dia}`
}

function gasto(par: Partial<Gasto>): Gasto {
  return {
    id: 'g-prueba',
    categoria: 'otros',
    descripcion: 'Gasto de prueba',
    proveedor: 'Proveedor S.A.C.',
    monto: 100,
    fecha: isoHace(1),
    ...par,
  }
}

describe('gastosMock (fechas relativas fijas)', () => {
  it('tiene ~14 gastos (14-18) cubriendo los últimos 3 meses', () => {
    expect(gastosMock.length).toBeGreaterThanOrEqual(14)
    expect(gastosMock.length).toBeLessThanOrEqual(18)
  })

  it('es determinista: ids únicos, orden fijo por fecha desc y semilla con offset fijo', () => {
    const ids = gastosMock.map((gasto) => gasto.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (let i = 1; i < gastosMock.length; i++) {
      expect(gastosMock[i - 1]!.fecha >= gastosMock[i]!.fecha).toBe(true)
    }
    expect(gastosMock[0]?.id).toBe('gasto-001')
  })

  it('fechas ISO dentro de los últimos ~3 meses y nunca futuras', () => {
    const limite = new Date(HOY)
    limite.setDate(limite.getDate() - 92)
    for (const gasto of gastosMock) {
      expect(gasto.fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      const fecha = new Date(`${gasto.fecha}T00:00:00`)
      expect(fecha.getTime()).toBeLessThanOrEqual(HOY.getTime())
      expect(fecha.getTime()).toBeGreaterThanOrEqual(limite.getTime())
    }
  })

  it('montos positivos, descripción y proveedor no vacíos, categoría válida', () => {
    for (const gasto of gastosMock) {
      expect(gasto.monto).toBeGreaterThan(0)
      expect(gasto.descripcion.length).toBeGreaterThan(0)
      expect(gasto.proveedor.length).toBeGreaterThan(0)
      expect(CATEGORIAS_GASTO).toContain(gasto.categoria)
    }
  })

  it('cubre al menos una vez cada una de las 6 categorías', () => {
    const vistas = new Set(gastosMock.map((gasto) => gasto.categoria))
    for (const categoria of CATEGORIAS_GASTO) {
      expect(vistas.has(categoria), `falta categoría ${categoria}`).toBe(true)
    }
  })
})

describe('etiquetaCategoria y coloresCategoria', () => {
  it('mapea las 6 categorías a español completo', () => {
    expect(etiquetaCategoria).toEqual({
      alquiler: 'Alquiler',
      servicios: 'Servicios',
      sueldos: 'Sueldos',
      equipamiento: 'Equipamiento',
      marketing: 'Marketing',
      otros: 'Otros',
    })
  })

  it('cada categoría tiene un color hex de chart', () => {
    for (const categoria of CATEGORIAS_GASTO) {
      expect(coloresCategoria[categoria]).toMatch(/^#[0-9a-f]{6}$/)
    }
  })
})

describe('gastosPorCategoria', () => {
  it('suma y cuenta por categoría, ordenado por total descendente', () => {
    const gastos = [
      gasto({ id: 'g-1', categoria: 'alquiler', monto: 300 }),
      gasto({ id: 'g-2', categoria: 'alquiler', monto: 250 }),
      gasto({ id: 'g-3', categoria: 'servicios', monto: 180 }),
      gasto({ id: 'g-4', categoria: 'otros', monto: 50 }),
    ]
    expect(gastosPorCategoria(gastos)).toEqual([
      { categoria: 'alquiler', etiqueta: 'Alquiler', cantidad: 2, total: 550 },
      { categoria: 'servicios', etiqueta: 'Servicios', cantidad: 1, total: 180 },
      { categoria: 'otros', etiqueta: 'Otros', cantidad: 1, total: 50 },
    ])
  })

  it('devuelve [] con lista vacía', () => {
    expect(gastosPorCategoria([])).toEqual([])
  })

  it('el total por categoría coincide con totalGastos sobre los mock', () => {
    const sumaCategorias = gastosPorCategoria(gastosMock).reduce(
      (suma, dato) => suma + dato.total,
      0,
    )
    expect(sumaCategorias).toBe(totalGastos(gastosMock))
  })
})

describe('gastosPorMes', () => {
  it('agrupa por mes con etiqueta en español, orden ascendente', () => {
    const gastos = [
      gasto({ id: 'g-1', fecha: '2026-08-05', monto: 80 }),
      gasto({ id: 'g-2', fecha: '2026-08-20', monto: 55 }),
      gasto({ id: 'g-3', fecha: '2026-09-03', monto: 210 }),
    ]
    expect(gastosPorMes(gastos)).toEqual([
      { clave: '2026-08', etiqueta: 'Ago 26', total: 135, cantidad: 2 },
      { clave: '2026-09', etiqueta: 'Sep 26', total: 210, cantidad: 1 },
    ])
  })

  it('devuelve [] con lista vacía', () => {
    expect(gastosPorMes([])).toEqual([])
  })
})

describe('totalGastos', () => {
  it('suma todos los montos sin rango', () => {
    const gastos = [
      gasto({ id: 'g-1', monto: 100.5 }),
      gasto({ id: 'g-2', monto: 200.5 }),
    ]
    expect(totalGastos(gastos)).toBe(301)
  })

  it('respeta rangoDias: solo gastos dentro del rango', () => {
    const gastos = [
      gasto({ id: 'g-1', monto: 50, fecha: isoHace(2) }),
      gasto({ id: 'g-2', monto: 500, fecha: isoHace(45) }),
    ]
    expect(totalGastos(gastos, 30)).toBe(50)
    expect(totalGastos(gastos, 60)).toBe(550)
    expect(totalGastos(gastos, 10)).toBe(50)
  })

  it('con lista vacía devuelve 0', () => {
    expect(totalGastos([])).toBe(0)
    expect(totalGastos([], 30)).toBe(0)
  })
})

describe('filtrarGastosPorDias', () => {
  it('incluye el día límite y excluye los anteriores', () => {
    const dentro = gasto({ id: 'g-1', fecha: isoHace(29) })
    const enLimite = gasto({ id: 'g-2', fecha: isoHace(30) })
    const fuera = gasto({ id: 'g-3', fecha: isoHace(31) })
    const filtrados = filtrarGastosPorDias([dentro, enLimite, fuera], 30)
    expect(filtrados).toEqual([dentro, enLimite])
  })

  it('con 0 días solo incluye gastos de hoy', () => {
    const hoy = gasto({ id: 'g-1', fecha: isoHace(0) })
    const ayer = gasto({ id: 'g-2', fecha: isoHace(1) })
    expect(filtrarGastosPorDias([hoy, ayer], 0)).toEqual([hoy])
  })

  it('mantiene el orden de la lista original', () => {
    const primero = gasto({ id: 'g-1', fecha: isoHace(1) })
    const segundo = gasto({ id: 'g-2', fecha: isoHace(2) })
    expect(filtrarGastosPorDias([primero, segundo], 30)).toEqual([primero, segundo])
  })
})
