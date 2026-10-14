import { describe, expect, it } from 'vitest'
import { parseMonto } from '../monto'

describe('parseMonto (monto peruano: coma o punto decimal)', () => {
  it('acepta coma decimal: "12,50" → 12.5', () => {
    expect(parseMonto('12,50')).toEqual({ valor: 12.5, error: null })
  })

  it('acepta punto decimal: "12.50" → 12.5', () => {
    expect(parseMonto('12.50')).toEqual({ valor: 12.5, error: null })
  })

  it('acepta un decimal y enteros', () => {
    expect(parseMonto('12,5')).toEqual({ valor: 12.5, error: null })
    expect(parseMonto('80')).toEqual({ valor: 80, error: null })
  })

  it('ignora espacios en los extremos', () => {
    expect(parseMonto('  80 ')).toEqual({ valor: 80, error: null })
  })

  it('separador colgante es válido mientras se escribe', () => {
    expect(parseMonto('12.')).toEqual({ valor: 12, error: null })
    expect(parseMonto('12,')).toEqual({ valor: 12, error: null })
  })

  it('vacío: sin valor y sin error (aún no se escribe nada)', () => {
    expect(parseMonto('')).toEqual({ valor: null, error: null })
    expect(parseMonto('   ')).toEqual({ valor: null, error: null })
  })

  it('rechaza notación científica: "1e5" ya no registra S/ 100000', () => {
    expect(parseMonto('1e5')).toEqual({
      valor: null,
      error: 'No se permite notación científica (ej. 1e5)',
    })
    expect(parseMonto('1E5').valor).toBeNull()
  })

  it('rechaza más de 2 decimales', () => {
    expect(parseMonto('12.505').valor).toBeNull()
    expect(parseMonto('12,505').error).toContain('2 decimales')
  })

  it('rechaza texto, negativos y separadores de miles', () => {
    expect(parseMonto('abc').valor).toBeNull()
    expect(parseMonto('-5').valor).toBeNull()
    expect(parseMonto('80a').valor).toBeNull()
    expect(parseMonto('1.000,50').valor).toBeNull()
  })

  it('rechaza cero y valores no finitos', () => {
    expect(parseMonto('0').error).toContain('mayor a')
    expect(parseMonto('0,00').valor).toBeNull()
    expect(parseMonto('9'.repeat(400)).valor).toBeNull()
  })
})
