import { describe, expect, it } from 'vitest'
import {
  etiquetaConcepto,
  etiquetaMetodo,
  formatoSoles,
  horaAhora,
  ingresosIniciales,
  movimientosIniciales,
  nuevoId,
  precioInscripcion,
  sociosMock,
} from '../caja-data'
import { formatoSoles as formatoSolesLib } from '@/lib/format'
import { sociosMock as sociosMockUnificados } from '@/mocks/data'

describe('unificación con el modelo canónico', () => {
  it('formatoSoles es literalmente la función de lib/format (sin duplicado)', () => {
    expect(formatoSoles).toBe(formatoSolesLib)
  })

  it('sociosMock es literalmente el de mocks/data (12 socios MS-###)', () => {
    expect(sociosMock).toBe(sociosMockUnificados)
    expect(sociosMock).toHaveLength(12)
    for (const socio of sociosMock) {
      expect(socio.codigo).toMatch(/^MS-\d{3}$/)
    }
  })
})

describe('formatoSoles (canónico: "S/ " con espacio normal)', () => {
  it('dos decimales y separador de miles', () => {
    expect(formatoSoles(80)).toBe('S/ 80.00')
    expect(formatoSoles(1234.5)).toBe('S/ 1,234.50')
    expect(formatoSoles(0)).toBe('S/ 0.00')
  })

  it('-0 no muestra signo y NaN lanza RangeError', () => {
    expect(formatoSoles(-0)).toBe('S/ 0.00')
    expect(() => formatoSoles(Number.NaN)).toThrow(RangeError)
  })
})

describe('horaAhora', () => {
  it('formato HH:MM en 24 horas con dígitos de dos posiciones', () => {
    expect(horaAhora()).toMatch(/^\d{2}:\d{2}$/)
  })

  it('nunca usa hora 24 (hourCycle h24 rompería el orden del día)', () => {
    const [hora] = horaAhora().split(':')
    expect(Number(hora)).toBeLessThanOrEqual(23)
  })
})

describe('nuevoId', () => {
  it('genera ids únicos en llamadas consecutivas', () => {
    const ids = new Set([nuevoId(), nuevoId(), nuevoId()])
    expect(ids.size).toBe(3)
  })
})

describe('etiquetas en español', () => {
  it('conceptos y métodos conservan acentos', () => {
    expect(etiquetaConcepto).toEqual({
      membresia: 'Membresía',
      inscripcion: 'Inscripción',
      producto: 'Producto',
    })
    expect(etiquetaMetodo).toEqual({
      efectivo: 'Efectivo',
      yape: 'Yape',
      plin: 'Plin',
    })
  })
})

describe('integridad de los seeds de caja', () => {
  const nombres = new Set(sociosMock.map((socio) => socio.nombre))

  it('ingresosIniciales: cada socio existe en sociosMock (nombre y código coherentes)', () => {
    for (const ingreso of ingresosIniciales) {
      const socio = sociosMock.find((s) => s.codigo === ingreso.socioCodigo)
      expect(socio).toBeDefined()
      expect(socio?.nombre).toBe(ingreso.socioNombre)
    }
  })

  it('ingresosIniciales: incluye aceptado, cobrado y denegado (el contador solo suma quienes entraron)', () => {
    const resultados = new Set(ingresosIniciales.map((ingreso) => ingreso.resultado))
    expect(resultados).toEqual(new Set(['aceptado', 'cobrado', 'denegado']))
  })

  it('movimientosIniciales: socios reales, montos finitos y total exacto S/ 147.50', () => {
    const total = movimientosIniciales.reduce((suma, m) => suma + m.monto, 0)
    expect(total).toBeCloseTo(147.5, 2)
    for (const movimiento of movimientosIniciales) {
      expect(nombres.has(movimiento.socioNombre)).toBe(true)
      expect(Number.isFinite(movimiento.monto)).toBe(true)
      expect(movimiento.monto).toBeGreaterThan(0)
    }
  })

  it('precioInscripcion es un monto positivo', () => {
    expect(precioInscripcion).toBeGreaterThan(0)
  })
})
