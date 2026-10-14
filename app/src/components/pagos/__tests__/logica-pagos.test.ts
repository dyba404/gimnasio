import { describe, expect, it } from 'vitest'
import {
  aCsv,
  agregarPorMes,
  agregarPorMetodo,
  agregarPorPlan,
  contarPorEstado,
  esIngreso,
  filtrarPorDias,
  ticketPromedio,
  totalMesEnCurso,
} from '../logica-pagos'
import type { Pago } from '@/mocks/pagos'

const HOY = new Date(2026, 8, 10)

function iso(diasAtras: number): string {
  const fecha = new Date(HOY)
  fecha.setDate(fecha.getDate() - diasAtras)
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${fecha.getFullYear()}-${mes}-${dia}`
}

function pago(par: Partial<Pago>): Pago {
  return {
    id: 'p-1',
    fecha: iso(1),
    socioId: 'soc-01',
    nombre: 'Rosa Ñahui Quispe',
    codigo: 'MS-001',
    dni: '45782136',
    planId: 'plan-mensual',
    planNombre: 'Mensual',
    monto: 80,
    metodo: 'efectivo',
    estado: 'completado',
    concepto: 'membresia',
    ...par,
  }
}

describe('esIngreso', () => {
  it('solo completado cuenta como ingreso', () => {
    expect(esIngreso(pago({ estado: 'completado' }))).toBe(true)
    expect(esIngreso(pago({ estado: 'pendiente' }))).toBe(false)
    expect(esIngreso(pago({ estado: 'anulado' }))).toBe(false)
  })
})

describe('agregarPorMes', () => {
  it('agrupa completados por mes, suma y cuenta, orden ascendente', () => {
    const pagos = [
      pago({ id: 'p-1', fecha: '2026-08-05', monto: 80 }),
      pago({ id: 'p-2', fecha: '2026-08-20', monto: 55 }),
      pago({ id: 'p-3', fecha: '2026-09-03', monto: 210 }),
      pago({ id: 'p-4', fecha: '2026-09-04', monto: 660, estado: 'anulado' }),
    ]
    expect(agregarPorMes(pagos)).toEqual([
      { clave: '2026-08', etiqueta: 'Ago 26', total: 135, cantidad: 2 },
      { clave: '2026-09', etiqueta: 'Sep 26', total: 210, cantidad: 1 },
    ])
  })

  it('ignora pendientes y devuelve [] sin ingresos', () => {
    expect(agregarPorMes([pago({ estado: 'pendiente' })])).toEqual([])
    expect(agregarPorMes([])).toEqual([])
  })
})

describe('agregarPorMetodo', () => {
  it('suma totales y porcentaje redondeado por método', () => {
    const pagos = [
      pago({ id: 'p-1', monto: 60, metodo: 'efectivo' }),
      pago({ id: 'p-2', monto: 40, metodo: 'efectivo' }),
      pago({ id: 'p-3', monto: 100, metodo: 'yape' }),
      pago({ id: 'p-4', monto: 50, metodo: 'plin', estado: 'anulado' }),
    ]
    const resumen = agregarPorMetodo(pagos)
    const efectivo = resumen.find((r) => r.metodo === 'efectivo')
    const yape = resumen.find((r) => r.metodo === 'yape')
    const plin = resumen.find((r) => r.metodo === 'plin')
    expect(efectivo).toMatchObject({ cantidad: 2, total: 100, porcentaje: 50 })
    expect(yape).toMatchObject({ cantidad: 1, total: 100, porcentaje: 50 })
    expect(plin).toMatchObject({ cantidad: 0, total: 0, porcentaje: 0 })
  })

  it('devuelve siempre los 3 métodos y 0% sin ingresos', () => {
    const resumen = agregarPorMetodo([])
    expect(resumen).toHaveLength(3)
    expect(resumen.every((r) => r.porcentaje === 0 && r.total === 0)).toBe(true)
  })
})

describe('agregarPorPlan', () => {
  it('agrupa por plan y ordena por recaudo descendente', () => {
    const pagos = [
      pago({ id: 'p-1', planId: 'plan-mensual', planNombre: 'Mensual', monto: 80 }),
      pago({ id: 'p-2', planId: 'plan-anual', planNombre: 'Anual', monto: 660 }),
      pago({ id: 'p-3', planId: 'plan-mensual', planNombre: 'Mensual', monto: 80 }),
    ]
    const resumen = agregarPorPlan(pagos)
    expect(resumen.map((r) => r.planId)).toEqual(['plan-anual', 'plan-mensual'])
    expect(resumen[1]).toMatchObject({ cantidad: 2, total: 160 })
  })
})

describe('filtrarPorDias', () => {
  it('incluye el día límite y excluye lo anterior', () => {
    const pagos = [
      pago({ id: 'p-1', fecha: iso(30) }),
      pago({ id: 'p-2', fecha: iso(31) }),
      pago({ id: 'p-3', fecha: iso(0) }),
    ]
    const filtrados = filtrarPorDias(pagos, 30, HOY)
    expect(filtrados.map((p) => p.id)).toEqual(['p-1', 'p-3'])
  })

  it('filtra solo por fecha, no por estado', () => {
    const pagos = [pago({ id: 'p-1', estado: 'anulado', fecha: iso(5) })]
    expect(filtrarPorDias(pagos, 30, HOY)).toHaveLength(1)
  })
})

describe('totalMesEnCurso', () => {
  it('suma solo completados del mes en curso', () => {
    const pagos = [
      pago({ id: 'p-1', fecha: '2026-09-01', monto: 80 }),
      pago({ id: 'p-2', fecha: '2026-09-09', monto: 55, estado: 'pendiente' }),
      pago({ id: 'p-3', fecha: '2026-08-30', monto: 660 }),
    ]
    expect(totalMesEnCurso(pagos, HOY)).toBe(80)
  })
})

describe('ticketPromedio', () => {
  it('promedia montos completados y devuelve 0 sin ingresos', () => {
    const pagos = [
      pago({ id: 'p-1', monto: 80 }),
      pago({ id: 'p-2', monto: 120 }),
      pago({ id: 'p-3', monto: 200, estado: 'anulado' }),
    ]
    expect(ticketPromedio(pagos)).toBeCloseTo(100, 2)
    expect(ticketPromedio([])).toBe(0)
  })
})

describe('contarPorEstado', () => {
  it('cuenta pagos del estado dado', () => {
    const pagos = [
      pago({ id: 'p-1', estado: 'pendiente' }),
      pago({ id: 'p-2', estado: 'pendiente' }),
      pago({ id: 'p-3', estado: 'completado' }),
    ]
    expect(contarPorEstado(pagos, 'pendiente')).toBe(2)
    expect(contarPorEstado(pagos, 'anulado')).toBe(0)
  })
})

describe('aCsv', () => {
  it('genera cabecera + una fila por pago con monto a 2 decimales', () => {
    const csv = aCsv([
      pago({ id: 'p-1', fecha: '2026-09-01', monto: 80, metodo: 'yape' }),
      pago({ id: 'p-2', fecha: '2026-09-02', monto: 30, concepto: 'inscripcion' }),
    ])
    const lineas = csv.split('\r\n')
    expect(lineas[0]).toBe('Fecha,Socio,Codigo,Plan,Metodo,Monto,Estado,Concepto')
    expect(lineas[1]).toBe('2026-09-01,Rosa Ñahui Quispe,MS-001,Mensual,yape,80.00,completado,membresia')
    expect(lineas[2]).toBe('2026-09-02,Rosa Ñahui Quispe,MS-001,Mensual,efectivo,30.00,completado,inscripcion')
    expect(lineas).toHaveLength(3)
  })

  it('escapa comas y comillas dobles en los campos', () => {
    const csv = aCsv([pago({ id: 'p-1', nombre: 'Ana "La Pro", S.A.C.' })])
    expect(csv).toContain('"Ana ""La Pro"", S.A.C."')
  })
})
